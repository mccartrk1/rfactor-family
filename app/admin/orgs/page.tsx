// app/admin/orgs/page.tsx
// Super-admin organization list.
// Every organization, its tier, family count, and activity status.

import { requireAdmin } from '@/lib/admin'
import { getOrgList } from '@/lib/admin'
import Link from 'next/link'

export const metadata = { title: 'Organizations — Admin' }

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    pilot:      { bg: '#DBEAFE', color: '#1E40AF' },
    pro:        { bg: '#DCFCE7', color: '#166534' },
    enterprise: { bg: '#F3E8FF', color: '#6B21A8' },
  }
  const s = styles[tier] ?? styles.pilot
  return (
    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: s.bg, color: s.color }}>
      {tier.toUpperCase()}
    </span>
  )
}

export default async function OrgsPage() {
  await requireAdmin()
  const orgs = await getOrgList()

  const totalFamilies = orgs.reduce((s, o) => s + o.familyCount, 0)
  const activeOrgs = orgs.filter(o => o.isActive).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F2645', margin: '0 0 4px' }}>Organizations</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            {activeOrgs} active · {totalFamilies} families across {orgs.length} organizations
          </p>
        </div>
        <Link
          href="/admin/orgs/new"
          style={{ padding: '10px 20px', background: '#FF5C35', color: '#fff', textDecoration: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700 }}
        >
          + New organization
        </Link>
      </div>

      {/* Org table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
        {orgs.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6B7280' }}>
            <p style={{ fontSize: 32, margin: '0 0 12px' }}>🏢</p>
            <p style={{ fontSize: 15, margin: 0 }}>No organizations yet. <Link href="/admin/orgs/new" style={{ color: '#FF5C35', fontWeight: 700 }}>Create the first one.</Link></p>
          </div>
        ) : orgs.map((org, i) => (
          <Link
            key={org.id}
            href={`/admin/orgs/${org.slug}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderTop: i > 0 ? '1px solid #F4F6FA' : 'none',
              textDecoration: 'none',
              gap: 12,
            }}
          >
            {/* Color swatch */}
            <div style={{ width: 36, height: 36, borderRadius: 10, background: org.primaryColor, flexShrink: 0 }} />

            {/* Name + slug */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0F2645', margin: '0 0 2px' }}>{org.name}</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>/{org.slug}</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: '#0F2645', margin: 0 }}>{org.familyCount}</p>
                <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>families</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: '#00875A', margin: 0 }}>{org.completionCount}</p>
                <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>completions</p>
              </div>
              <TierBadge tier={org.tier} />
              {!org.isActive && (
                <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>INACTIVE</span>
              )}
            </div>

            <span style={{ color: '#9CA3AF', fontSize: 18 }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
