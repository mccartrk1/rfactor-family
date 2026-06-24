// app/api/v1/billing/checkout/route.ts
// Creates a Stripe Checkout session and returns the redirect URL

import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { withAuth } from '@/lib/api/middleware'
import { createCheckoutSession, PLANS } from '@/lib/stripe'
import type { PlanId } from '@/lib/stripe'

export const POST = withAuth(async (req, session) => {
  let planId: string
  try {
    const body = await req.json()
    planId = body.planId ?? ''
  } catch {
    return err('VALIDATION_ERROR', 'Invalid request body')
  }

  const validPlans: PlanId[] = ['family_monthly', 'family_yearly', 'school_yearly']
  if (!validPlans.includes(planId as PlanId)) {
    return err('VALIDATION_ERROR', `Invalid plan. Must be one of: ${validPlans.join(', ')}`)
  }

  if (!session.user.email) {
    return err('VALIDATION_ERROR', 'Account must have an email address to subscribe')
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://rfactor-family.vercel.app'
    const url = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      planId: planId as PlanId,
      successUrl: `${baseUrl}/billing?success=1`,
      cancelUrl: `${baseUrl}/pricing`,
    })
    return ok({ url })
  } catch (e) {
    return err('INTERNAL_ERROR', e instanceof Error ? e.message : 'Could not create checkout session')
  }
})
