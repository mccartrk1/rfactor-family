// lib/subscription.ts
//
// SUBSCRIPTION STATUS SERVICE
//
// This is the single source of truth for "can this user access the app?"
// Every gated route calls getSubscriptionStatus() to determine access.
//
// ARCHITECTURE DECISIONS:
//
// 1. DB cache, not Redis: Serverless functions share no memory. Redis adds
//    $15+/month at this scale. We cache the Stripe subscription status in
//    User.subscriptionActive and update it via webhooks. The DB lookup is
//    ~1ms on a warm connection — acceptable.
//
// 2. Grace period: Payment failures don't immediately lock out families.
//    A 7-day grace period prevents a family mid-lesson from being cut off
//    due to a temporary card issue. The grace period also protects the demo.
//
// 3. Org inheritance: If a family belongs to an organization with an active
//    subscription, they inherit access. Schools pay once; all families benefit.
//    This is checked at the organization level, not per-user.
//
// 4. Admin bypass: Emails in ADMIN_EMAILS always have full access.
//    This prevents Ryan from locking himself out during testing.
//
// 5. Trial setup at enrollment: When a child is created, the user's trial
//    starts immediately (if not already set). This ensures 14 days from
//    first use, not 14 days from account creation.

import { db } from '@/lib/db'
import { isAdminEmail } from '@/lib/admin'
import { logger } from '@/lib/logger'

// ─── Status types ─────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | 'active'        // paid subscription, active
  | 'trialing'      // within 14-day trial
  | 'grace_period'  // trial or payment grace (within 7 days of expiry)
  | 'expired'       // trial ended, no subscription, grace period over
  | 'cancelled'     // cancelled but access until period_end
  | 'admin'         // admin bypass — always access

export interface SubscriptionResult {
  status: SubscriptionStatus
  hasAccess: boolean
  trialDaysRemaining: number | null
  graceDaysRemaining: number | null
  plan: string | null
  trialEndsAt: Date | null
  subscriptionEndsAt: Date | null
  isInGracePeriod: boolean
}

const TRIAL_DAYS  = 14
const GRACE_DAYS  =  7

// ─── Core status check ────────────────────────────────────────────────────────

export async function getSubscriptionStatus(
  userId: string,
  userEmail?: string | null
): Promise<SubscriptionResult> {
  const now = new Date()

  // Admin bypass — always allow
  if (userEmail && isAdminEmail(userEmail)) {
    return {
      status: 'admin',
      hasAccess: true,
      trialDaysRemaining: null,
      graceDaysRemaining: null,
      plan: 'admin',
      trialEndsAt: null,
      subscriptionEndsAt: null,
      isInGracePeriod: false,
    }
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionActive: true,
      subscriptionTier: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
      family: {
        select: {
          organizationId: true,
          organization: {
            select: { isActive: true, tier: true },
          },
        },
      },
    } as any,
  })

  if (!user) {
    return {
      status: 'expired',
      hasAccess: false,
      trialDaysRemaining: null,
      graceDaysRemaining: null,
      plan: null,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      isInGracePeriod: false,
    }
  }

  const u = user as any

  // ── Priority 1: Active paid subscription ──────────────────────────────────
  if (u.subscriptionActive) {
    return {
      status: 'active',
      hasAccess: true,
      trialDaysRemaining: null,
      graceDaysRemaining: null,
      plan: u.subscriptionTier,
      trialEndsAt: u.trialEndsAt,
      subscriptionEndsAt: u.subscriptionEndsAt,
      isInGracePeriod: false,
    }
  }

  // ── Priority 2: Organization subscription inheritance ─────────────────────
  if (u.family?.organization?.isActive) {
    return {
      status: 'active',
      hasAccess: true,
      trialDaysRemaining: null,
      graceDaysRemaining: null,
      plan: `org:${u.family.organization.tier}`,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      isInGracePeriod: false,
    }
  }

  // ── Priority 3: Cancelled but still within billing period ─────────────────
  if (u.subscriptionEndsAt && u.subscriptionEndsAt > now) {
    const daysRemaining = Math.ceil((u.subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return {
      status: 'cancelled',
      hasAccess: true,
      trialDaysRemaining: null,
      graceDaysRemaining: daysRemaining,
      plan: u.subscriptionTier,
      trialEndsAt: u.trialEndsAt,
      subscriptionEndsAt: u.subscriptionEndsAt,
      isInGracePeriod: false,
    }
  }

  // ── Priority 4: Trial period ───────────────────────────────────────────────
  if (u.trialEndsAt) {
    const trialEnd = new Date(u.trialEndsAt)
    const graceEnd = new Date(trialEnd.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000)

    if (trialEnd > now) {
      // Active trial
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        status: 'trialing',
        hasAccess: true,
        trialDaysRemaining: daysRemaining,
        graceDaysRemaining: null,
        plan: null,
        trialEndsAt: trialEnd,
        subscriptionEndsAt: null,
        isInGracePeriod: false,
      }
    }

    if (graceEnd > now) {
      // Grace period (trial ended, 7-day window to subscribe)
      const graceDays = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      logger.warn('subscription.in_grace_period', { userId, graceDaysRemaining: graceDays })
      return {
        status: 'grace_period',
        hasAccess: true,
        trialDaysRemaining: 0,
        graceDaysRemaining: graceDays,
        plan: null,
        trialEndsAt: trialEnd,
        subscriptionEndsAt: null,
        isInGracePeriod: true,
      }
    }
  }

  // ── Priority 5: Expired — no access ───────────────────────────────────────
  logger.info('subscription.expired', { userId })
  return {
    status: 'expired',
    hasAccess: false,
    trialDaysRemaining: 0,
    graceDaysRemaining: 0,
    plan: null,
    trialEndsAt: u.trialEndsAt,
    subscriptionEndsAt: null,
    isInGracePeriod: false,
  }
}

