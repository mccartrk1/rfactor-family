// app/admin/orgs/[slug]/page.tsx
// Per-organization admin view.
// Shows metrics, families, invite codes, and branding preview.

import { requireAdmin, getOrgDetail, logAdminAccess } from '@/lib/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function OrgDetailPage({ params }: Props) {
  const adminEmail = await requireAdmin()
  logAdminAccess('view_org', adminEmail, `slug=${params.slug}`)

  const org = await getOrgDetail(params.slug)
  if (!org) notFound()

  const m = org.metrics

  function fmt(d: Date): string {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/admin/orgs" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>← Orgs</Link>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: org.primaryColor, flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F2645', margin: '0 0 2px' }}>{org.name}</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>/{org.slug} · {org.tier.toUpperCase()}</p>
          </div>
        </div>
        <Link href={`/admin/orgs/${org.slug}/settings`}
          style={{ padding: '10px 18px', background: '#F4F6FA', color: '#0F2645', textDecoration: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1.5px solid #E2E8F0' }}>
          ⚙ Settings
        </Link>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Families', value: m.familyCount, sub: `of ${org.maxFamilies} max` },
          { label: 'Children', value: m.childCount, sub: 'enrolled' },
          { label: 'Completions', value: m.totalCompletions, sub: 'lesson weeks done' },
          { label: 'Full programs', value: m.fullProgramCount, sub: 'all 13 weeks' },
          { label: 'Active this week', value: m.activeThisWeek, sub: 'families' },
          { label: 'AI cost', value: `$${m.estimatedCostUsd}`, sub: `${m.aiCallCount} scenarios` },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E2E8F0', padding: '16px 18px' }}>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#0F2645', margin: '0 0 2px' }}>{stat.value}</p>
            <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 1px', fontWeight: 700 }}>{stat.label}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Branding preview */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ background: org.primaryColor, padding: '20px 24px' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>
            {org.name}
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>R Factor Program</h2>
        </div>
        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Branding preview — what families in this org see</p>
          <Link href={`/admin/orgs/${org.slug}/settings`} style={{ fontSize: 13, color: '#FF5C35', fontWeight: 700, textDecoration: 'none' }}>
            Edit branding →
          </Link>
        </div>
      </div>

      {/* Family list */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F4F6FA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0F2645', margin: 0 }}>{org.families.length} Families</p>
        </div>
        {org.families.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
            <p style={{ margin: 0 }}>No families enrolled yet. Create invite codes below.</p>
          </div>
        ) : org.families.map((family, i) => (
          <Link key={family.id} href={`/admin/families/${family.id}`} style={{
            display: 'flex', alignItems: 'center', padding: '13px 20px',
            borderTop: i > 0 ? '1px solid #F4F6FA' : 'none',
            textDecoration: 'none', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F2645', margin: '0 0 1px' }}>{family.familyName}</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{family.email} · {family.childCount} child{family.childCount !== 1 ? 'ren' : ''}</p>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#0F2645', margin: 0 }}>{family.maxWeekCompleted}/13</p>
                <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>weeks</p>
              </div>
              {family.lastActivity && (
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                  {fmt(family.lastActivity)}
                </p>
              )}
            </div>
            <span style={{ color: '#9CA3AF' }}>→</span>
          </Link>
        ))}
      </div>

      {/* Invite codes */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F4F6FA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0F2645', margin: 0 }}>Invite codes</p>
          <Link href={`/admin/orgs/${org.slug}/settings#invites`} style={{ fontSize: 13, color: '#FF5C35', fontWeight: 700, textDecoration: 'none' }}>
            + Create
          </Link>
        </div>
        {org.inviteCodes.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
            <p style={{ margin: 0 }}>No invite codes for this org yet.</p>
          </div>
        ) : org.inviteCodes.map((invite, i) => (
          <div key={invite.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderTop: i > 0 ? '1px solid #F4F6FA' : 'none', gap: 12 }}>
            <code style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#0F2645', background: '#F4F6FA', padding: '4px 10px', borderRadius: 6 }}>
              {invite.code}
            </code>
            {invite.note && <p style={{ fontSize: 12, color: '#6B7280', margin: 0, flex: 1 }}>{invite.note}</p>}
            <span style={{ fontSize: 11, fontWeight: 700, color: invite.usedAt ? '#00875A' : '#9CA3AF' }}>
              {invite.usedAt ? '✓ Used' : 'Available'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
