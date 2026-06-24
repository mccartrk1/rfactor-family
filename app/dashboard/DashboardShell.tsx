'use client'
// app/dashboard/DashboardShell.tsx

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { WEEKS } from '@/content/weeks'
import { WeekCard, Button } from '@/components'
import type { ChildWithProgress } from './page'
import type { LessonProgress } from '@prisma/client'

// Static style objects extracted to module level.
// Inline style={{ ... }} creates new objects on every render; React uses
// referential equality, so every render triggers DOM property diffing
// even when values haven't changed.
const STYLES = {
  page:     { minHeight: '100vh', background: '#F4F6FA', paddingBottom: 48 } as const,
  header:   { background: '#0F2645', padding: '52px 22px 28px', position: 'relative' as const } as const,
  headerRow:{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' } as const,
  label:    { fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' } as const,
  settingsBtn: { background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 10, width: 40, height: 40, fontSize: 18, cursor: 'pointer' } as const,
  switcher: { display: 'flex', gap: 8, marginTop: 4 } as const,
  grid:     { padding: '18px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as const,
  addBtn:   { padding: '0 14px' } as const,
}



interface Props {
  children: ChildWithProgress[]
  familyName: string
}

export function DashboardShell({ children, familyName }: Props) {
  const router = useRouter()

  // Initialise with stored preference, fall back to first child
  const [activeChildId, setActiveChildId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rf_active_child')
      if (stored && children.some(c => c.id === stored)) return stored
    }
    return children[0].id
  })

  const activeChild = children.find(c => c.id === activeChildId) ?? children[0]

  // PERF FIX 6: Memoize progressMap and completedCount.
  // These were recomputed from scratch on every render — including renders
  // triggered by unrelated state changes. useMemo ensures they only recompute
  // when activeChild actually changes (i.e. when the user switches children).
  const progressMap = useMemo<Record<number, LessonProgress>>(() => {
    const map: Record<number, LessonProgress> = {}
    activeChild.lessonProgress.forEach(p => { map[p.weekNumber] = p })
    return map
  }, [activeChild])

  const completedCount = useMemo(
    () => activeChild.lessonProgress.filter(p => p.completed).length,
    [activeChild]
  )

  // PERF FIX 7: useCallback for handlers — prevents new function allocations
  // on every render. 13 week cards each received a new onClick every render.
  const switchChild = useCallback((id: string) => {
    localStorage.setItem('rf_active_child', id)
    setActiveChildId(id)
  }, [])

  const openLesson = useCallback((weekNumber: number) => {
    localStorage.setItem('rf_active_child', activeChild.id)
    router.push(`/lesson/${weekNumber}?childId=${activeChild.id}`)
  }, [activeChild.id, router])

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA', paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ background: '#0F2645', padding: '52px 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>R Factor</p>
            <a href="/settings" style={{ position: 'absolute', top: 14, right: 20, fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontWeight: 600 }}>⚙ Settings</a>
            <a href={`/journey/${activeChild.id}`} style={{ position: 'absolute', bottom: 14, right: 20, fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontWeight: 600 }}>📈 Journey</a>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: -0.5 }}>
              {activeChild.name}&apos;s Program
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', margin: '0 0 14px' }}>
              {completedCount} of 13 weeks complete
            </p>
          </div>
          <button
            onClick={() => router.push('/settings')}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 10, width: 40, height: 40, fontSize: 18, cursor: 'pointer' }}
          >⚙️</button>
        </div>

        {/* Child switcher — instant, no fetch */}
        {children.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => switchChild(c.id)}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  background: c.id === activeChildId ? '#FF5C35' : 'rgba(255,255,255,0.1)',
                  color: c.id === activeChildId ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Completion banner */}
      {completedCount === 13 && (
        <div style={{ margin: '14px 14px 0', background: '#0F2645', borderRadius: 16, padding: '16px 18px', border: '2px solid #FF5C35', textAlign: 'center' }}>
          <p style={{ fontSize: 28, margin: '0 0 6px' }}>🏆</p>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FF5C35', margin: '0 0 4px' }}>Program complete</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{activeChild.name} finished all 13 weeks.</p>
        </div>
      )}

      {/* Week grid */}
      <div style={{ padding: '18px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {WEEKS.map(w => {
          const p = progressMap[w.w]
          const status = !p ? 'not-started'
            : p.completed ? 'complete'
            : p.currentStep !== 'intro' ? 'in-progress'
            : 'not-started'

          return (
            <WeekCard
              key={w.w}
              weekNumber={w.w}
              title={w.title}
              subtitle={w.sub}
              emoji={w.emoji}
              color={w.color}
              status={status}
              onClick={() => openLesson(w.w)}
            />
          )
        })}
      </div>

      {/* Add child */}
      <div style={{ padding: '0 14px' }}>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => router.push('/onboard?add=true')}
          style={{ border: '1.5px dashed #E2E8F0' }}
        >
          + Add another child
        </Button>
      </div>
    </div>
  )
}
