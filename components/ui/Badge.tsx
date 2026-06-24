'use client'
// components/ui/Badge.tsx
//
// Inline status label. Used for "Week 7", "✦ personalized", status tags.
//
// Accessibility: purely decorative badges use aria-hidden.
// Meaningful badges (e.g. status) include an aria-label.

import { CSSProperties, ReactNode } from 'react'
import { C, R, SP } from '@/components/tokens'

export type BadgeVariant =
  | 'default'     // neutral gray
  | 'primary'     // navy
  | 'accent'      // orange
  | 'success'     // green
  | 'warning'     // amber
  | 'danger'      // red
  | 'info'        // blue
  | 'personalized' // green with star — AI-personalized label

export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: string           // emoji or text prefix
  decorative?: boolean    // true = aria-hidden (purely visual)
  ariaLabel?: string
  style?: CSSProperties
}

const VARIANT_STYLES: Record<BadgeVariant, CSSProperties> = {
  default:      { background: '#F3F4F6', color: C.muted, border: `1px solid ${C.border}` },
  primary:      { background: '#EAF0FB', color: C.navy, border: `1px solid ${C.border}` },
  accent:       { background: '#FFF3EE', color: C.orange, border: '1px solid #FFDCC8' },
  success:      { background: C.successLight, color: C.successDark, border: `1px solid ${C.successBorder}` },
  warning:      { background: C.warningLight, color: C.warningDark, border: `1px solid ${C.warningBorder}` },
  danger:       { background: C.dangerLight,  color: C.dangerDark,  border: `1px solid ${C.dangerBorder}` },
  info:         { background: C.infoLight,    color: C.info,        border: '1px solid #BFDBFE' },
  personalized: { background: C.successLight, color: C.successDark, border: `1px solid ${C.successBorder}` },
}

const SIZE_STYLES: Record<BadgeSize, CSSProperties> = {
  sm: { fontSize: 10, padding: `2px ${SP.sm}px`,  borderRadius: R.full, fontWeight: 700 },
  md: { fontSize: 12, padding: `4px ${SP.md}px`,  borderRadius: R.full, fontWeight: 700 },
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  decorative = false,
  ariaLabel,
  style: overrideStyle,
}: BadgeProps) {
  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={!decorative ? ariaLabel : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...overrideStyle,
      }}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {variant === 'personalized' && <span aria-hidden="true">✦</span>}
      {children}
    </span>
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// <Badge variant="personalized">personalized</Badge>
// <Badge variant="success" icon="✓">Week 7 complete</Badge>
// <Badge variant="warning" size="md">Seal it in</Badge>
// <Badge decorative>Week 7</Badge>   ← visual only, ignored by screen readers
