// app/admin/families/[id]/page.tsx
// Server component. Full week-by-week progress for one family.

import { requireAdmin, getFamilyDetail } from '@/lib/admin'
import { WEEKS } from '@/content/weeks'
import { notFound } from 'next/navigation'

interface Props { params: { id: string } }

export const revalidate = 60

export default async function AdminFamilyDetailPage({ params }: Props) {
  await requireAdmin()

  const family = await getFamilyDetail(params.id)
  if (!family) notFound()

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <a href="/admin/families" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← All families</a>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '8px 0 2px', letterSpacing: -0.5 }}>{family.familyName}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          {family.email} · Enrolled {family.createdAt.toLocaleDateString()}
        </p>
      </div>

      {/* Per-child progress */}
      {family.children.map(child => {
        const completedWeeks = child.weekProgress.filter(p => p.completed).length
        const totalAiCalls = child.aiCallCount

        // Map week number → progress entry
        const progressByWeek: Record<number, typeof child.weekProgress[0]> = {}
        child.weekProgress.forEach(p => { progressByWeek[p.weekNumber] = p })

        return (
          <div key={child.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '24px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
            {/* Child header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 2px' }}>{child.name}</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  {child.age} {child.grade && `· ${child.grade}`} {child.school && `· ${child.school}`} · {child.track} track
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16, textAlign: 'right' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 2px' }}>Weeks done</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: completedWeeks === 13 ? '#00875A' : '#FF5C35', margin: 0 }}>{completedWeeks}/13</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 2px' }}>AI scenarios</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{totalAiCalls}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 2px' }}>Challenges ✓</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: child.challengeYesWeeks.length > 0 ? '#00875A' : 'rgba(255,255,255,0.35)', margin: 0 }}>{child.challengeYesWeeks.length}</p>
                </div>
              </div>
            </div>

            {/* Week grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {WEEKS.map(w => {
                const p = progressByWeek[w.w]
                const done = p?.completed ?? false
                const started = p && p.currentStep !== 'intro'
                const challengeDone = child.challengeYesWeeks.includes(w.w)

                return (
                  <div
                    key={w.w}
                    style={{
                      background: done ? w.color : started ? `${w.color}22` : 'rgba(255,255,255,0.04)',
                      borderRadius: 10,
                      padding: '10px 8px',
                      border: `1px solid ${done ? w.color : 'rgba(255,255,255,0.06)'}`,
                      textAlign: 'center',
                      position: 'relative',
                    }}
                    title={p ? `Step: ${p.currentStep} · Updated: ${p.updatedAt.toLocaleString()}` : 'Not started'}
                  >
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{w.emoji}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }}>W{w.w}</div>
                    {done && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>✓ done</div>}
                    {!done && started && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{p?.currentStep}</div>}
                    {!done && !started && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>—</div>}
                    {challengeDone && (
                      <div style={{ position: 'absolute', top: 3, right: 4, fontSize: 8, color: '#00875A', fontWeight: 800 }}>★</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {[
                { color: '#FF5C35', label: 'Completed' },
                { color: 'rgba(255,92,53,0.13)', label: 'In progress' },
                { color: 'rgba(255,255,255,0.04)', label: 'Not started' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color, border: '1px solid rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: '#00875A' }}>★</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Challenge completed</span>
              </div>
            </div>

            {/* Completion timeline if any weeks done */}
            {child.weekProgress.filter(p => p.completed).length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 10px' }}>Completion timeline</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {child.weekProgress
                    .filter(p => p.completed && p.completedAt)
                    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
                    .map(p => {
                      const week = WEEKS.find(w => w.w === p.weekNumber)
                      return (
                        <div key={p.weekNumber} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, minWidth: 20 }}>{week?.emoji}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', minWidth: 80 }}>Week {p.weekNumber}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                            {new Date(p.completedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {child.challengeYesWeeks.includes(p.weekNumber) && (
                            <span style={{ fontSize: 10, background: '#00875A22', color: '#00875A', padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>★ challenge done</span>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
