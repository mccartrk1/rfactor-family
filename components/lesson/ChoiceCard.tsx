'use client'
// components/lesson/ChoiceCard.tsx
//
// Tap-to-reveal card for the scenario discipline/default paths.
// Two instances render side by side in the scenario screen.
//
// States:
//   idle      — unselected, white background
//   selected  — colored, result text revealed with slide-in animation
//   dimmed    — other card when sibling is selected
//
// Accessibility:
//   - Each card is an independent toggle button (both can be revealed)
//   - aria-pressed reflects whether this card has been revealed
//   - Keyboard: Space/Enter selects
//   - Result text marked as aria-live when revealed

import { CSSProperties, KeyboardEvent, useState } from 'react'
import { C, R, A } from '@/components/tokens'

export type ChoiceVariant = 'discipline' | 'default'

export interface ChoiceCardProps {
  variant: ChoiceVariant
  choice: string           // main response text
  result?: string          // revealed after tap
  selected: boolean
  siblingSelected: boolean  // true when the OTHER card is selected
  onSelect: () => void
  style?: CSSProperties
}

const VARIANT_CONFIG: Record<ChoiceVariant, {
  emoji: string
  label: string
  selectedBg: string
  selectedBorder: string
  labelColor: string
  selectedLabelColor: string
}> = {
  discipline: {
    emoji: '🐯',
    label: '✓ DISCIPLINE',
    selectedBg: C.success,
    selectedBorder: C.success,
    labelColor: C.success,
    selectedLabelColor: 'rgba(255,255,255,0.7)',
  },
  default: {
    emoji: '🤖',
    label: '✗ DEFAULT',
    selectedBg: C.danger,
    selectedBorder: C.danger,
    labelColor: C.danger,
    selectedLabelColor: 'rgba(255,255,255,0.7)',
  },
}

export function ChoiceCard({
  variant,
  choice,
  result,
  selected,
  siblingSelected,
  onSelect,
  style: overrideStyle,
}: ChoiceCardProps) {
  const config = VARIANT_CONFIG[variant]
  // Each card reveals independently — tapping one no longer locks the other.
  // A card is tappable until it has been revealed.
  const isSelectable = !selected

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!isSelectable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      role="button"
      aria-pressed={selected}
      aria-label={`${config.label}: ${choice}`}
      tabIndex={isSelectable ? 0 : -1}
      onClick={isSelectable ? onSelect : undefined}
      onKeyDown={handleKeyDown}
      style={{
        background: selected ? config.selectedBg : C.surface,
        borderRadius: R.lg,
        padding: 20,
        border: `2px solid ${selected ? config.selectedBorder : C.border}`,
        cursor: isSelectable ? 'pointer' : 'default',
        marginBottom: 10,
        opacity: 1,
        transition: A.base,
        WebkitTapHighlightColor: 'transparent',
        ...overrideStyle,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span aria-hidden="true" style={{ fontSize: 26 }}>{config.emoji}</span>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: selected ? config.selectedLabelColor : config.labelColor,
        }}>
          {config.label}
        </span>
      </div>

      {/* Choice text */}
      <p style={{
        fontSize: 14,
        color: selected ? '#fff' : C.text,
        margin: 0,
        lineHeight: 1.7,
      }}>
        {choice}
      </p>

      {/* Result reveal — shown only when selected */}
      {selected && result && (
        <p
          aria-live="polite"
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.85)',
            margin: '8px 0 0',
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          → {result}
        </p>
      )}
    </div>
  )
}

// ─── ChoiceGroup ──────────────────────────────────────────────────────────────
// Wraps both ChoiceCards in a semantic radiogroup

export interface ChoiceGroupProps {
  disciplineChoice: string
  disciplineResult: string
  defaultChoice: string
  defaultResult: string
  selected: 'discipline' | 'default' | null
  onSelect: (path: 'discipline' | 'default') => void
}

export function ChoiceGroup({
  disciplineChoice,
  disciplineResult,
  defaultChoice,
  defaultResult,
  onSelect,
}: ChoiceGroupProps) {
  // Track each path's reveal independently so the user can tap one, then tap
  // the other and see BOTH outcomes — the whole point of comparing responses.
  // Parent passes a fresh `key` per scenario, so this resets on "try another".
  const [revealed, setRevealed] = useState<{ discipline: boolean; default: boolean }>({
    discipline: false,
    default: false,
  })

  const reveal = (path: 'discipline' | 'default') => {
    setRevealed(prev => ({ ...prev, [path]: true }))
    onSelect(path)
  }

  return (
    <div role="group" aria-label="Compare the two response paths">
      <p style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: C.muted,
        margin: '0 0 10px',
      }}>
        Two paths — tap each to compare
      </p>
      <ChoiceCard
        variant="discipline"
        choice={disciplineChoice}
        result={disciplineResult}
        selected={revealed.discipline}
        siblingSelected={false}
        onSelect={() => reveal('discipline')}
      />
      <ChoiceCard
        variant="default"
        choice={defaultChoice}
        result={defaultResult}
        selected={revealed.default}
        siblingSelected={false}
        onSelect={() => reveal('default')}
      />
    </div>
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// <ChoiceGroup
//   disciplineChoice={scenario.disciplinePath.choice}
//   disciplineResult={scenario.disciplinePath.result}
//   defaultChoice={scenario.defaultPath.choice}
//   defaultResult={scenario.defaultPath.result}
//   selected={state.choice}
//   onSelect={m.pickPath}
// />
