'use client'
// app/journey/[childId]/client.tsx
// Visual Family Learning Journey Dashboard.
// Three zones: hero stats → 13-week timeline → challenge stats + milestones

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { C, R } from '@/components/tokens'

interface WeekData {
  number: number
  title: string
  emoji: string
  color: string
  status: 'completed' | 'in-progress' | 'upcoming'
  completedAt: string | null
  currentStep: string | null
  challengeResponse: 'yes' | 'not-yet' | null
}

interface Milestone {
  label: string
  date: string
  emoji: string
}

interface Props {
  childId: string
  childName: string
  familyName: string
  enrolledAt: string
  weeks: WeekData[]
  completedCount: number
  yesCount: number
  totalChallenges: number
  milestones: Milestone[]
  isPrint: boolean
  totalWeeks: number
  isComplete: boolean
  certificateUrl: string
}

// ─── Week card ────────────────────────────────────────────────────────────────

function WeekCard({ week, onClick, isSelected }: { week: WeekData; onClick: () => void; isSelected: boolean }) {
  const isCompleted  = week.status === 'completed'
  const isInProgress = week.status === 'in-progress'
  const isUpcoming   = week.status === 'upcoming'

  return (
    <button
      onClick={onClick}
      aria-label={`Week ${week.number}: ${week.title} — ${week.status}`}
      aria-pressed={isSelected}
      style={{
        flexShrink: 0,
        width: 72,
        height: 96,
        borderRadius: R.lg,
        border: isSelected
          ? `2px solid ${C.orange}`
          : isInProgress
            ? `2px solid ${C.navy}`
            : `2px solid ${isCompleted ? 'transparent' : C.border}`,
        background: isCompleted ? week.color : isInProgress ? `${C.navy}10` : '#fff',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 8,
        boxSizing: 'border-box',
        transition: 'transform 0.1s, box-shadow 0.1s',
        animation: isInProgress ? 'pulse-border 2s infinite' : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Completion check */}
      {isCompleted && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          width: 16, height: 16, borderRadius: '50%',
          background: 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 8, color: '#fff', fontWeight: 900 }}>✓</span>
        </div>
      )}

      <span style={{ fontSize: 26, lineHeight: 1 }}>{week.emoji}</span>
      <span style={{
        fontSize: 9, fontWeight: 800,
        color: isCompleted ? 'rgba(255,255,255,0.8)' : isInProgress ? C.navy : C.muted,
        letterSpacing: 0.5,
      }}>
        W{week.number}
      </span>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function JourneyClient({
  childId, childName, familyName, enrolledAt,
  weeks, completedCount, yesCount, totalChallenges,
  milestones, isPrint, totalWeeks, isComplete, certificateUrl,
}: Props) {
  const router = useRouter()
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null)

  const completionPct = Math.round((completedCount / totalWeeks) * 100)
  const challengePct  = totalChallenges > 0 ? Math.round((yesCount / totalChallenges) * 100) : 0

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Inject animation styles
  if (typeof document !== 'undefined') {
    const id = 'rf-journey-styles'
    if (!document.getElementById(id)) {
      const s = document.createElement('style')
      s.id = id
      s.textContent = `
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(15,38,69,0.15); }
          50%  { box-shadow: 0 0 0 6px rgba(15,38,69,0.08); }
        }
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `
      document.head.appendChild(s)
    }
  }

  const currentWeek = weeks.find(w => w.status === 'in-progress')
  // The next week is the lowest-numbered week that is not yet completed — not
  // `completedCount + 1`. Counting up from the total breaks whenever weeks are
  // completed out of order (e.g. a later week finished first), which made the
  // journey skip earlier unfinished weeks and point "Continue" at the wrong one.
  const firstIncomplete = weeks.find(w => w.status !== 'completed')
  const nextWeekNum = firstIncomplete ? firstIncomplete.number : null

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F6FA',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ background: C.navy, padding: '52px 22px 32px' }}>

        {/* Back nav */}
        <div className="no-print" style={{ marginBottom: 20 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
          >
            ← Dashboard
          </button>
        </div>

        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>
          {familyName} family
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: -1 }}>
          {childName}&apos;s Journey
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
          Started {formatDate(enrolledAt)} · R Factor Family Program
        </p>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Weeks done', value: `${completedCount}/${totalWeeks}`, color: C.orange },
            { label: 'Completion', value: `${completionPct}%`, color: '#00875A' },
            { label: 'Challenges tried', value: totalChallenges > 0 ? `${yesCount}/${totalChallenges}` : '—', color: '#6C3FC5' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: R.md,
              padding: '10px 16px',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: stat.color, margin: '0 0 2px' }}>{stat.value}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>{stat.label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 18px 60px', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' as const }}>

        {/* ── Week Timeline ────────────────────────────────────────── */}
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, margin: '0 0 12px' }}>
          {totalWeeks}-Week Program
        </p>

        {/* Horizontal scrollable row */}
        <div style={{
          overflowX: 'auto', display: 'flex', gap: 8,
          paddingBottom: 12, marginBottom: 12,
          scrollbarWidth: 'none',
        }}
          aria-label="Week timeline"
        >
          {weeks.map(week => (
            <WeekCard
              key={week.number}
              week={week}
              isSelected={selectedWeek?.number === week.number}
              onClick={() => setSelectedWeek(selectedWeek?.number === week.number ? null : week)}
            />
          ))}
        </div>

        {/* Week detail panel */}
        {selectedWeek && (
          <div style={{
            background: '#fff',
            borderRadius: R.lg,
            border: `1.5px solid ${C.border}`,
            padding: 18,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: selectedWeek.status === 'completed' ? selectedWeek.color : '#F4F6FA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {selectedWeek.emoji}
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.muted, margin: '0 0 2px', fontWeight: 700 }}>Week {selectedWeek.number}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.navy, margin: 0 }}>{selectedWeek.title}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                background: selectedWeek.status === 'completed' ? '#DCFCE7' : selectedWeek.status === 'in-progress' ? '#DBEAFE' : '#F3F4F6',
                color: selectedWeek.status === 'completed' ? '#166534' : selectedWeek.status === 'in-progress' ? '#1E40AF' : C.muted,
              }}>
                {selectedWeek.status === 'completed' ? '✓ Complete' : selectedWeek.status === 'in-progress' ? '▶ In progress' : '○ Not started'}
              </span>
              {selectedWeek.completedAt && (
                <span style={{ fontSize: 11, color: C.muted, padding: '4px 10px', background: '#F4F6FA', borderRadius: 999 }}>
                  {formatDate(selectedWeek.completedAt)}
                </span>
              )}
              {selectedWeek.challengeResponse && (
                <span style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 700,
                  background: selectedWeek.challengeResponse === 'yes' ? '#DCFCE7' : '#FEF9C3',
                  color: selectedWeek.challengeResponse === 'yes' ? '#166534' : '#854D0E',
                }}>
                  Challenge: {selectedWeek.challengeResponse === 'yes' ? 'Tried it ✓' : 'Not yet'}
                </span>
              )}
            </div>

            {selectedWeek.status === 'in-progress' && (
              <button
                onClick={() => router.push(`/lesson/${selectedWeek.number}?child=${childId}`)}
                style={{
                  marginTop: 12, width: '100%', padding: '12px 16px',
                  background: C.orange, color: '#fff', border: 'none',
                  borderRadius: R.md, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Continue Week {selectedWeek.number} →
              </button>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ background: '#fff', borderRadius: R.lg, border: `1.5px solid ${C.border}`, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: 0 }}>Program progress</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.orange, margin: 0 }}>{completionPct}%</p>
          </div>
          <div style={{ height: 10, background: '#F4F6FA', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: isComplete ? '#00875A' : C.orange,
              width: `${completionPct}%`,
              transition: 'width 1s ease',
            }} />
          </div>
          {!isComplete && nextWeekNum && (
            <p style={{ fontSize: 12, color: C.muted, margin: '8px 0 0' }}>
              {totalWeeks - completedCount} {totalWeeks - completedCount === 1 ? 'week' : 'weeks'} to go · Next: Week {nextWeekNum}
            </p>
          )}
        </div>

        {/* ── Challenge stats ──────────────────────────────────────── */}
        {totalChallenges > 0 && (
          <div style={{ background: '#fff', borderRadius: R.lg, border: `1.5px solid ${C.border}`, padding: 18, marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, margin: '0 0 12px' }}>
              Challenges
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>
              {yesCount} of {totalChallenges} tried
            </p>
            <div style={{ height: 8, background: '#F4F6FA', borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', borderRadius: 999, background: '#00875A', width: `${challengePct}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: '#DCFCE7', borderRadius: R.md, padding: '10px 14px' }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#166534', margin: '0 0 2px' }}>{yesCount}</p>
                <p style={{ fontSize: 11, color: '#166534', margin: 0, fontWeight: 700 }}>Tried it ✓</p>
              </div>
              <div style={{ flex: 1, background: '#FEF9C3', borderRadius: R.md, padding: '10px 14px' }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#854D0E', margin: '0 0 2px' }}>{totalChallenges - yesCount}</p>
                <p style={{ fontSize: 11, color: '#854D0E', margin: 0, fontWeight: 700 }}>Not yet</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Milestones ───────────────────────────────────────────── */}
        {milestones.length > 0 && (
          <div style={{ background: '#fff', borderRadius: R.lg, border: `1.5px solid ${C.border}`, padding: 18, marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, margin: '0 0 12px' }}>
              Milestones
            </p>
            {milestones.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingBottom: i < milestones.length - 1 ? 12 : 0,
                marginBottom: i < milestones.length - 1 ? 12 : 0,
                borderBottom: i < milestones.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F4F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {m.emoji}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 2px' }}>{m.label}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{formatDate(m.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CTAs ─────────────────────────────────────────────────── */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isComplete && (
            <a
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', padding: '16px 22px', textAlign: 'center',
                background: C.orange, color: '#fff', textDecoration: 'none',
                borderRadius: R.md, fontSize: 15, fontWeight: 700,
              }}
            >
              🏆 View certificate
            </a>
          )}
          <button
            onClick={() => window.open(`/journey/${childId}?print=1`, '_blank')}
            style={{
              width: '100%', padding: '14px 22px',
              background: '#fff', color: C.navy,
              border: `1.5px solid ${C.border}`,
              borderRadius: R.md, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🖨️ Print progress report
          </button>
          {!isComplete && nextWeekNum && (
            <button
              onClick={() => router.push(`/lesson/${nextWeekNum}?child=${childId}`)}
              style={{
                width: '100%', padding: '16px 22px',
                background: C.navy, color: '#fff', border: 'none',
                borderRadius: R.md, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Continue Week {nextWeekNum} →
            </button>
          )}
        </div>

        {/* Print footer */}
        <div style={{ display: isPrint ? 'block' : 'none', marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: C.muted }}>R Factor Family App · E + R = O · rfactorfamily.com</p>
        </div>

      </div>
    </div>
  )
}
