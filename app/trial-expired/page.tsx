// app/trial-expired/page.tsx
// Shown when a user's trial has expired and they haven't upgraded.
// The goal: convert them. Not shame them. Make it easy.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSubscriptionStatus } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export default async function TrialExpiredPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  const status = await getSubscriptionStatus(session.user.id, session.user.email)

  // If they somehow have access now (upgraded, org added), send them home
  if (status.hasAccess) redirect('/dashboard')

  return (
    <div style={{ minHeight:'100vh', background:'#0F2645', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth:440, textAlign:'center' }}>
        <p style={{ fontSize:48, margin:'0 0 20px' }}>⏰</p>
        <h1 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:'0 0 12px', letterSpacing:-0.5 }}>
          Your free trial has ended
        </h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,0.65)', lineHeight:1.7, margin:'0 0 32px' }}>
          Your family's progress, children, and all 13 weeks are saved and waiting.
          Subscribe to pick up exactly where you left off.
        </p>

        <div style={{ background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:16, padding:'24px', marginBottom:24 }}>
          <p style={{ fontSize:24, fontWeight:900, color:'#FF5C35', margin:'0 0 4px' }}>$9.99/month</p>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', margin:'0 0 16px' }}>or $99/year (save 17%)</p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6, margin:0 }}>
            Unlimited AI scenarios · All 13 weeks · Up to 5 children · Completion certificate
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <a
            href="/billing"
            style={{ display:'block', padding:'16px 24px', background:'#FF5C35', color:'#fff', textDecoration:'none', borderRadius:12, fontSize:16, fontWeight:800 }}
          >
            Subscribe and continue →
          </a>
          <a
            href="/dashboard"
            style={{ display:'block', padding:'14px 24px', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.65)', textDecoration:'none', borderRadius:12, fontSize:14, fontWeight:600, border:'1px solid rgba(255,255,255,0.1)' }}
          >
            Go to dashboard (limited access)
          </a>
        </div>

        <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', margin:'24px 0 0' }}>
          Questions? Email hello@rfactorfamily.com
        </p>
      </div>
    </div>
  )
}
