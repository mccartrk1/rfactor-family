'use client'
// components/ui/StatCard.tsx
//
// Admin dashboard stat card. Used 8x in the admin overview page — all inline.
// Now a single component with value, label, sub-label, trend, and loading state.
//
// Props design:
//   value   — the big number/string (e.g. "47", "$3.84", "82%")
//   label   — uppercase eyebrow above the value
//   sub     — small text below value for context
//   trend   — +N or -N shown as colored indicator (undefined = no trend)
//   color   — override value text color (for semantic coloring)
//   loading — shows a skeleton pulse while data loads
//   onClick — makes the whole card a link-like target

import { CSSProperties } from 'react'
import { C, R, SP } from '@/components/tokens'

export interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: {
    value: number         // positive = up (good), negative = down
    label: string         // e.g. "vs last week", "+3 this week"
    inverse?: boolean     // set true when down = good (e.g. cost going down)
  }
  color?: string          // override value color
  icon?: string           // emoji prefix before value
  loading?: boolean
  onClick?: () => void
  style?: CSSProperties
}

export function StatCard({
  label, value, sub, trend, color, icon, loading, onClick, style: outerStyle,
}: StatCardProps) {
  const isClickable = !!onClick
  const trendPositive = trend ? (trend.inverse ? trend.value < 0 : trend.value > 0) : null
  const trendColor = trendPositive === null ? C.muted : trendPositive ? C.success : C.danger
  const trendIcon  = trend ? (trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→') : null

  const containerStyle: CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: R.md,
    padding: `${SP.xl}px 22px`,
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: isClickable ? 'pointer' : 'default',
    transition: isClickable ? 'all 0.15s ease' : undefined,
    position: 'relative',
    overflow: 'hidden',
    ...outerStyle,
  }

  if (loading) {
    return (
      <div style={containerStyle} aria-busy="true" aria-label={`${label}: loading`}>
        <Skeleton height={10} width="60%" style={{ marginBottom: SP.md }} />
        <Skeleton height={32} width="40%" style={{ marginBottom: SP.sm }} />
        {sub && <Skeleton height={10} width="80%" />}
      </div>
    )
  }

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      aria-label={`${label}: ${value}${sub ? `. ${sub}` : ''}`}
      style={containerStyle}
    >
      {/* Label */}
      <p style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
        margin: `0 0 ${SP.sm}px`,
      }}>
        {label}
      </p>

      {/* Value */}
      <p style={{
        fontSize: 32, fontWeight: 900,
        color: color ?? '#fff',
        margin: `0 0 ${SP.xs}px`,
        letterSpacing: -1,
        lineHeight: 1,
      }}>
        {icon && <span aria-hidden="true" style={{ marginRight: 6, fontSize: 24 }}>{icon}</span>}
        {value}
      </p>

      {/* Sub-text */}
      {sub && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{sub}</p>
      )}

      {/* Trend */}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: SP.sm }}>
          <span aria-hidden="true" style={{ fontSize: 11, fontWeight: 800, color: trendColor }}>
            {trendIcon} {Math.abs(trend.value)}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{trend.label}</span>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ height, width, style }: { height: number; width: string | number; style?: CSSProperties }) {
  return (
    <div style={{
      height,
      width,
      background: 'rgba(255,255,255,0.08)',
      borderRadius: 6,
      animation: 'rf-dot-pulse 1.6s ease-in-out infinite',
      ...style,
    }} />
  )
}

// ─── Usage examples ───────────────────────────────────────────────────────────
//
// <StatCard label="Families enrolled" value={metrics.familyCount}
//   sub={`+${metrics.newThisWeek} this week`} color="#FF5C35" />
//
// <StatCard label="AI cost" value={`$${metrics.estimatedCostUsd}`}
//   sub="estimated total" trend={{ value: -2.4, label: "vs last month", inverse: true }} />
//
// <StatCard label="Loading..." loading />
