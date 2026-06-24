// app/api/account/delete/route.ts — GDPR Article 17: Right to Erasure

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let confirmEmail: string
  try {
    const body = await req.json()
    confirmEmail = String(body.confirmEmail ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Require email confirmation to prevent CSRF / accidental deletion
  if (confirmEmail !== session.user.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'Email confirmation does not match your account' },
      { status: 400 }
    )
  }

  // Cascade delete: User → Family → Child → LessonProgress, ChallengeResponse, ScenarioCache
  await db.user.delete({ where: { id: session.user.id } })

  // Clear session cookies
  const response = NextResponse.json({ deleted: true }, { status: 200 })
  const cookieOptions = { expires: new Date(0), path: '/' }
  response.cookies.set('next-auth.session-token', '', cookieOptions)
  response.cookies.set('__Secure-next-auth.session-token', '', { ...cookieOptions, secure: true })
  return response
}
