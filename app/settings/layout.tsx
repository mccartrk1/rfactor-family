// app/settings/layout.tsx
// Server component — settings navigation shell.
// Wraps all settings pages with consistent nav.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

export const metadata = { title: 'Settings — R Factor' }

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0F2645', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Dashboard
        </a>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>|</span>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Settings</span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px 64px', boxSizing: 'border-box' as const }}>
        {children}
      </div>
    </div>
  )
}
