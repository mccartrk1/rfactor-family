export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
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
      <h2 style={{ color: '#ff4444' }}>Authentication error</h2>
      <p style={{ color: '#aaa' }}>{searchParams.error}</p>
      <a href="/auth/login" style={{ color: '#1a73e8', marginTop: '16px' }}>
        Back to login
      </a>
    </div>
  )
}
