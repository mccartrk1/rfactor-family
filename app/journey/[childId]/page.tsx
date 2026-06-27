// app/journey/[childId]/page.tsx
// Family Learning Journey Dashboard — RSC data shell.
// Loads the child's full history: every week's progress + all challenge responses.
// Zero client-side data fetching — all data arrives in the first HTML response.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { JourneyClient } from './client'
import { getProgramWeeks } from '@/content/programs'

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

  // Build week data for the learner's program (kid vs adult), each with status.
  const programWeeks = getProgramWeeks(child.track)
  const totalWeeks = programWeeks.length
  const halfwayNumber = Math.ceil(totalWeeks / 2)
  const progressMap = new Map(child.lessonProgress.map(p => [p.weekNumber, p]))
  const challengeMap = new Map(child.challengeResponses.map(c => [c.weekNumber, c]))

  const weeks = programWeeks.map(week => {
    const progress = progressMap.get(week.w)
    const challenge = challengeMap.get(week.w)
    return {
      number: week.w,
      title: week.title,
      emoji: week.emoji,
      color: week.color,
      status: (progress?.completed
        ? 'completed'
        : progress
          ? 'in-progress'
          : 'upcoming') as 'completed' | 'in-progress' | 'upcoming',
      completedAt: progress?.completedAt?.toISOString() ?? null,
      currentStep: progress?.currentStep ?? null,
      challengeResponse: (challenge?.response ?? null) as 'yes' | 'not-yet' | null,
    }
  })

  const completedCount = weeks.filter(w => w.status === 'completed').length
  const yesCount = child.challengeResponses.filter(c => c.response === 'yes').length
  const totalChallenges = child.challengeResponses.length

  // Milestones
  const firstWeek   = child.lessonProgress.find(p => p.weekNumber === 1)
  const halfwayWeek = child.lessonProgress.find(p => p.weekNumber === halfwayNumber && p.completed)
  const finalWeek   = child.lessonProgress.find(p => p.weekNumber === totalWeeks && p.completed)

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
      totalWeeks={totalWeeks}
      isComplete={completedCount === totalWeeks}
      certificateUrl={`/certificate/${child.id}`}
    />
  )
}
