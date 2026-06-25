export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/onboard/:path*', '/lesson/:path*', '/journey/:path*'],
}
