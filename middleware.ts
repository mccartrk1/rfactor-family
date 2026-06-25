export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/journey/:path*', '/lesson/:path*'],
}
