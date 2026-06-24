// app/api/v1/challenges/[childId]/route.ts
// GET — return all challenge responses for a child

import { db } from '@/lib/db'
import { ok } from '@/lib/api'
import { withOwnership } from '@/lib/api/middleware'

export const GET = withOwnership(async (_req, _session, { childId }) => {
  const challenges = await db.challengeResponse.findMany({
    where: { childId },
    orderBy: { weekNumber: 'asc' },
    select: {
      weekNumber: true,
      response: true,
      createdAt: true,
    },
  })

  // Compute summary stats alongside the list
  const yesCount = challenges.filter(c => c.response === 'yes').length
  const totalWeeksStarted = challenges.length

  return ok({
    challenges,
    summary: {
      totalResponses: totalWeeksStarted,
      yesCount,
      notYetCount: totalWeeksStarted - yesCount,
      completionRate: totalWeeksStarted > 0 ? Math.round((yesCount / totalWeeksStarted) * 100) : 0,
    },
  })
})
