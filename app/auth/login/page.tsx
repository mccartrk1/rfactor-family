import { redirect } from 'next/navigation'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string }
}) {
  if (searchParams.error) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0F2645',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 16
      }}>
        <p style={{ color: '#FF5C35', fontSize: 18, fontWeight: 700 }}>
          Sign-in error: {searchParams.error}
        </p>
        <a href="/api/auth/signin/google"
          style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
          Try again
        </a>
      </div>
    )
  }

  const callbackUrl = searchParams.callbackUrl || '/dashboard'
  redirect(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`)
}
