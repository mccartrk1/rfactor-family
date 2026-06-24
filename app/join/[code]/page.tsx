// app/join/[code]/page.tsx
// Referral landing page — /join/mccarty7
// Shows who referred the user and drives signup.
// If already logged in: applies referral and redirects to onboarding.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

interface Props { params: { code: string } }

export default async function JoinPage({ params }: Props) {
  const { code } = params

  // Find the referrer
  const referrer = await db.user.findFirst({
    where: { referralCode: code } as any,
    select: { id: true, name: true, family: { select: { familyName: true } } },
  })

  // Check if already logged in
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    // Apply the referral code and redirect to onboarding
    try {
      await fetch('/api/v1/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
    } catch {}
    redirect('/onboard?ref=' + code)
  }

  const referrerName = referrer?.family?.familyName
    ? `The ${referrer.family.familyName} family`
    : referrer?.name?.split(' ')[0] ?? 'A family'

  return (
    <div style={{ minHeight:'100vh', background:'#0F2645', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth:420, textAlign:'center' }}>
        <p style={{ fontSize:48, margin:'0 0 20px' }}>👋</p>
        <p style={{ fontSize:13, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', margin:'0 0 12px' }}>
          You were invited
        </p>
        <h1 style={{ fontSize:30, fontWeight:900, color:'#fff', margin:'0 0 12px', letterSpacing:-0.5 }}>
          {referrer ? `${referrerName} invited you to R Factor Family` : 'Welcome to R Factor Family'}
        </h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,0.65)', lineHeight:1.7, margin:'0 0 32px' }}>
          A 13-week behavioral coaching program that teaches kids the most important
          life skill there is: E + R = O.
        </p>

        <div style={{ background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:16, padding:'20px', marginBottom:24 }}>
          <p style={{ fontSize:15, fontWeight:700, color:'#FF5C35', margin:'0 0 4px' }}>
            🎁 Your trial is extended to 21 days
          </p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', margin:0 }}>
            Because you were referred — you get one week extra free.
          </p>
        </div>

        <a
          href={`/auth/login?callbackUrl=/onboard%3Fref=${code}`}
          style={{ display:'block', padding:'18px 28px', background:'#FF5C35', color:'#fff', textDecoration:'none', borderRadius:14, fontSize:17, fontWeight:800 }}
        >
          Start your free trial →
        </a>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', margin:'20px 0 0' }}>
          Sign in with Google. No credit card required to start.
        </p>
      </div>
    </div>
  )
}
