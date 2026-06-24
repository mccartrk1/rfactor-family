/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production'

// SECOND-PASS FIX: Split CSP by environment.
// 'unsafe-eval' is required by Next.js hot reload and React DevTools in DEV.
// In PRODUCTION, Next.js does NOT require unsafe-eval.
// A CSP with unsafe-eval in production defeats nearly all XSS protection:
// if an attacker injects any HTML, they can escalate via eval() immediately.
const scriptSrc = isDev
  ? "'self' 'unsafe-eval' 'unsafe-inline'"  // dev: permissive for DX
  : "'self'"                                  // prod: strict — no eval, no inline scripts

const securityHeaders = [
  // Prevent clickjacking — this app must never be framed
  { key: 'X-Frame-Options', value: 'DENY' },

  // Prevent MIME-type sniffing (e.g. serving a JS file as text/plain then executing it)
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Only send referrer to same-origin requests — no leakage to Anthropic, Google Analytics, etc.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Disable browser APIs the app never uses
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },

  {
    key: 'Content-Security-Policy',
    value: [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `style-src 'self' 'unsafe-inline'`,       // inline styles required by JSX pattern
      `img-src 'self' data: https://lh3.googleusercontent.com`, // Google avatar images
      `font-src 'self'`,
      `connect-src 'self'`,                      // Claude API called server-side only
      `frame-ancestors 'none'`,                  // belt+suspenders with X-Frame-Options
      `base-uri 'self'`,                         // prevent base tag hijacking
      `form-action 'self'`,                      // NextAuth form posts only to same origin
    ].join('; '),
  },

  // Force HTTPS for 1 year after first visit
  // Only effective when actually deployed over HTTPS (Vercel default)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
    domains: ['lh3.googleusercontent.com'],
  },

  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },

  async redirects() {
    return [{ source: '/login', destination: '/auth/login', permanent: false }]
  },
}

module.exports = nextConfig
