// app/admin/families/page.tsx
// Server component. All families with progress summary.

import { requireAdmin, getFamilyList } from '@/lib/admin'

export const revalidate = 60

export default async function AdminFamiliesPage() {
  await requireAdmin()
  const families = await getFamilyList()

  const totalChildren = families.reduce((s, f) => s + f.childCount, 0)
  const totalCompletions = families.reduce((s, f) => s + f.totalCompletions, 0)

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: -0.5 }}>All Families</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          {families.length} families · {totalChildren} children · {totalCompletions} total week completions
        </p>
      </div>

      {families.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No families enrolled yet.</p>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Family', 'Email', 'Children', 'Weeks done', 'Furthest', 'Challenges ✓', 'AI calls', 'Last active', 'Joined'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '12px 16px', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {families.map(f => {
                const progress = f.maxWeekCompleted
                const pct = Math.round((progress / 13) * 100)
                const daysSince = f.lastActivity
                  ? Math.floor((Date.now() - f.lastActivity.getTime()) / 86400000)
                  : null

                return (
                  <tr key={f.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <a href={`/admin/families/${f.id}`} style={{ fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'block' }}>
                        {f.familyName}
                      </a>
                      {f.programsComplete > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#00875A' }}>🏆 COMPLETE</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{f.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>{f.childCount}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 999, minWidth: 60 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#00875A' : '#FF5C35', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', minWidth: 28 }}>{f.totalCompletions}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {f.maxWeekCompleted > 0 ? (
                        <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>
                          W{f.maxWeekCompleted}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: f.challengeYesCount > 0 ? '#00875A' : 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                      {f.challengeYesCount > 0 ? `✓ ${f.challengeYesCount}` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>{f.aiCallCount}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {daysSince === null ? '—' : daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                      {f.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
