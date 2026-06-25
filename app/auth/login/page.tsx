import { redirect } from 'next/navigation'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string }
}) {
  const callbackUrl = searchParams.callbackUrl || '/dashboard'
  redirect(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`)
}
