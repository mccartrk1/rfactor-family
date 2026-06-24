'use client'
// app/billing/client.tsx
// Complete billing management UI.
// Shows: current plan status, trial countdown, upgrade options, billing portal link.

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { C, R } from '@/components/tokens'
import { Button } from '@/components'
import type { SubscriptionResult } from '@/lib/subscription'

interface PlanInfo {
  id: string
  name: string
  price: number
  interval: string
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}

interface Props {
  userId: string
  userEmail: string
  status: SubscriptionResult
  plans: PlanInfo[]
  justUpgraded: boolean
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SubscriptionResult['status'] }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    active:       { label: 'Active',        bg: '#DCFCE7', color: '#166534' },
    trialing:     { label: 'Free Trial',    bg: '#DBEAFE', color: '#1E40AF' },
    grace_period: { label: 'Grace Period',  bg: '#FEF9C3', color: '#854D0E' },
    cancelled:    { label: 'Cancelling',    bg: '#FEE2E2', color: '#991B1B' },
    expired:      { label: 'Expired',       bg: '#FEE2E2', color: '#991B1B' },
    admin:        { label: 'Admin',         bg: '#F3E8FF', color: '#6B21A8' },
  }
  const c = config[status] ?? config.expired
  return (
    <span style={{ padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:800, background:c.bg, color:c.color }}>
      {c.label}
    </span>
  )
}

