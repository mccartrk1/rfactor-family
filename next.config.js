/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors fail the build. A failed build is not promoted, so the live
  // site keeps serving the last good deploy — this gate cannot break production,
  // only block a broken deploy. CI runs the same check (prisma generate + tsc),
  // so the production build gate and the CI gate stay in lockstep.
  typescript: { ignoreBuildErrors: false },
  images: {
    unoptimized: true,
    domains: ['lh3.googleusercontent.com'],
  },
  // Security response headers, applied to every route. These close clickjacking
  // (X-Frame-Options), MIME sniffing, referrer leakage, and unwanted device
  // access, and pin HTTPS. The app uses redirects (not iframes) for Stripe and
  // Google, so SAMEORIGIN is safe. A full Content-Security-Policy is a separate,
  // test-carefully follow-up because of Stripe, Google, and CDN script sources.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  async redirects() {
    return [{ source: '/login', destination: '/auth/login', permanent: false }]
  },
}

module.exports = nextConfig
