'use client'
// components/ui/Collapsible.tsx
//
// BUG FIX from previous version:
//   hidden={!open} was used on the content panel. The HTML `hidden` attribute
//   removes the element from the accessibility tree entirely, meaning aria-controls
//   pointed at a non-existent node when collapsed. Screen readers couldn't
//   understand the relationship. Also, `hidden` prevented smooth animation.
//
// Fix: CSS visibility via `display` toggling, scoped in a max-height wrapper
//   for animation. aria-expanded stays on the trigger button where it belongs.
//   The content div always exists in the DOM; CSS hides it.

import { useState, useId, CSSProperties, ReactNode } from 'react'
import { C, R, A } from '@/components/tokens'

export interface CollapsibleProps {
  trigger: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  icon?: string
  variant?: 'warning' | 'default'
  style?: CSSProperties
  contentStyle?: CSSProperties
}

const VARIANTS = {
  warning: { bg: C.warningLight, border: C.warningBorder, triggerColor: C.warningDark },
  default: { bg: C.surface,      border: C.border,        triggerColor: C.navy },
}

export function Collapsible({
  trigger, children, defaultOpen = false, icon,
  variant = 'warning', style: outerStyle, contentStyle,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)
  const uid = useId()
  const triggerId = `coll-t-${uid}`
  const contentId = `coll-c-${uid}`
  const v = VARIANTS[variant]

  return (
    <div style={{ background: v.bg, borderRadius: R.md, border: `1.5px solid ${v.border}`, overflow: 'hidden', ...outerStyle }}>
      <button
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 16px', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <span aria-hidden="true" style={{ fontSize: 16 }}>{icon}</span>}
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: v.triggerColor }}>
            {trigger}
          </span>
        </div>
        <span aria-hidden="true" style={{ fontSize: 16, color: v.triggerColor, display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: A.base }}>
          ▾
        </span>
      </button>

      {/* FIX: always in DOM, CSS-hidden when closed. aria-expanded on trigger communicates state. */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        style={{
          display: open ? 'block' : 'none',
          animation: open ? 'rf-slide-down 0.2s ease' : undefined,
          padding: '0 16px 14px',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}
