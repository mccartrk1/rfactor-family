// components/tokens/index.ts — Design tokens, single source of truth.

export const C = {
  navy:         '#0F2645',
  orange:       '#FF5C35',
  success:      '#00875A', successLight: '#F0FDF4', successBorder: '#86EFAC', successDark: '#15803D',
  danger:       '#C81E4A', dangerLight:  '#FFF0F0', dangerBorder:  '#FECACA', dangerDark:  '#B91C1C',
  warning:      '#F59E0B', warningLight: '#FFFBEB', warningBorder: '#FDE68A', warningDark: '#92400E', warningText: '#78350F',
  info:         '#0077C2', infoLight:    '#EFF6FF',
  purple:       '#6C3FC5',
  bg:     '#F4F6FA',
  surface:'#FFFFFF',
  border: '#E2E8F0',
  light:  '#EAF0FB',
  text:   '#111827',
  textMid:'#374151',
  muted:  '#6B7280',
  faint:  '#9CA3AF',
} as const

export const R = { sm: 10, md: 14, lg: 16, xl: 20, full: 999 } as const
export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const
export const A = { fast: 'all 0.15s ease', base: 'all 0.2s ease', slow: 'all 0.3s ease' } as const
export const SH = {
  card:     '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  elevated: '0 4px 12px rgba(0,0,0,0.10)',
} as const

export const T = {
  label:    { fontSize: 9,  fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' as const },
  caption:  { fontSize: 11, color: '#6B7280', lineHeight: 1.5 },
  body:     { fontSize: 14, color: '#374151', lineHeight: 1.7 },
  heading:  { fontSize: 21, fontWeight: 800, color: '#0F2645', letterSpacing: -0.3 },
} as const

// Global focus ring — injected once at app load.
// Uses :focus-visible so mouse users never see outlines.
export function injectGlobalStyles() {
  if (typeof document === 'undefined') return
  const id = 'rf-global-styles'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `
    :focus-visible {
      outline: 2px solid #FF5C35 !important;
      outline-offset: 2px !important;
    }
    @keyframes rf-spin        { to { transform: rotate(360deg) } }
    @keyframes rf-dot-pulse   { 0%,100%{opacity:1} 50%{opacity:.15} }
    @keyframes rf-emoji-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.92)} }
    @keyframes rf-slide-down  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes rf-toast-in    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes rf-toast-out   { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(12px)} }
    @media(prefers-reduced-motion:reduce){
      *, *::before, *::after { animation-duration:.01ms!important; transition-duration:.01ms!important }
    }
  `
  document.head.appendChild(style)
}
