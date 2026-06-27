// app/lesson/[week]/page.tsx
//
// PERF FIX 1: curriculum.ts removed from client bundle.
// Server resolves lesson data and passes only what's needed as props.
// Client never downloads the full curriculum module.
//
// Track-aware: the learner's `track` selects which program (kid vs adult) the
// lesson content comes from. Defaults to the kid program when no child is found.

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { db } from '@/lib/db'
import { getLessonsForTrack, getProgramWeeks } from '@/content/programs'
import LessonClient from './client'

interface Props {
  params: { week: string }
  searchParams: { childId?: string }
}

export default async function LessonPage({ params, searchParams }: Props) {
  const weekNumber = parseInt(params.week)
  const childId = searchParams.childId || ''

  // Resolve the learner's track so we serve the right program's content.
  const child = childId
    ? await db.child.findUnique({ where: { id: childId }, select: { track: true } })
    : null
  const track = child?.track ?? 'elementary'

  const weeks = getProgramWeeks(track)
  const lessons = await getLessonsForTrack(track)
  const totalWeeks = weeks.length

  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > totalWeeks) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: '#6B7280' }}>Invalid week.</p>
      </div>
    )
  }

  const lesson = lessons[weekNumber]
  const week = weeks.find(w => w.w === weekNumber)!

  // Pass prev week's challenge so the client doesn't need the curriculum module.
  const prevChallenge = weekNumber > 1 ? lessons[weekNumber - 1]?.challenge ?? null : null

  if (!lesson || !week) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: '#6B7280' }}>Week not found.</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div style={{ minHeight: '100vh', background: week.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 48, animation: 'rfpulse 1.4s ease-in-out infinite' }}>{week.emoji}</div>
        </div>
      }>
        <LessonClient
          weekNumber={weekNumber}
          childId={childId}
          lesson={lesson}
          week={week}
          prevChallenge={prevChallenge}
        />
      </Suspense>
    </ErrorBoundary>
  )
}