// ─── Trial countdown bar ───────────────────────────────────────────────────────
function TrialCountdown({ daysRemaining, isGrace }: { daysRemaining: number; isGrace: boolean }) {
  const pct = Math.max(0, Math.min(100, (daysRemaining / (isGrace ? 7 : 14)) * 100))
  const color = daysRemaining <= 3 ? '#EF4444' : isGrace ? '#F59E0B' : '#3B82F6'

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <p style={{ fontSize:13, fontWeight:700, color:C.navy, margin:0 }}>
          {isGrace ? 'Grace period' : 'Free trial'}
        </p>
        <p style={{ fontSize:13, fontWeight:800, color, margin:0 }}>
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
        </p>
      </div>
      <div style={{ height:8, background:'#F4F6FA', borderRadius:999, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:999, transition:'width 0.5s ease' }} />
      </div>
      {isGrace && daysRemaining <= 3 && (
        <p style={{ fontSize:12, color:'#EF4444', margin:'6px 0 0', fontWeight:600 }}>
          Your access will end soon. Upgrade to keep your family's progress.
        </p>
      )}
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onSelect, loading, isCurrentPlan }: {
  plan: PlanInfo
  onSelect: (id: string) => void
  loading: boolean
  isCurrentPlan: boolean
}) {
  return (
    <div style={{
      border: `2px solid ${plan.highlighted ? C.orange : isCurrentPlan ? C.navy : C.border}`,
      borderRadius: R.xl,
      padding: '24px 22px',
      background: plan.highlighted ? C.navy : '#fff',
      position:'relative',
    }}>
      {plan.highlighted && (
        <div style={{
          position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)',
          background:C.orange, color:'#fff', padding:'4px 16px',
          borderRadius:999, fontSize:11, fontWeight:800, whiteSpace:'nowrap',
        }}>
          BEST VALUE — SAVE 17%
        </div>
      )}
      {isCurrentPlan && (
        <div style={{
          position:'absolute', top:-14, right:16,
          background:C.navy, color:'#fff', padding:'4px 14px',
          borderRadius:999, fontSize:11, fontWeight:800,
        }}>
          Current plan
        </div>
      )}

      <p style={{ fontSize:14, fontWeight:700, color:plan.highlighted ? 'rgba(255,255,255,0.6)' : C.muted, margin:'0 0 6px' }}>
        {plan.name}
      </p>
      <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:16 }}>
        <span style={{ fontSize:36, fontWeight:900, color:plan.highlighted ? '#fff' : C.navy }}>
          ${plan.price}
        </span>
        <span style={{ fontSize:14, color:plan.highlighted ? 'rgba(255,255,255,0.5)' : C.muted }}>
          /{plan.interval}
        </span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
        {plan.features.slice(0, 4).map((f, i) => (
          <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
            <span style={{ color:plan.highlighted ? C.orange : C.green, fontWeight:900, flexShrink:0 }}>✓</span>
            <span style={{ fontSize:13, color:plan.highlighted ? 'rgba(255,255,255,0.8)' : C.text, lineHeight:1.4 }}>{f}</span>
          </div>
        ))}
      </div>
      <Button
        variant={plan.highlighted ? 'accent' : 'primary'}
        fullWidth
        loading={loading}
        disabled={isCurrentPlan}
        onClick={() => !isCurrentPlan && onSelect(plan.id)}
      >
        {isCurrentPlan ? 'Current plan' : plan.cta}
      </Button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BillingClient({ userId, userEmail, status, plans, justUpgraded }: Props) {
  const router = useRouter()
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)

  const handleUpgrade = useCallback(async (planId: string) => {
    setCheckingOut(planId)
    try {
      const res = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (data.data?.url) {
        window.location.href = data.data.url
      } else {
        alert(data.error?.message ?? 'Could not start checkout. Try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setCheckingOut(null)
    }
  }, [])

  const handleManageBilling = useCallback(async () => {
    setOpeningPortal(true)
    try {
      const res = await fetch('/api/v1/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.data?.url) {
        window.location.href = data.data.url
      } else {
        alert('Could not open billing portal. Contact support.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setOpeningPortal(false)
    }
  }, [])

  const showUpgrade = status.status !== 'active' && status.status !== 'admin'
  const showPortal  = status.status === 'active' || status.status === 'cancelled'

  return (
    <div style={{ minHeight:'100vh', background:'#F4F6FA', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ background:C.navy, padding:'52px 22px 32px' }}>
        <button
          onClick={() => router.push('/settings')}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:13, cursor:'pointer', padding:0, fontFamily:'inherit', marginBottom:16, display:'block' }}
        >
          ← Settings
        </button>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#fff', margin:'0 0 6px', letterSpacing:-0.5 }}>Billing</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', margin:0 }}>{userEmail}</p>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'24px 18px 64px', boxSizing:'border-box' as const }}>

        {/* Success banner */}
        {justUpgraded && (
          <div style={{ background:'#DCFCE7', border:'1.5px solid #86EFAC', borderRadius:R.lg, padding:'16px 20px', marginBottom:20 }}>
            <p style={{ fontSize:15, fontWeight:700, color:'#166534', margin:0 }}>🎉 Welcome to R Factor Family! Your subscription is active.</p>
          </div>
        )}

        {/* Current status */}
        <div style={{ background:'#fff', borderRadius:R.lg, border:`1.5px solid ${C.border}`, padding:20, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:status.trialDaysRemaining !== null ? 16 : 0 }}>
            <div>
              <p style={{ fontSize:11, color:C.muted, margin:'0 0 4px', fontWeight:700 }}>Current status</p>
              <p style={{ fontSize:16, fontWeight:800, color:C.navy, margin:0 }}>
                {status.plan ? status.plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Free Trial'}
              </p>
            </div>
            <StatusBadge status={status.status} />
          </div>

          {status.trialDaysRemaining !== null && (
            <TrialCountdown
              daysRemaining={status.trialDaysRemaining}
              isGrace={status.isInGracePeriod}
            />
          )}

          {status.graceDaysRemaining !== null && status.status === 'cancelled' && (
            <p style={{ fontSize:13, color:C.muted, margin:0 }}>
              Access continues until {status.subscriptionEndsAt?.toLocaleDateString('en-US', { month:'long', day:'numeric' })}
            </p>
          )}

          {showPortal && (
            <Button
              variant="secondary"
              size="sm"
              loading={openingPortal}
              onClick={handleManageBilling}
              style={{ marginTop:status.trialDaysRemaining !== null ? 0 : 12 }}
            >
              Manage billing →
            </Button>
          )}
        </div>

        {/* Upgrade plans */}
        {showUpgrade && (
          <>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, margin:'24px 0 12px' }}>
              Choose a plan
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handleUpgrade}
                  loading={checkingOut === plan.id}
                  isCurrentPlan={status.plan === plan.id}
                />
              ))}
            </div>
          </>
        )}

        {/* School / org section */}
        <div style={{ background:'#fff', borderRadius:R.lg, border:`1.5px solid ${C.border}`, padding:20, marginTop:16 }}>
          <p style={{ fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 6px' }}>School or organization?</p>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.5, margin:'0 0 12px' }}>
            Running R Factor for a school, church, or team? The School plan covers up to 25 families for $299/year.
          </p>
          <a
            href="mailto:hello@rfactorfamily.com?subject=School+Plan+Inquiry"
            style={{ fontSize:14, color:C.orange, fontWeight:700, textDecoration:'none' }}
          >
            Contact us →
          </a>
        </div>

        {/* Security note */}
        <p style={{ fontSize:11, color:C.muted, textAlign:'center', margin:'20px 0 0', lineHeight:1.6 }}>
          🔒 Payments processed securely by Stripe. We never store card details.
          Cancel anytime. Your progress is saved regardless of subscription status.
        </p>

      </div>
    </div>
  )
}
