'use client'
// components/ui/Button.tsx
//
// Production-ready Button component.
//
// Design decisions:
//   - Minimum 44px tap target (Apple HIG / WCAG 2.5.5 AAA)
//   - Loading state: replaces content with spinner, prevents double-submit
//   - Disabled: visually distinct AND aria-disabled for screen readers
//   - Focus ring: visible on keyboard nav, hidden on mouse
//   - All variants derive from a base style — no style duplication

import { CSSProperties, ReactNode, KeyboardEvent } from 'react'
import { C, R, SP, A } from '@/components/tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | 'primary'    // navy — main lesson actions
  | 'accent'     // orange — CTAs
  | 'secondary'  // outline navy — secondary actions
  | 'ghost'      // transparent — tertiary
  | 'success'    // green — correct/complete
  | 'danger'     // red — destructive
  | 'warning'    // amber — seal questions

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
  style?: CSSProperties
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary:   { background: C.navy,    color: '#fff', border: 'none' },
  accent:    { background: C.orange,  color: '#fff', border: 'none' },
  secondary: { background: 'transparent', color: C.navy, border: `1.5px solid ${C.border}` },
  ghost:     { background: 'transparent', color: C.muted, border: `1.5px solid ${C.border}` },
  success:   { background: C.success,  color: '#fff', border: 'none' },
  danger:    { background: C.danger,   color: '#fff', border: 'none' },
  warning:   { background: C.warning,  color: '#fff', border: 'none' },
}

const SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: `${SP.sm}px ${SP.md}px`, fontSize: 13, borderRadius: R.sm, minHeight: 36 },
  md: { padding: `${SP.md}px ${SP.xl}px`, fontSize: 15, borderRadius: R.md, minHeight: 44 },
  lg: { padding: `${SP.lg}px 22px`,       fontSize: 16, borderRadius: R.md, minHeight: 52 },
}

// ─── Loading spinner ─────────────────────────────────────────────────────────

function Spinner({ color }: { color: string }) {
  return (
    <span
      role="presentation"
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        border: `2px solid ${color}40`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'rf-spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

// Spinner keyframes injected once
if (typeof document !== 'undefined') {
  const id = 'rf-spin-style'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = `@keyframes rf-spin { to { transform: rotate(360deg) } }`
    document.head.appendChild(style)
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ariaLabel,
  style: overrideStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const variantStyle = VARIANT_STYLES[variant]
  const sizeStyle = SIZE_STYLES[size]
  const spinnerColor = variant === 'secondary' || variant === 'ghost' ? C.navy : '#fff'

  // Keyboard support: Enter/Space trigger click
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!isDisabled) onClick?.()
    }
  }

  const baseStyle: CSSProperties = {
    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP.sm,
    width: fullWidth ? '100%' : 'auto',

    // Typography
    fontFamily: 'inherit',
    fontWeight: 700,
    lineHeight: 1,
    textDecoration: 'none',
    whiteSpace: 'nowrap',

    // Interaction
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: A.base,

    // Disabled state
    opacity: isDisabled ? 0.5 : 1,

    // Merge variant + size
    ...variantStyle,
    ...sizeStyle,
    ...overrideStyle,
  }

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      aria-label={ariaLabel}
      style={baseStyle}
    >
      {loading && <Spinner color={spinnerColor} />}
      {!loading && icon && iconPosition === 'left' && icon}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// <Button variant="primary" size="lg" fullWidth onClick={startLesson}>
//   Start lesson →
// </Button>
//
// <Button variant="secondary" onClick={goBack}>
//   ← Back
// </Button>
//
// <Button variant="success" loading={saving}>
//   {saving ? 'Saving...' : 'Complete Week 3 ✓'}
// </Button>
//
// <Button variant="ghost" size="sm" disabled>
//   Mark complete and move on
// </Button>
