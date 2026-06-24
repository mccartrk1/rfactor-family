// app/complete/page.tsx
// Program completion celebration page.
// Reached when Week 13 is completed: router.push('/complete?child=childId')
//
// Two responsibilities:
//   1. Show a meaningful celebration moment (not just a redirect to dashboard)
//   2. Trigger the completion email and record the event in the database

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CompletionClient } from './client'
import { sendCompletionEmail } from '@/lib/email'
import { logger, LogEvents } from '@/lib/logger'

interface Props { searchParams: { child?: string } }

export default async function CompletePage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  const childId = searchParams.child
  if (!childId) redirect('/dashboard')

  // Verify ownership + load child data
  const child = await db.child.findFirst({
    where: { id: childId, userId: session.user.id },
    select: {
      id: true,
      name: true,
      familyName: true,
      createdAt: true,
      family: { select: { familyName: true } },
    },
  })

  if (!child) redirect('/dashboard')

  // Verify week 13 is actually completed
  const week13 = await db.lessonProgress.findUnique({
    where: { childId_weekNumber: { childId, weekNumber: 13 } },
    select: { completed: true, completedAt: true },
  })

  if (!week13?.completed) redirect('/dashboard')

  const completedAt = week13.completedAt ?? new Date()
  const completedAtStr = completedAt.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const certificateUrl = `${process.env.NEXTAUTH_URL ?? 'https://rfactor-family.vercel.app'}/certificate/${childId}`

  // Send completion email (fire-and-forget — don't block page render)
  const parentEmail = session.user.email
  if (parentEmail) {
    sendCompletionEmail({
      to: parentEmail,
      parentName: session.user.name?.split(' ')[0] ?? 'there',
      childName: child.name,
      completedAt: completedAtStr,
      certificateUrl,
    }).catch(e => logger.error('email.completion_failed', { childId, error: String(e) }))

    logger.info(LogEvents.PROGRAM_COMPLETED, { childId, childName: child.name, completedAt })
  }

  return (
    <CompletionClient
      childName={child.name}
      familyName={child.family?.familyName ?? child.familyName}
      completedAt={completedAtStr}
      certificateUrl={certificateUrl}
    />
  )
}
