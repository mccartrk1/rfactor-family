// app/admin/page.tsx
// Server component. All data resolved server-side, renders complete HTML.
// No loading spinners. No client-side fetches.

import { requireAdmin, getOverviewMetrics, getRecentFamilies } from '@/lib/admin'
import { WEEKS } from '@/content/weeks'

export const revalidate = 60 // Cache for 60 seconds — metrics don't need real-time

function StatCard({
  label, value, sub, color = '#fff',
}: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 900, color, margin: '0 0 2px', letterSpacing: -1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default async function AdminOverviewPage() {
  await requireAdmin()

  // Both queries run in parallel — overview metrics and recent families are independent
  const [metrics, recentFamilies] = await Promise.all([
    getOverviewMetrics(),
    getRecentFamilies(5),
  ])

  const challengeRate = metrics.completionCount > 0
    ? Math.round((metrics.challengeTotalCompletions / metrics.completionCount) * 100)
    : 0

  // recentFamilies from getRecentFamilies() — not the full family list

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FF5C35', margin: '0 0 6px' }}>R Factor Family — Pilot Overview</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: -0.5 }}>Admin Dashboard</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Last updated: {new Date().toLocaleString()}</p>
      </div>

      {/* Primary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Families enrolled" value={metrics.familyCount} sub={`+${metrics.newThisWeek} this week`} color="#FF5C35" />
        <StatCard label="Children" value={metrics.childCount} sub={`${metrics.familyCount ? (metrics.childCount / metrics.familyCount).toFixed(1) : 0} avg per family`} />
        <StatCard label="Week completions" value={metrics.completionCount} sub="total across all children" />
        <StatCard label="Programs complete" value={metrics.fullProgramCount} sub="all 13 weeks finished" color="#00875A" />
      </div>

      {/* Secondary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        <StatCard label="AI scenarios generated" value={metrics.aiCallCount} sub={`≈$${metrics.estimatedCostUsd} total cost`} />
        <StatCard label="Challenge yes rate" value={`${challengeRate}%`} sub={`${metrics.challengeTotalCompletions} of ${metrics.completionCount} weeks`} color={challengeRate > 60 ? '#00875A' : '#F59E0B'} />
        <StatCard label="Active this week" value={metrics.activeThisWeek} sub="lesson steps updated" />
        <StatCard label="Invites used" value={`${metrics.inviteUsedCount} / ${metrics.inviteTotalCount}`} sub={`${metrics.inviteTotalCount - metrics.inviteUsedCount} remaining`} />
      </div>

      {/* Cost breakdown */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 14px' }}>AI Cost Breakdown</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>Scenarios generated</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{metrics.aiCallCount}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>Cost per scenario (est.)</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>$0.008</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>Total estimated cost</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#FF5C35', margin: 0 }}>${metrics.estimatedCostUsd}</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '12px 0 0' }}>
          Actual cost may be lower — cached scenarios don't re-call Claude. Cost per child: ~${metrics.childCount ? (metrics.estimatedCostUsd / metrics.childCount).toFixed(2) : '0'}.
          At 100 families: ~${Math.round((metrics.aiCallCount / Math.max(metrics.childCount, 1)) * 100 * 0.008)}.
        </p>
      </div>

      {/* Recent families */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Recent families</p>
          <a href="/admin/families" style={{ fontSize: 11, color: '#FF5C35', textDecoration: 'none' }}>View all →</a>
        </div>
        {recentFamilies.length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No families enrolled yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Family', 'Children', 'Completions', 'Highest week', 'Enrolled'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '0 0 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentFamilies.map((f, i) => (
                <tr key={f.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '10px 0' }}>
                    <a href={`/admin/families/${f.id}`} style={{ fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>{f.familyName}</a>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '1px 0 0' }}>{f.email}</p>
                  </td>
                  <td style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', padding: '10px 0' }}>{f.childCount}</td>
                  <td style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', padding: '10px 0' }}>{(f as any).totalCompletions ?? 0}</td>
                  <td style={{ padding: '10px 0' }}>
                    {f.maxWeekCompleted > 0 ? (
                      <span style={{ fontSize: 12, background: f.programsComplete > 0 ? '#00875A' : 'rgba(255,255,255,0.08)', color: f.programsComplete > 0 ? '#fff' : 'rgba(255,255,255,0.7)', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>
                        {f.programsComplete > 0 ? '🏆 Complete' : `Week ${f.maxWeekCompleted}`}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Not started</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', padding: '10px 0' }}>
                    {f.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
