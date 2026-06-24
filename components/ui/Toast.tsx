'use client'
// components/ui/Toast.tsx
//
// Global toast notification system.
//
// Architecture:
//   ToastProvider  — wraps the app, renders the fixed toast container
//   useToast()     — hook that returns { success, error, info, warning }
//   toast.*()      — trigger functions, auto-dismiss after `duration` ms
//
// Accessibility:
//   - role="status" + aria-live="polite" for success/info (non-urgent)
//   - role="alert"  + aria-live="assertive" for errors (urgent, interrupts)
//   - Each toast is visually distinct with icon + color
//   - Dismiss button has an aria-label
//
// Edge cases:
//   - Max 3 toasts visible at once (FIFO queue, oldest removed)
//   - Hover pauses the dismiss timer (prevents reading time cut short)
//   - Animation: slide up on enter, fade out on dismiss
//   - SSR safe (no window access outside useEffect)

import {
  createContext, useContext, useState, useCallback, useRef,
  ReactNode, CSSProperties, useEffect
} from 'react'
import { C, R, SP } from '@/components/tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  variant: ToastVariant
  message: string
  duration: number
}

export interface ToastAPI {
  success: (message: string, duration?: number) => void
  error:   (message: string, duration?: number) => void
  info:    (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastAPI | null>(null)

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((variant: ToastVariant, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => {
      const next = [...prev, { id, variant, message, duration }]
      // Max 3 visible — drop the oldest
      return next.length > 3 ? next.slice(next.length - 3) : next
    })
  }, [])

  const api: ToastAPI = {
    success: (msg, dur) => push('success', msg, dur),
    error:   (msg, dur) => push('error',   msg, dur),
    info:    (msg, dur) => push('info',    msg, dur),
    warning: (msg, dur) => push('warning', msg, dur),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ─── Container ────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
        maxWidth: 360,
        width: 'calc(100vw - 32px)',
      }}
    >
      {toasts.map(t => (
        <ToastEl key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ─── Individual toast ─────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<ToastVariant, {
  bg: string; border: string; icon: string; liveRegion: 'polite' | 'assertive'; role: 'status' | 'alert'
}> = {
  success: { bg: C.success, border: C.successDark, icon: '✓',  liveRegion: 'polite',     role: 'status' },
  error:   { bg: C.danger,  border: C.dangerDark,  icon: '✕',  liveRegion: 'assertive',  role: 'alert'  },
  info:    { bg: C.navy,    border: '#1e3a5f',      icon: 'ℹ',  liveRegion: 'polite',     role: 'status' },
  warning: { bg: C.warning, border: '#d97706',      icon: '⚠',  liveRegion: 'polite',     role: 'status' },
}

function ToastEl({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const cfg = VARIANT_CONFIG[toast.variant]
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startTimer() {
    timerRef.current = setTimeout(() => onDismiss(toast.id), toast.duration)
  }
  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  useEffect(() => { startTimer(); return clearTimer }, [])

  return (
    <div
      role={cfg.role}
      aria-live={cfg.liveRegion}
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SP.md,
        padding: '13px 16px',
        background: cfg.bg,
        borderRadius: R.md,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        pointerEvents: 'auto',
        animation: 'rf-toast-in 0.25s ease',
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16, flexShrink: 0, fontWeight: 800, color: '#fff' }}>
        {cfg.icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1, lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 16, color: 'rgba(255,255,255,0.6)',
          padding: 0, flexShrink: 0, lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// In app/providers.tsx:
//   import { ToastProvider } from '@/components/ui/Toast'
//   <ToastProvider>{children}</ToastProvider>
//
// In any client component:
//   const toast = useToast()
//   toast.success('Invite code created!')
//   toast.error('Failed to save. Try again.')
//   toast.warning('Rate limit approaching.', 6000)
