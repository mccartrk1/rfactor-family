// app/billing/page.tsx
// Server component — loads real subscription status and renders billing UI.
// This page is reachable from: settings, trial expiry banner, upgrade CTAs.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSubscriptionStatus } from '@/lib/subscription'
import { PLANS } from '@/lib/stripe'
import { BillingClient } from './client'

export const metadata = { title: 'Billing — R Factor Family' }

// Force dynamic — subscription status must be fresh on every visit
export const dynamic = 'force-dynamic'

export default async function BillingPage({ searchParams }: { searchParams: { success?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  const status = await getSubscriptionStatus(session.user.id, session.user.email)
  const justUpgraded = searchParams.success === '1'

  return (
    <BillingClient
      userId={session.user.id}
      userEmail={session.user.email ?? ''}
      status={status}
      plans={[
        {
          id: 'family_monthly',
          name: PLANS.family_monthly.name,
          price: PLANS.family_monthly.price,
          interval: PLANS.family_monthly.interval,
          description: PLANS.family_monthly.description,
          features: PLANS.family_monthly.features,
          cta: PLANS.family_monthly.cta,
          highlighted: false,
        },
        {
          id: 'family_yearly',
          name: PLANS.family_yearly.name,
          price: PLANS.family_yearly.price,
          interval: PLANS.family_yearly.interval,
          description: PLANS.family_yearly.description,
          features: PLANS.family_yearly.features,
          cta: PLANS.family_yearly.cta,
          highlighted: true,
        },
      ]}
      justUpgraded={justUpgraded}
    />
  )
}
