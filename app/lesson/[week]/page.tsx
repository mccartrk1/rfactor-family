// app/lesson/[week]/page.tsx
//
// PERF FIX 1: curriculum.ts removed from client bundle.
// Server resolves lesson data and passes only what's needed as props.
// Client never downloads the full 29KB curriculum module.

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LESSONS } from '@/content/curriculum'
import { WEEKS } from '@/content/weeks'
import LessonClient from './client'

interface Props {
  params: { week: string }
  searchParams: { childId?: string }
}

export default function LessonPage({ params, searchParams }: Props) {
  const weekNumber = parseInt(params.week)
  const childId = searchParams.childId || ''

  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 13) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: '#6B7280' }}>Invalid week.</p>
      </div>
    )
  }

  const lesson = LESSONS[weekNumber]
  const week = WEEKS.find(w => w.w === weekNumber)!

  // Pass prev week's challenge so the client doesn't need to import curriculum.ts
  const prevChallenge = weekNumber > 1 ? LESSONS[weekNumber - 1]?.challenge ?? null : null

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
