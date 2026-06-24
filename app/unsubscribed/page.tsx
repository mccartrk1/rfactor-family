// app/unsubscribed/page.tsx

export default function UnsubscribedPage({ searchParams }: { searchParams: { error?: string } }) {
  const hasError = searchParams.error === '1'
  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <p style={{ fontSize: 48, margin: '0 0 16px' }}>{hasError ? '⚠️' : '✓'}</p>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F2645', margin: '0 0 12px' }}>
          {hasError ? 'Link expired' : 'You\'re unsubscribed'}
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, margin: '0 0 24px' }}>
          {hasError
            ? 'This unsubscribe link has expired. Sign in to manage your email preferences in Settings.'
            : 'You won\'t receive lesson reminders anymore. Your account and progress are unchanged. You can re-enable emails in Settings at any time.'}
        </p>
        <a href="/dashboard" style={{ display: 'inline-block', padding: '12px 24px', background: '#0F2645', color: '#fff', textDecoration: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700 }}>
          Go to dashboard
        </a>
      </div>
    </div>
  )
}
