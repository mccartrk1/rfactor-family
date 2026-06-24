'use client'
// components/lesson/WeekCard.tsx
//
// Dashboard week grid card.
//
// States:
//   complete    — colored background, checkmark badge
//   in-progress — white with a colored dot in corner
//   locked      — white, muted (future: gated progression)
//   not-started — white, neutral
//
// Accessibility:
//   - role="button" with descriptive aria-label
//   - aria-pressed for the complete state
//   - Minimum 44px height guaranteed by padding

import { CSSProperties, KeyboardEvent } from 'react'
import { C, R, A } from '@/components/tokens'

export type WeekStatus = 'complete' | 'in-progress' | 'not-started' | 'locked'

export interface WeekCardProps {
  weekNumber: number
  title: string
  subtitle: string
  emoji: string
  color: string           // week-specific color from WEEKS array
  status: WeekStatus
  onClick: () => void
  style?: CSSProperties
}

export function WeekCard({
  weekNumber,
  title,
  subtitle,
  emoji,
  color,
  status,
  onClick,
  style: overrideStyle,
}: WeekCardProps) {
  const isComplete   = status === 'complete'
  const isInProgress = status === 'in-progress'
  const isLocked     = status === 'locked'
  const isClickable  = !isLocked

  const ariaLabel = [
    `Week ${weekNumber}: ${title}.`,
    isComplete    ? 'Completed.' : '',
    isInProgress  ? 'In progress.' : '',
    isLocked      ? 'Locked.' : '',
    !isComplete && !isInProgress && !isLocked ? 'Not started.' : '',
  ].filter(Boolean).join(' ')

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!isClickable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={isClickable ? 0 : -1}
      aria-label={ariaLabel}
      aria-pressed={isComplete}
      aria-disabled={isLocked}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      style={{
        background:    isComplete ? color : C.surface,
        border:        `1.5px solid ${isComplete ? color : C.border}`,
        borderRadius:  R.md,
        padding:       '16px 12px 14px',
        cursor:        isClickable ? 'pointer' : 'not-allowed',
        textAlign:     'left',
        position:      'relative',
        opacity:       isLocked ? 0.45 : 1,
        transition:    A.transition,
        WebkitTapHighlightColor: 'transparent',
        minHeight:     88,
        ...overrideStyle,
      }}
    >
      {/* Week emoji */}
      <div aria-hidden="true" style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>

      {/* Week label */}
      <div style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: isComplete ? 'rgba(255,255,255,0.55)' : C.muted,
        marginBottom: 3,
      }}>
        Week {weekNumber}
      </div>

      {/* Title */}
      <div style={{
        fontSize: 13,
        fontWeight: 800,
        color: isComplete ? '#fff' : C.navy,
        lineHeight: 1.25,
        marginBottom: 2,
      }}>
        {title}
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: 11,
        color: isComplete ? 'rgba(255,255,255,0.55)' : C.muted,
        lineHeight: 1.4,
      }}>
        {subtitle}
      </div>

      {/* Complete checkmark */}
      {isComplete && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 10,
            right: 11,
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 800,
          }}
        >
          ✓
        </div>
      )}

      {/* In-progress dot */}
      {isInProgress && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 10,
            right: 11,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
          }}
        />
      )}
    </div>
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// function weekStatus(progress?: LessonProgress): WeekStatus {
//   if (!progress) return 'not-started'
//   if (progress.completed) return 'complete'
//   if (progress.currentStep !== 'intro') return 'in-progress'
//   return 'not-started'
// }
//
// <WeekCard
//   weekNumber={w.w}
//   title={w.title}
//   subtitle={w.sub}
//   emoji={w.emoji}
//   color={w.color}
//   status={weekStatus(progressMap[w.w])}
//   onClick={() => openLesson(w.w)}
// />
