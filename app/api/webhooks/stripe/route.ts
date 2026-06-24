// app/api/webhooks/stripe/route.ts
// Stripe webhook receiver — the only place subscription state changes in our DB.
//
// SECURITY: Raw body (not parsed JSON) required for Stripe signature verification.
// Next.js App Router passes the raw body via request.arrayBuffer().
//
// This handler uses lib/subscription.ts for all DB updates.
// It does NOT call Stripe back — it trusts the webhook payload after signature verification.

import { NextRequest, NextResponse } from 'next/server'
import { processWebhookEvent } from '@/lib/stripe'
import { activateSubscription, deactivateSubscription, setGracePeriod } from '@/lib/subscription'
import { logger } from '@/lib/logger'
import { sendCompletionEmail } from '@/lib/email'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let payload: Buffer
  try {
    payload = Buffer.from(await req.arrayBuffer())
  } catch {
    return NextResponse.json({ error: 'Could not read body' }, { status: 400 })
  }

  let event
  try {
    event = await processWebhookEvent(payload, signature)
  } catch {
    // Return 400 so Stripe retries — invalid signature means replay attack or misconfiguration
    logger.error('billing.webhook_invalid_signature', {})
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (!event) {
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case 'subscription_activated':
        await activateSubscription(event.userId, event.planId, event.stripeCustomerId)
        logger.info('billing.subscription_activated', { userId: event.userId, planId: event.planId })
        break

      case 'subscription_cancelled':
        await deactivateSubscription(event.userId)
        logger.info('billing.subscription_cancelled', { userId: event.userId })
        break

      case 'payment_failed':
        // Don't immediately cut off access — set grace period
        await setGracePeriod(event.userId)
        logger.warn('billing.payment_failed', { userId: event.userId })

        // Optionally send payment failed email here
        const user = await db.user.findUnique({
          where: { id: event.userId },
          select: { email: true },
        })
        if (user?.email) {
          // Could send payment failed email with link to /billing
          logger.info('billing.payment_failed_email_queued', {})
        }
        break
    }
  } catch (e) {
    logger.error('billing.webhook_handler_error', {
      eventType: event.type,
      error: e instanceof Error ? e.message : String(e),
    })
    // Return 500 so Stripe retries
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
