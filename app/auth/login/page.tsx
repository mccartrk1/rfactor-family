'use client'
import { signIn } from 'next-auth/react'
import { useState, useRef } from 'react'

export default function LoginPage() {
  const [checking, setChecking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleContinue() {
    const code = inputRef.current?.value?.trim() || ''
    if (!code) return
    window.location.href = `/join/${code}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F2645', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 4px' }}>R Factor</p>
        <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: -2, lineHeight: 1.1 }}>Family<br />Program.</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', margin: '0 0 40px' }}>A framework your family learns together.</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>Enter your invite code to get started.</p>
        <input
          ref={inputRef}
          type="text"
          defaultValue=""
          placeholder="Invite code"
          style={{ width: '100%', padding: '16px 18px', fontSize: 16, fontFamily: 'inherit', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 14, background: 'rgba(255,255,255,0.08)', color: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
        />
        <button
          onClick={handleContinue}
          style={{ width: '100%', padding: '16px 22px', background: '#FF5C35', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