// ─── Trial initialization ─────────────────────────────────────────────────────
// Called when a user creates their first child.
// If trial hasn't started yet, start it now.

export async function initializeTrial(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { trialEndsAt: true } as any,
  })

  if ((user as any)?.trialEndsAt) return  // already started

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

  await db.user.update({
    where: { id: userId },
    data: { trialEndsAt } as any,
  })

  logger.info('subscription.trial_started', { userId, trialEndsAt })
}

// ─── Subscription update from Stripe webhook ──────────────────────────────────

export async function activateSubscription(
  userId: string,
  planId: string,
  stripeCustomerId: string
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId,
      subscriptionTier: planId,
      subscriptionActive: true,
      gracePeriodEndsAt: null,
      lastSubscriptionCheck: new Date(),
    } as any,
  })
  logger.info('subscription.activated', { userId, planId })
}

export async function deactivateSubscription(
  userId: string,
  subscriptionEndsAt?: Date
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionActive: false,
      subscriptionEndsAt: subscriptionEndsAt ?? null,
      lastSubscriptionCheck: new Date(),
    } as any,
  })
  logger.info('subscription.deactivated', { userId })
}

export async function setGracePeriod(userId: string): Promise<void> {
  const gracePeriodEndsAt = new Date()
  gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + GRACE_DAYS)

  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionActive: false,
      gracePeriodEndsAt,
      lastSubscriptionCheck: new Date(),
    } as any,
  })
  logger.warn('subscription.grace_period_set', { userId, gracePeriodEndsAt })
}

// ─── Admin billing metrics ────────────────────────────────────────────────────
// Used by the investor dashboard.

export async function getBillingMetrics(): Promise<{
  activeSubscriptions: number
  trialing: number
  expired: number
  graceperiod: number
  mrr: number
  trialConversionEst: number
}> {
  const now = new Date()
  const trialGraceEnd = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000)

  const [active, trialing, expired, graceperiod] = await Promise.all([
    db.user.count({ where: { subscriptionActive: true } as any }),
    db.user.count({ where: { subscriptionActive: false, trialEndsAt: { gt: now } } as any }),
    db.user.count({ where: { subscriptionActive: false, trialEndsAt: { lt: trialGraceEnd } } as any }),
    db.user.count({ where: {
      subscriptionActive: false,
      trialEndsAt: { lt: now, gt: trialGraceEnd }
    } as any }),
  ])

  // Estimate MRR — assumes all active are on monthly plan
  // For accuracy, track plan in subscription tier and price map
  const PLAN_PRICES: Record<string, number> = {
    family_monthly: 9.99,
    family_yearly:  99 / 12,  // annualized to monthly
    school_yearly:  299 / 12,
    enterprise:     500,      // placeholder
  }

  const activeUsers = await db.user.findMany({
    where: { subscriptionActive: true } as any,
    select: { subscriptionTier: true } as any,
  })

  const mrr = (activeUsers as any[]).reduce((sum, u) => {
    const price = PLAN_PRICES[(u as any).subscriptionTier ?? ''] ?? 9.99
    return sum + price
  }, 0)

  const trialConversionEst = active > 0 && trialing > 0
    ? Math.round((active / (active + expired)) * 100)
    : 0

  return { activeSubscriptions: active, trialing, expired, graceperiod, mrr: Math.round(mrr * 100) / 100, trialConversionEst }
}
