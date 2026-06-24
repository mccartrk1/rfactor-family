'use client'
// components/ui/LoadingDots.tsx
//
// Three-dot pulsing animation used while Claude generates a scenario.
// Also exports a PulsingEmoji variant for the main loading screen.
//
// Accessibility:
//   - role="status" announces dynamic content updates to screen readers
//   - aria-label describes what's happening
//   - Dots are aria-hidden (decorative)
//   - Respects prefers-reduced-motion: dots shown statically

import { CSSProperties } from 'react'

// Inject styles once per page
function injectLoadingStyles() {
  if (typeof document === 'undefined') return
  const id = 'rf-loading-styles'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `
    @keyframes rf-dot-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.15; }
    }
    @keyframes rf-emoji-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.92); }
    }
    @media (prefers-reduced-motion: reduce) {
      .rf-dot-pulse, .rf-emoji-pulse { animation: none !important; }
    }
  `
  document.head.appendChild(style)
}

// ─── Three-dot variant ────────────────────────────────────────────────────────

export interface LoadingDotsProps {
  color?: string
  size?: number         // dot diameter in px
  label?: string        // screen reader label
  style?: CSSProperties
}

export function LoadingDots({
  color = '#0F2645',
  size = 10,
  label = 'Loading',
  style: overrideStyle,
}: LoadingDotsProps) {
  if (typeof document !== 'undefined') injectLoadingStyles()

  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...overrideStyle,
      }}
    >
      {/* Screen-reader text */}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        {label}
      </span>

      {[0, 1, 2].map(i => (
        <div
          key={i}
          aria-hidden="true"
          className="rf-dot-pulse"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            animation: `rf-dot-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Pulsing emoji variant ────────────────────────────────────────────────────

export interface PulsingEmojiProps {
  emoji: string
  size?: number         // font size in px
  label?: string
  style?: CSSProperties
}

export function PulsingEmoji({
  emoji,
  size = 52,
  label = 'Loading',
  style: overrideStyle,
}: PulsingEmojiProps) {
  if (typeof document !== 'undefined') injectLoadingStyles()

  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      style={overrideStyle}
    >
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span
        aria-hidden="true"
        className="rf-emoji-pulse"
        style={{
          fontSize: size,
          display: 'block',
          animation: 'rf-emoji-pulse 1.4s ease-in-out infinite',
        }}
      >
        {emoji}
      </span>
    </div>
  )
}

// ─── Full loading screen ─────────────────────────────────────────────────────

export interface LoadingScreenProps {
  emoji: string
  weekColor: string
  heading?: string
  subtext?: string
}

export function LoadingScreen({
  emoji,
  weekColor,
  heading = 'Building your scenario...',
  subtext = 'Pulling from real life...',
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={heading}
      style={{ textAlign: 'center', padding: '68px 0' }}
    >
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        {heading}
      </span>
      <PulsingEmoji emoji={emoji} size={52} label={heading} style={{ marginBottom: 20 }} />
      <h3 aria-hidden="true" style={{ fontSize: 17, fontWeight: 800, color: '#0F2645', margin: '0 0 8px' }}>{heading}</h3>
      <p aria-hidden="true" style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>{subtext}</p>
      <LoadingDots color={weekColor} label="" style={{ justifyContent: 'center' }} />
    </div>
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// <LoadingScreen emoji={week.emoji} weekColor={wc} />
//
// <LoadingDots color={wc} label="Generating your scenario" />
//
// <PulsingEmoji emoji="🎯" size={48} label="Loading dashboard" />
