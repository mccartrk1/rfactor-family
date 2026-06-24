// components/OrgBrandingProvider.tsx
//
// WHITE-LABEL BRANDING SYSTEM
//
// Architecture:
//   1. RSC parent calls getOrgBrandingForUser(userId) → OrgBranding | null
//   2. Passes branding as props to this client component
//   3. This component injects CSS custom properties on mount
//   4. All UI components reference var(--color-brand) instead of hardcoded colors
//
// CSS variable map:
//   --color-brand        → org.primaryColor (default: #0F2645 navy)
//   --color-brand-dark   → 15% darker variant (for hover states)
//   --color-brand-light  → 15% lighter variant (for backgrounds)
//
// Usage in parent RSC (e.g., app/dashboard/page.tsx):
//   const branding = await getOrgBrandingForUser(session.user.id)
//   <OrgBrandingProvider branding={branding}>
//     <DashboardShell ... />
//   </OrgBrandingProvider>
//
// Usage in components (when org branding is active):
//   background: 'var(--color-brand)'  ← uses org color
//   background: '#0F2645'              ← uses hardcoded default
//
// NOTE: For the pilot, only the header color and logo change.
// Full white-label (custom fonts, full color system) is a Phase 2 feature.

'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'

export interface OrgBranding {
  name: string
  primaryColor: string
  logoUrl: string | null
  slug: string
}

interface Props {
  branding: OrgBranding | null
  children: ReactNode
}

// Darken/lighten a hex color by a percentage
function adjustHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export function OrgBrandingProvider({ branding, children }: Props) {
  useEffect(() => {
    if (!branding?.primaryColor) return

    const root = document.documentElement
    root.style.setProperty('--color-brand', branding.primaryColor)
    root.style.setProperty('--color-brand-dark', adjustHex(branding.primaryColor, -30))
    root.style.setProperty('--color-brand-light', adjustHex(branding.primaryColor, 60))

    return () => {
      // Reset to defaults when component unmounts
      root.style.removeProperty('--color-brand')
      root.style.removeProperty('--color-brand-dark')
      root.style.removeProperty('--color-brand-light')
    }
  }, [branding?.primaryColor])

  return <>{children}</>
}

// ─── White-label header ───────────────────────────────────────────────────────
// Replaces the standard "R Factor" header text when org branding is active.
// Shown in the dashboard header when a family belongs to a branded org.

interface OrgHeaderBadgeProps {
  branding: OrgBranding | null
}

export function OrgHeaderBadge({ branding }: OrgHeaderBadgeProps) {
  if (!branding) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      {branding.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={branding.logoUrl} alt={branding.name} style={{ height: 20, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      ) : (
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {branding.name}
        </span>
      )}
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        × R Factor
      </span>
    </div>
  )
}
