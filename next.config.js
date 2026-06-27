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
  async redirects() {
    return [{ source: '/login', destination: '/auth/login', permanent: false }]
  },
}

module.exports = nextConfig
