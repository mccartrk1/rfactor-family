// lib/stripe.ts
//
// Stripe billing integration for R Factor Family App.
//
// THREE TIERS:
//   Family:      $9.99/month or $99/year  — direct-to-consumer families
//   School:      $299/year per cohort     — schools, churches, community orgs
//   Enterprise:  Custom pricing            — corporate/Focus 3 partnership
//
// SETUP:
//   1. stripe.com → Create account → Get API keys
//   2. Create products + prices in Stripe Dashboard (or use seed script below)
//   3. Set up webhook endpoint: /api/webhooks/stripe
//   4. Add env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_*_PRICE_ID
//
// ENV VARS REQUIRED:
//   STRIPE_SECRET_KEY           — sk_live_... (never expose to client)
//   STRIPE_WEBHOOK_SECRET       — whsec_... (from Stripe webhook settings)
//   STRIPE_FAMILY_MONTHLY_ID    — price_... (Family monthly plan)
//   STRIPE_FAMILY_YEARLY_ID     — price_... (Family yearly plan)
//   STRIPE_SCHOOL_YEARLY_ID     — price_... (School yearly plan)

import Stripe from 'stripe'

// Lazy initialization — prevents startup failure when key isn't set in dev
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is required')
    _stripe = new Stripe(key, { apiVersion: '2024-06-20' })
  }
  return _stripe
}

// ─── Plan definitions ─────────────────────────────────────────────────────────

export type PlanId = 'family_monthly' | 'family_yearly' | 'school_yearly' | 'enterprise'

export interface Plan {
  id: PlanId
  name: string
  price: number
  interval: 'month' | 'year'
  description: string
  features: string[]
  cta: string
  highlighted: boolean
  maxChildren: number
  priceId: () => string | null  // lazy — reads from env at call time
}

export const PLANS: Record<PlanId, Plan> = {
  family_monthly: {
    id: 'family_monthly',
    name: 'Family',
    price: 9.99,
    interval: 'month',
    description: 'The full 13-week program for your family',
    features: [
      'Personalized AI scenarios for each child',
      'Up to 5 children',
      '13-week structured curriculum',
      'Parent tips for every lesson',
      'Digital completion certificate',
      'Lesson progress tracking',
    ],
    cta: 'Start free trial',
    highlighted: false,
    maxChildren: 5,
    priceId: () => process.env.STRIPE_FAMILY_MONTHLY_ID ?? null,
  },
  family_yearly: {
    id: 'family_yearly',
    name: 'Family — Annual',
    price: 99,
    interval: 'year',
    description: 'Save 17% with annual billing',
    features: [
      'Everything in Family plan',
      '2 months free vs monthly',
      'Early access to new curriculum',
    ],
    cta: 'Save 17%',
    highlighted: true,
    maxChildren: 5,
    priceId: () => process.env.STRIPE_FAMILY_YEARLY_ID ?? null,
  },
  school_yearly: {
    id: 'school_yearly',
    name: 'School / Organization',
    price: 299,
    interval: 'year',
    description: 'For schools, churches, and community organizations',
    features: [
      'Up to 25 enrolled families',
      'Organization admin dashboard',
      'Cohort progress reporting',
      'Custom invite codes for your community',
      'Bulk family enrollment',
      'Email support',
    ],
    cta: 'Contact us',
    highlighted: false,
    maxChildren: 999,
    priceId: () => process.env.STRIPE_SCHOOL_YEARLY_ID ?? null,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    interval: 'year',
    description: 'For corporate partners and large organizations',
    features: [
      'Unlimited families',
      'White-label branding',
      'Custom curriculum integration',
      'SSO and enterprise auth',
      'Dedicated success manager',
      'SLA and priority support',
      'Research data access',
    ],
    cta: 'Talk to us',
    highlighted: false,
    maxChildren: 99999,
    priceId: () => null,
  },
}

// ─── Subscription management ──────────────────────────────────────────────────

export interface CreateCheckoutInput {
  userId: string
  userEmail: string
  planId: 'family_monthly' | 'family_yearly' | 'school_yearly'
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(input: CreateCheckoutInput): Promise<string> {
  const stripe = getStripe()
  const plan = PLANS[input.planId]
  const priceId = plan.priceId()

  if (!priceId) {
    throw new Error(`Price ID not configured for plan: ${input.planId}. Set STRIPE_${input.planId.toUpperCase()}_ID`)
  }

  // Create or retrieve Stripe customer
  const customers = await stripe.customers.list({ email: input.userEmail, limit: 1 })
  let customer = customers.data[0]

  if (!customer) {
    customer = await stripe.customers.create({
      email: input.userEmail,
      metadata: { userId: input.userId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${input.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: input.cancelUrl,
    subscription_data: {
      metadata: { userId: input.userId, planId: input.planId },
      trial_period_days: 14,  // 14-day free trial
    },
    allow_promotion_codes: true,  // enables coupon redemption
    billing_address_collection: 'required',
    metadata: { userId: input.userId, planId: input.planId },
  })

  return session.url!
}

export async function createBillingPortalSession(stripeCustomerId: string, returnUrl: string): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
  return session.url
}

export async function getSubscriptionStatus(stripeCustomerId: string): Promise<{
  active: boolean
  planId: string | null
  status: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  trialEnd: Date | null
}> {
  const stripe = getStripe()

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    limit: 1,
    expand: ['data.items.data.price'],
  })

  const sub = subscriptions.data[0]
  if (!sub) {
    return { active: false, planId: null, status: 'none', currentPeriodEnd: null, cancelAtPeriodEnd: false, trialEnd: null }
  }

  return {
    active: sub.status === 'active' || sub.status === 'trialing',
    planId: (sub.metadata.planId as string) ?? null,
    status: sub.status,
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
  }
}

// ─── Webhook event processing ─────────────────────────────────────────────────

export type WebhookEvent =
  | { type: 'subscription_activated'; userId: string; planId: string; stripeCustomerId: string }
  | { type: 'subscription_cancelled'; userId: string; stripeCustomerId: string }
  | { type: 'payment_failed'; userId: string; stripeCustomerId: string }

export async function processWebhookEvent(
  payload: Buffer,
  signature: string
): Promise<WebhookEvent | null> {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured')

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch {
    throw new Error('Invalid webhook signature')
  }

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      if (sub.status === 'active' || sub.status === 'trialing') {
        return {
          type: 'subscription_activated',
          userId: sub.metadata.userId,
          planId: sub.metadata.planId,
          stripeCustomerId: sub.customer as string,
        }
      }
      return null
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      return {
        type: 'subscription_cancelled',
        userId: sub.metadata.userId,
        stripeCustomerId: sub.customer as string,
      }
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      return {
        type: 'payment_failed',
        userId: (invoice.subscription_details?.metadata?.userId as string) ?? '',
        stripeCustomerId: invoice.customer as string,
      }
    }

    default:
      return null
  }
}
