'use client'
// components/lesson/QuizOption.tsx
//
// Answer option for check questions (teaching) and seal questions.
//
// States:
//   unanswered  — white card, selectable
//   correct     — green, shows ✓ prefix
//   incorrect   — red, shows ✗ prefix (only the tapped wrong option)
//   neutral     — white but muted (other options after one was selected)
//
// Accessibility:
//   - role="radio" within a radiogroup
//   - aria-checked reflects selection
//   - Keyboard: Space/Enter selects
//   - Not selectable when disabled (correct/incorrect revealed)
//
// The "— or —" separator between options is a separate export.

import { KeyboardEvent, CSSProperties } from 'react'
import { C, R, A } from '@/components/tokens'

export type QuizOptionState = 'unanswered' | 'correct' | 'incorrect' | 'neutral'

export interface QuizOptionProps {
  text: string
  state: QuizOptionState
  onSelect?: () => void
  showSeparator?: boolean    // show "— or —" before this option
  style?: CSSProperties
}

const STATE_STYLES: Record<QuizOptionState, { bg: string; border: string; color: string }> = {
  unanswered: { bg: C.surface, border: C.border,         color: C.text    },
  correct:    { bg: C.success, border: C.success,         color: '#fff'    },
  incorrect:  { bg: C.danger,  border: C.danger,          color: '#fff'    },
  neutral:    { bg: C.surface, border: C.border,          color: C.muted   },
}

const STATE_PREFIX: Partial<Record<QuizOptionState, string>> = {
  correct:  '✓ ',
  incorrect: '✗ ',
}

export function QuizOption({
  text,
  state,
  onSelect,
  showSeparator = false,
  style: overrideStyle,
}: QuizOptionProps) {
  const isSelectable = state === 'unanswered'
  const { bg, border, color } = STATE_STYLES[state]
  const prefix = STATE_PREFIX[state] ?? ''

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!isSelectable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.()
    }
  }

  return (
    <>
      {showSeparator && (
        <OrSeparator />
      )}
      <div
        role="radio"
        aria-checked={state === 'correct' || state === 'incorrect' ? true : false}
        aria-disabled={!isSelectable}
        tabIndex={isSelectable ? 0 : -1}
        onClick={isSelectable ? onSelect : undefined}
        onKeyDown={handleKeyDown}
        style={{
          background: bg,
          borderRadius: R.lg,
          padding: '14px 16px',
          border: `${state === 'correct' || state === 'incorrect' ? 2 : 1.5}px solid ${border}`,
          cursor: isSelectable ? 'pointer' : 'default',
          marginBottom: 10,
          transition: A.base,
          WebkitTapHighlightColor: 'transparent',
          ...overrideStyle,
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 14,
          fontWeight: isSelectable ? 600 : 700,
          lineHeight: 1.4,
          color,
        }}>
          {prefix}{text}
        </p>
      </div>
    </>
  )
}

// ─── QuizGroup ────────────────────────────────────────────────────────────────
// Wraps multiple QuizOptions in a semantic radiogroup

export interface QuizGroupProps {
  question: string
  options: string[]
  questionColor: string       // background color for the question banner
  selectedIndex: number | null
  correctIndex: number
  onSelect: (index: number) => void
}

export function QuizGroup({
  question,
  options,
  questionColor,
  selectedIndex,
  correctIndex,
  onSelect,
}: QuizGroupProps) {
  const answered = selectedIndex !== null

  function getState(index: number): QuizOptionState {
    if (!answered) return 'unanswered'
    if (index === correctIndex) return 'correct'
    if (index === selectedIndex) return 'incorrect'
    return 'neutral'
  }

  return (
    <div role="radiogroup" aria-label={question}>
      {/* Question banner */}
      <div
        role="heading"
        aria-level={3}
        style={{
          background: questionColor,
          borderRadius: R.md,
          padding: '12px 16px',
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 700, lineHeight: 1.5 }}>
          👆 {question}
        </p>
      </div>

      {/* Options */}
      {options.map((opt, i) => (
        <QuizOption
          key={i}
          text={opt}
          state={getState(i)}
          onSelect={() => !answered && onSelect(i)}
          showSeparator={i > 0}
        />
      ))}

      {/* Feedback line */}
      {answered && (
        <p
          role="alert"
          aria-live="polite"
          style={{
            fontSize: 12,
            margin: '2px 0 12px',
            fontWeight: 700,
            color: selectedIndex === correctIndex ? C.success : C.muted,
            fontStyle: selectedIndex === correctIndex ? 'normal' : 'italic',
          }}
        >
          {selectedIndex === correctIndex
            ? 'That is it. ✓'
            : 'Not quite — the right answer is highlighted in green.'}
        </p>
      )}
    </div>
  )
}

// ─── OrSeparator ─────────────────────────────────────────────────────────────

export function OrSeparator() {
  return (
    <div
      aria-hidden="true"
      style={{
        textAlign: 'center',
        margin: '-4px 0',
        color: C.muted,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1,
      }}
    >
      — or —
    </div>
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// <QuizGroup
//   question={chunk.check.q}
//   options={chunk.check.opts}
//   questionColor={wc}
//   selectedIndex={state.checkAnswer}
//   correctIndex={chunk.check.answer}
//   onSelect={m.tapCheck}
// />
//
// Standalone:
// <QuizOption text="The Response" state="correct" />
// <QuizOption text="The Event" state="neutral" />
