// app/api/v1/admin/analytics/route.ts
//
// Program-wide analytics snapshot.
//
// Purpose: provide data for the Focus 3 pitch deck, progress reporting,
// and any future dashboard or data export integrations.
//
// Returns two sections:
//   metrics    — aggregate counts (families, completions, AI cost, engagement)
//   engagement — breakdown by week (which weeks families are reaching)
//   cohorts    — families by month joined (growth trend)
//   topFamilies — the 10 most-active families (by completions)

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok } from '@/lib/api'
import { withAdmin } from '@/lib/api/middleware'
import { getOverviewMetrics, getFamilyList } from '@/lib/admin'

export const GET = withAdmin('get_analytics', async (_req) => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [metrics, families, weekBreakdown, monthlyJoins] = await Promise.all([
    getOverviewMetrics(),

    // Top 10 families by completions (for the "real users" section of a demo)
    getFamilyList(10, 0),

    // Engagement funnel: how many children reach each week
    // This is the #1 question any buyer asks: "do families stay?"
    db.$queryRaw<Array<{ week_number: number; count: bigint }>>`
      SELECT "weekNumber" AS week_number, COUNT(DISTINCT "childId") AS count
      FROM "LessonProgress"
      WHERE completed = true
      GROUP BY "weekNumber"
      ORDER BY "weekNumber" ASC
    `,

    // Monthly join cohorts: new families per month for trend analysis
    db.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
      FROM "Family"
      GROUP BY month
      ORDER BY month ASC
    `,
  ])

  // Build the full 13-week funnel with 0 for weeks nobody has reached yet
  const weekMap = new Map(weekBreakdown.map(r => [r.week_number, Number(r.count)]))
  const weeklyEngagement = Array.from({ length: 13 }, (_, i) => ({
    week: i + 1,
    familiesCompleted: weekMap.get(i + 1) ?? 0,
  }))

  // Week-over-week retention: what % of families who started reach each subsequent week
  const startingFamilies = weeklyEngagement[0]?.familiesCompleted ?? 0
  const weeklyRetention = weeklyEngagement.map(w => ({
    ...w,
    retentionPct: startingFamilies > 0
      ? Math.round((w.familiesCompleted / startingFamilies) * 100)
      : 0,
  }))

  return ok({
    metrics,
    topFamilies: families,
    engagement: {
      weeklyFunnel: weeklyRetention,
      averageWeeksCompleted: metrics.completionCount > 0 && metrics.childCount > 0
        ? Math.round((metrics.completionCount / metrics.childCount) * 10) / 10
        : 0,
    },
    growth: {
      monthlyJoins: monthlyJoins.map(r => ({
        month: r.month,
        families: Number(r.count),
      })),
    },
    cost: {
      totalScenarios: metrics.aiCallCount,
      estimatedUsd: metrics.estimatedCostUsd,
      perFamily: metrics.familyCount > 0
        ? Math.round((metrics.estimatedCostUsd / metrics.familyCount) * 100) / 100
        : 0,
      perChild: metrics.childCount > 0
        ? Math.round((metrics.estimatedCostUsd / metrics.childCount) * 100) / 100
        : 0,
    },
    generated: new Date().toISOString(),
  })
})
