// app/admin/layout.tsx
// Server component — auth check happens before any page renders.
// Non-admins are redirected at middleware AND here (defense in depth).

import { requireAdmin } from '@/lib/admin'
import { ReactNode } from 'react'

export const metadata = { title: 'Admin — R Factor' }

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Throws and redirects if not admin — nothing below renders
  const email = await requireAdmin()

  return (
    <div style={{ minHeight: '100vh', background: '#0F2645', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Admin nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 32 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#FF5C35', letterSpacing: '0.06em' }}>⚙ ADMIN</span>
        <a href="/admin" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Overview</a>
        <a href="/admin/families" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Families</a>
        <a href="/admin/invites" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Invites</a>
        <a href="/admin/orgs" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Organizations</a>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{email}</span>
        <a href="/dashboard" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← App</a>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px' }}>
        {children}
      </main>
    </div>
  )
}
