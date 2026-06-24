'use client'
// app/auth/login/page.tsx
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Image from 'next/image'

export default function LoginPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [codeValid, setCodeValid] = useState(false)

  async function checkCode() {
    if (!inviteCode.trim()) return
    setChecking(true)
    setError('')
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode }),
    })
    const data = await res.json()
    setChecking(false)
    if (data.valid) {
      setCodeValid(true)
      sessionStorage.setItem('rf_invite', inviteCode)
    } else {
      setError(data.error || 'Invalid code')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F2645', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <Image src="/images/app-icon.png" alt="R Factor" width={72} height={72} style={{ borderRadius: 18, margin: '0 auto 20px', display: 'block' }} />
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 4px' }}>R Factor</p>
        <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: -2, lineHeight: 1.1 }}>Family<br />Program.</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', margin: '0 0 40px' }}>A framework your family learns together.</p>

        {!codeValid ? (
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>Enter your invite code to get started.</p>
            <input
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkCode()}
              placeholder="Invite code"
              style={{ width: '100%', padding: '16px 18px', fontSize: 16, fontFamily: 'inherit', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 14, background: 'rgba(255,255,255,0.08)', color: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
            />
            {error && <p style={{ fontSize: 12, color: '#FF5C35', margin: '0 0 12px' }}>{error}</p>}
            <button
              onClick={checkCode}
              disabled={checking || !inviteCode.trim()}
              style={{ width: '100%', padding: '16px 22px', background: inviteCode.trim() ? '#FF5C35' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: inviteCode.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >
              {checking ? 'Checking...' : 'Continue →'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 20px' }}>Code accepted. Sign in with Google to continue.</p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              style={{ width: '100%', padding: '16px 22px', background: '#fff', color: '#0F2645', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
