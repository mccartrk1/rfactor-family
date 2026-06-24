'use client'
// components/ui/ProgressDots.tsx
//
// Animated step progress indicator used in teaching chunks and seal questions.
// Active dot widens from 7px to 20px with a smooth CSS transition.
//
// Accessibility: communicates progress to screen readers via aria-label.
// The visual dots are aria-hidden; the meaningful text is sr-only.

import { CSSProperties } from 'react'
import { A } from '@/components/tokens'

export interface ProgressDotsProps {
  total: number
  current: number      // 0-indexed
  color: string        // week color
  label?: string       // e.g. "Teaching chunk" or "Seal question"
  size?: 'sm' | 'md'
  style?: CSSProperties
}

const DOT_HEIGHT = { sm: 5, md: 7 }
const DOT_ACTIVE_WIDTH = { sm: 14, md: 20 }
const DOT_INACTIVE_WIDTH = { sm: 5, md: 7 }
const DOT_GAP = { sm: 4, md: 6 }

export function ProgressDots({
  total,
  current,
  color,
  label = 'Step',
  size = 'md',
  style: overrideStyle,
}: ProgressDotsProps) {
  if (total <= 0) return null

  const h = DOT_HEIGHT[size]
  const activeW = DOT_ACTIVE_WIDTH[size]
  const inactiveW = DOT_INACTIVE_WIDTH[size]
  const gap = DOT_GAP[size]

  return (
    <div
      role="group"
      aria-label={`${label} ${current + 1} of ${total}`}
      style={{
        display: 'flex',
        gap,
        alignItems: 'center',
        ...overrideStyle,
      }}
    >
      {/* Screen-reader only progress text */}
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        {label} {current + 1} of {total}
      </span>

      {/* Visual dots */}
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current
        const isPast = i < current

        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              width: isActive ? activeW : inactiveW,
              height: h,
              borderRadius: 999,
              background: isPast || isActive ? color : '#E2E8F0',
              transition: A.transitionSlow,
              flexShrink: 0,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// Teaching chunks:
// <ProgressDots total={lesson.chunks.length} current={chunkIndex} color={wc} label="Teaching chunk" />
//
// Seal questions (amber color):
// <ProgressDots total={2} current={sealIndex} color="#F59E0B" label="Seal question" />
