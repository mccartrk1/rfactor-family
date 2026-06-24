'use client'
// components/ui/EmptyState.tsx
//
// Consistent empty state for zero-data conditions.
// Used when: no families enrolled, no invite codes, no progress yet.
//
// Props design keeps it flexible:
//   - icon: emoji or illustration
//   - title: what's empty
//   - body: optional explanation or guidance
//   - action: optional CTA button (avoids component knowing about routing)

import { ReactNode, CSSProperties } from 'react'
import { C, R, SP } from '@/components/tokens'
import { Button, ButtonVariant } from './Button'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: ButtonVariant
}

export interface EmptyStateProps {
  icon?: string
  title: string
  body?: string
  action?: EmptyStateAction
  compact?: boolean        // smaller variant for inline use (e.g. table cells)
  dark?: boolean           // for admin dark-mode contexts
  style?: CSSProperties
  children?: ReactNode     // custom content below title/body
}

export function EmptyState({
  icon = '📭', title, body, action, compact, dark, style: outerStyle, children,
}: EmptyStateProps) {
  const textColor = dark ? 'rgba(255,255,255,0.55)' : C.muted

  return (
    <div
      role="status"
      aria-label={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? `${SP.xl}px` : '48px 24px',
        background: dark ? 'rgba(255,255,255,0.04)' : C.bg,
        borderRadius: R.lg,
        border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : C.border}`,
        gap: compact ? SP.sm : SP.md,
        ...outerStyle,
      }}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        style={{ fontSize: compact ? 28 : 40, lineHeight: 1, marginBottom: compact ? 0 : SP.xs }}
      >
        {icon}
      </span>

      {/* Title */}
      <p style={{
        fontSize: compact ? 14 : 16,
        fontWeight: 700,
        color: dark ? 'rgba(255,255,255,0.7)' : C.navy,
        margin: 0,
      }}>
        {title}
      </p>

      {/* Body */}
      {body && (
        <p style={{ fontSize: compact ? 12 : 13, color: textColor, margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
          {body}
        </p>
      )}

      {/* Custom children */}
      {children}

      {/* CTA */}
      {action && (
        <Button
          variant={action.variant ?? 'primary'}
          size={compact ? 'sm' : 'md'}
          onClick={action.onClick}
          style={{ marginTop: compact ? 0 : SP.sm }}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// <EmptyState
//   icon="👨‍👩‍👦"
//   title="No families enrolled yet"
//   body="Create an invite code and share it to get started."
//   action={{ label: 'Create invite code', onClick: () => router.push('/admin/invites') }}
//   dark
// />
//
// <EmptyState compact icon="✓" title="No pending invites" dark />
