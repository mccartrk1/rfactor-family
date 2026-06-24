'use client'
import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginRedirect() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`
  }, [callbackUrl])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F2645',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
        Redirecting to Google...
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#0F2645',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
          Loading...
        </p>
      </div>
    }>
      <LoginRedirect />
    </Suspense>
  )
}
