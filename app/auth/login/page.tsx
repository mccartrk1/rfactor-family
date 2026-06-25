import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  if (searchParams.error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a1628',
        color: 'white',
        fontFamily: 'sans-serif',
      }}>
        <h2 style={{ color: '#ff4444' }}>Sign-in error: {searchParams.error}</h2>
        <p style={{ color: '#aaa', marginTop: '8px' }}>Check Vercel logs for details.</p>
        
          href="/api/auth/signin/google"
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            backgroundColor: '#1a73e8',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          Try again
        </a>
      </div>
    )
  }

  redirect('/api/auth/signin/google')
}
