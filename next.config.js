/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
    domains: ['lh3.googleusercontent.com'],
  },
  async redirects() {
    return [{ source: '/login', destination: '/auth/login', permanent: false }]
  },
}

module.exports = nextConfig
