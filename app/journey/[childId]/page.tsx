// app/journey/[childId]/page.tsx
// Family Learning Journey Dashboard — RSC data shell.
// Loads the child's full history: every week's progress + all challenge responses.
// Zero client-side data fetching — all data arrives in the first HTML response.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { JourneyClient } from './client'
import { WEEKS } from '@/content/weeks'

interface Props { params: { childId: string }; searchParams: { print?: string } }

export default async function JourneyPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  // Ownership check + full data load in one query
  const child = await db.child.findFirst({
    where: { id: params.childId, userId: session.user.id },
    select: {
      id: true,
      track: true,
      profile: true,
      createdAt: true,
      family: { select: { familyName: true } },
      lessonProgress: {
        orderBy: { weekNumber: 'asc' },
        select: {
          weekNumber: true,
          completed: true,
          completedAt: true,
          currentStep: true,
          updatedAt: true,
        },
      },
      challengeResponses: {
        orderBy: { weekNumber: 'asc' },
        select: { weekNumber: true, response: true, createdAt: true },
      },
    },
  })

  if (!child) notFound()

  const profile  = child.profile as Record<string, string>
  const childName = profile.name ?? 'Your child'
  const isPrint  = searchParams.print === '1'

  // Build week data: each of the 13 weeks with status
  const progressMap = new Map(child.lessonProgress.map(p => [p.weekNumber, p]))
  const challengeMap = new Map(child.challengeResponses.map(c => [c.weekNumber, c]))

  const weeks = WEEKS.map(week => {
    const progress = progressMap.get(week.w)
    const challenge = challengeMap.get(week.w)
    return {
      number: week.w,
      title: week.title,
      emoji: week.emoji,
      color: week.color,
      status: progress?.completed
        ? 'completed'
        : progress
          ? 'in-progress'
          : 'upcoming',
      completedAt: progress?.completedAt?.toISOString() ?? null,
      currentStep: progress?.currentStep ?? null,
      challengeResponse: challenge?.response ?? null,
    }
  })

  const completedCount = weeks.filter(w => w.status === 'completed').length
  const yesCount = child.challengeResponses.filter(c => c.response === 'yes').length
  const totalChallenges = child.challengeResponses.length

  // Milestones
  const firstWeek   = child.lessonProgress.find(p => p.weekNumber === 1)
  const halfwayWeek = child.lessonProgress.find(p => p.weekNumber === 7 && p.completed)
  const finalWeek   = child.lessonProgress.find(p => p.weekNumber === 13 && p.completed)

  const milestones = [
    firstWeek ? { label: 'First lesson', date: firstWeek.updatedAt.toISOString(), emoji: '🚀' } : null,
    halfwayWeek ? { label: 'Halfway there', date: halfwayWeek.completedAt?.toISOString() ?? halfwayWeek.updatedAt.toISOString(), emoji: '⭐' } : null,
    finalWeek ? { label: 'Program complete', date: finalWeek.completedAt?.toISOString() ?? finalWeek.updatedAt.toISOString(), emoji: '🏆' } : null,
  ].filter(Boolean) as { label: string; date: string; emoji: string }[]

  return (
    <JourneyClient
      childId={child.id}
      childName={childName}
      familyName={child.family?.familyName ?? ''}
      enrolledAt={child.createdAt.toISOString()}
      weeks={weeks}
      completedCount={completedCount}
      yesCount={yesCount}
      totalChallenges={totalChallenges}
      milestones={milestones}
      isPrint={isPrint}
      isComplete={completedCount === 13}
      certificateUrl={`/certificate/${child.id}`}
    />
  )
}
