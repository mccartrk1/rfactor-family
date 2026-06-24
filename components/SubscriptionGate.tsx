// components/SubscriptionGate.tsx
// Server component that checks subscription status before rendering children.
//
// USAGE:
//   Wrap any lesson or feature with this component.
//   If expired, shows an inline prompt instead of the gated content.
//
// EXAMPLE:
//   <SubscriptionGate userId={userId} userEmail={email} redirectTo="/billing">
//     <LessonContent />
//   </SubscriptionGate>
//
// NOTE: This is a server component. Import it in RSC pages only.
// For client-side gating (e.g., a button that starts a lesson),
// check subscription status server-side before rendering the client component.

import { redirect } from 'next/navigation'
import { getSubscriptionStatus } from '@/lib/subscription'
import type { ReactNode } from 'react'

interface Props {
  userId: string
  userEmail?: string | null
  children: ReactNode
  redirectTo?: string
  // If renderExpired is provided, render it instead of redirecting
  renderExpired?: ReactNode
}

export async function SubscriptionGate({ userId, userEmail, children, redirectTo, renderExpired }: Props) {
  const status = await getSubscriptionStatus(userId, userEmail)

  if (!status.hasAccess) {
    if (renderExpired) return <>{renderExpired}</>
    redirect(redirectTo ?? '/trial-expired')
  }

  return <>{children}</>
}

// ─── Trial banner — shows how many days are left ──────────────────────────────
// Render this at the top of the dashboard for users in trial or grace period.

interface TrialBannerProps {
  status: Awaited<ReturnType<typeof getSubscriptionStatus>>
}

export function TrialBannerServer({ status }: TrialBannerProps) {
  if (status.status === 'active' || status.status === 'admin') return null

  if (status.status === 'trialing' && status.trialDaysRemaining !== null) {
    const urgent = status.trialDaysRemaining <= 3
    return (
      <div style={{
        background: urgent ? '#FEE2E2' : '#DBEAFE',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <p style={{ fontSize: 13, margin: 0, color: urgent ? '#991B1B' : '#1E40AF', fontWeight: 600 }}>
          {status.trialDaysRemaining} day{status.trialDaysRemaining !== 1 ? 's' : ''} left in your free trial
        </p>
        <a href="/billing" style={{
          fontSize: 12, fontWeight: 800, color: urgent ? '#991B1B' : '#1E40AF',
          textDecoration: 'none', whiteSpace: 'nowrap',
          borderBottom: `1.5px solid currentColor`,
        }}>
          Subscribe →
        </a>
      </div>
    )
  }

  if (status.status === 'grace_period') {
    return (
      <div style={{
        background: '#FEF3C7',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <p style={{ fontSize: 13, margin: 0, color: '#92400E', fontWeight: 600 }}>
          ⚠ Your trial ended — {status.graceDaysRemaining} day{status.graceDaysRemaining !== 1 ? 's' : ''} left to subscribe
        </p>
        <a href="/billing" style={{ fontSize: 12, fontWeight: 800, color: '#92400E', textDecoration: 'none', borderBottom: '1.5px solid currentColor', whiteSpace: 'nowrap' }}>
          Subscribe now →
        </a>
      </div>
    )
  }

  return null
}
