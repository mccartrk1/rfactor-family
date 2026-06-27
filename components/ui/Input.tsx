'use client'
// components/ui/Input.tsx
//
// Accessible form field with label, error, hint, char count.
// Every instance of <input> or <textarea> in the app should use this.
//
// Accessibility contract:
//   - label is always rendered, associated via htmlFor/id
//   - Required fields get aria-required="true" + visual star
//   - Errors: aria-invalid="true" + aria-describedby pointing at error text
//   - Hints: aria-describedby pointing at hint text
//   - Focus: :focus-visible ring from global styles (no custom outline needed)
//
// Edge cases handled:
//   - autoFocus on mount (for multi-step forms)
//   - Enter key submits (single-line) or adds newline (multiline)
//   - Character count warning at 80% capacity
//   - Disabled state: reduced opacity, no pointer events

import { useId, CSSProperties, KeyboardEvent, useRef, useEffect } from 'react'
import { C, R, SP } from '@/components/tokens'

// ─── Shared types ─────────────────────────────────────────────────────────────

interface BaseFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  optional?: boolean      // show "(optional)" hint — don't use with required
  error?: string
  hint?: string
  disabled?: boolean
  autoFocus?: boolean
  maxLength?: number
  id?: string
  style?: CSSProperties
  inputStyle?: CSSProperties
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface InputProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  onEnter?: () => void
}

export function Input({
  label, value, onChange, placeholder, required, optional, error, hint,
  disabled, autoFocus, maxLength, id: externalId, type = 'text',
  onEnter, style: outerStyle, inputStyle,
}: InputProps) {
  const uid = useId()
  const id = externalId ?? `input-${uid}`
  const errorId = `${id}-error`
  const hintId  = `${id}-hint`

  const describedBy = [
    error ? errorId : null,
    hint  ? hintId  : null,
  ].filter(Boolean).join(' ') || undefined

  const charCount  = value.length
  const nearLimit  = maxLength && charCount >= Math.floor(maxLength * 0.8)
  const atLimit    = maxLength && charCount >= maxLength

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter() }
  }

  const borderColor = error ? C.danger : value ? C.navy : C.border

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SP.xs, ...outerStyle }}>
      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label htmlFor={id} style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
          {label}
          {required && (
            <span aria-hidden="true" style={{ color: C.danger, marginLeft: 3 }}>*</span>
          )}
          {optional && (
            <span style={{ fontSize: 11, fontWeight: 400, color: C.muted, marginLeft: 6 }}>(optional)</span>
          )}
        </label>
        {maxLength && (
          <span aria-live="polite" style={{ fontSize: 10, color: atLimit ? C.danger : nearLimit ? C.warning : C.muted }}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>

      {/* Input */}
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        style={{
          width: '100%',
          padding: '13px 15px',
          fontSize: 15,
          fontFamily: 'inherit',
          color: C.text,
          background: disabled ? '#F9FAFB' : C.surface,
          border: `2px solid ${borderColor}`,
          borderRadius: R.md,
          outline: 'none',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.55 : 1,
          transition: 'border-color 0.15s ease',
          ...inputStyle,
        }}
      />

      {/* Error */}
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{ fontSize: 12, fontWeight: 600, color: C.danger, margin: 0 }}
        >
          {error}
        </p>
      )}

      {/* Hint (only shown when no error) */}
      {hint && !error && (
        <p id={hintId} style={{ fontSize: 11, color: C.muted, margin: 0 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ─── TextArea ─────────────────────────────────────────────────────────────────

export interface TextAreaProps extends BaseFieldProps {
  rows?: number
  autoGrow?: boolean   // expands to fit content up to maxRows
  maxRows?: number
  onEnter?: () => void  // Enter without Shift submits
}

export function TextArea({
  label, value, onChange, placeholder, required, optional, error, hint,
  disabled, autoFocus, maxLength, id: externalId,
  rows = 3, autoGrow = false, maxRows = 8, onEnter,
  style: outerStyle, inputStyle,
}: TextAreaProps) {
  const uid = useId()
  const id = externalId ?? `textarea-${uid}`
  const errorId  = `${id}-error`
  const hintId   = `${id}-hint`
  const ref = useRef<HTMLTextAreaElement>(null)

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  // Auto-grow: resize on content change
  useEffect(() => {
    if (!autoGrow || !ref.current) return
    const el = ref.current
    el.style.height = 'auto'
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24
    const maxH = lineHeight * maxRows + 32 // 32px for padding
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`
  }, [value, autoGrow, maxRows])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && onEnter) {
      e.preventDefault()
      onEnter()
    }
  }

  const borderColor = error ? C.danger : value ? C.navy : C.border
  const charCount   = value.length
  const nearLimit   = maxLength && charCount >= Math.floor(maxLength * 0.8)
  const atLimit     = maxLength && charCount >= maxLength

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SP.xs, ...outerStyle }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label htmlFor={id} style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
          {label}
          {required && <span aria-hidden="true" style={{ color: C.danger, marginLeft: 3 }}>*</span>}
          {optional && <span style={{ fontSize: 11, fontWeight: 400, color: C.muted, marginLeft: 6 }}>(optional)</span>}
        </label>
        {maxLength && (
          <span aria-live="polite" style={{ fontSize: 10, color: atLimit ? C.danger : nearLimit ? C.warning : C.muted }}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        rows={rows}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        style={{
          width: '100%',
          padding: '13px 15px',
          fontSize: 15,
          fontFamily: 'inherit',
          color: C.text,
          background: disabled ? '#F9FAFB' : C.surface,
          border: `2px solid ${borderColor}`,
          borderRadius: R.md,
          outline: 'none',
          resize: 'none',
          lineHeight: 1.6,
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.55 : 1,
          transition: 'border-color 0.15s, height 0.1s',
          ...inputStyle,
        }}
      />

      {error && (
        <p id={errorId} role="alert" aria-live="polite" style={{ fontSize: 12, fontWeight: 600, color: C.danger, margin: 0 }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} style={{ fontSize: 11, color: C.muted, margin: 0 }}>{hint}</p>
      )}
    </div>
  )
}
