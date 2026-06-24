// lib/admin.ts
//
// Admin auth guard and shared query functions.
// Every admin page calls requireAdmin() before touching any data.
// If the check fails it throws — caught by the layout, redirects to /.

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { db } from './db'
import { redirect } from 'next/navigation'

// ─── Audit logging ───────────────────────────────────────────────────────────
// Admin data access is logged server-side. At this pilot scale, logging to
// console (captured by Vercel's log drain) is sufficient.
// At scale: ship these to a structured logging service (Axiom, Datadog, etc.)

export function logAdminAccess(action: string, email: string, details?: string) {
  console.log(JSON.stringify({
    type: 'admin_access',
    action,
    adminEmail: email,
    details: details ?? null,
    timestamp: new Date().toISOString(),
  }))
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export async function requireAdmin(): Promise<string> {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.toLowerCase() ?? ''

  if (!email || !ADMIN_EMAILS.includes(email)) {
    redirect('/')
  }

  return email
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

// ─── Overview metrics ─────────────────────────────────────────────────────────
// Single Promise.all — all metrics resolve in parallel, one network round trip.

export interface OverviewMetrics {
  familyCount: number
  childCount: number
  completionCount: number        // total week completions across all children
  fullProgramCount: number       // children who completed all 13 weeks
  aiCallCount: number            // scenario cache entries = AI calls made
  estimatedCostUsd: number       // aiCallCount * $0.008
  challengeTotalCompletions: number  // total 'yes' challenge responses across all families
  inviteUsedCount: number
  inviteTotalCount: number
  activeThisWeek: number         // families with progress updated in last 7 days
  newThisWeek: number            // families joined in last 7 days
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Fix 4: activeThisWeek counts distinct families with recent progress,
  // not raw LessonProgress rows (one family could have 50+ rows updated).
  // Fix 5: challengeTotalCompletions is renamed from the misleading
  // challengeYesCount — it counts total yes responses, not distinct families.
  const [
    familyCount,
    childCount,
    completionCount,
    fullProgramCount,
    aiCallCount,
    challengeTotalCompletions,
    inviteUsedCount,
    inviteTotalCount,
    newThisWeek,
    recentProgressFamilies,
  ] = await Promise.all([
    db.family.count(),
    db.child.count(),
    db.lessonProgress.count({ where: { completed: true } }),
    db.lessonProgress.count({ where: { completed: true, weekNumber: 13 } }),
    db.scenarioCache.count(),
    db.challengeResponse.count({ where: { response: 'yes' } }),
    db.inviteCode.count({ where: { usedAt: { not: null } } }),
    db.inviteCode.count(),
    db.family.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    // Distinct families with any lesson progress updated recently
    db.family.count({
      where: {
        children: {
          some: {
            lessonProgress: {
              some: { updatedAt: { gte: sevenDaysAgo } },
            },
          },
        },
      },
    }),
  ])

  const activeThisWeek = recentProgressFamilies

  return {
    familyCount,
    childCount,
    completionCount,
    fullProgramCount,
    aiCallCount,
    estimatedCostUsd: Math.round(aiCallCount * 0.008 * 100) / 100,
    challengeTotalCompletions, // total 'yes' responses across all families and weeks
    inviteUsedCount,
    inviteTotalCount,
    activeThisWeek, // distinct families with progress updated in last 7 days
    newThisWeek,
  }
}

// ─── Recent families (overview widget) ──────────────────────────────────────────
// Separate from getFamilyList() — only fetches what the overview page needs.
// Previously, getFamilyList() was called with full JOINs just to show 5 rows.

export interface RecentFamily {
  id: string
  familyName: string
  email: string
  createdAt: Date
  childCount: number
  maxWeekCompleted: number
  programsComplete: number
}

export async function getRecentFamilies(limit = 5): Promise<RecentFamily[]> {
  const families = await db.family.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true } },
      children: {
        select: {
          _count: { select: { lessonProgress: true } },
          lessonProgress: {
            where: { completed: true },
            select: { weekNumber: true },
          },
        },
      },
    },
  })

  return families.map(f => {
    const allCompletedWeeks = f.children.flatMap(c => c.lessonProgress.map(p => p.weekNumber))
    return {
      id: f.id,
      familyName: f.familyName,
      email: f.user.email ?? '—',
      createdAt: f.createdAt,
      childCount: f.children.length,
      maxWeekCompleted: allCompletedWeeks.length ? Math.max(...allCompletedWeeks) : 0,
      programsComplete: f.children.filter(c =>
        c.lessonProgress.some(p => p.weekNumber === 13)
      ).length,
    }
  })
}

// ─── Family list ──────────────────────────────────────────────────────────────
//
// OPTIMIZATION: Single aggregating SQL query replaces 5 Prisma queries
// plus JavaScript aggregation over potentially 660K rows.
//
// Old approach at 5,000 families:
//   5 queries → 660,000 rows transferred → JS reduce/filter → result
//   ~2-4 seconds, OOM risk
//
// New approach at 5,000 families:
//   1 query → GROUP BY aggregated in PostgreSQL → 5,000 rows transferred
//   ~100-200ms, linear scaling with families
//
// Pagination added: default 100 families per page.
// Admin rarely needs all families at once — pagination matches the UI.

export interface FamilySummary {
  id: string
  familyName: string
  email: string
  createdAt: Date
  childCount: number
  totalCompletions: number
  maxWeekCompleted: number
  challengeYesCount: number
  aiCallCount: number
  lastActivity: Date | null
  programsComplete: number
}

// Raw SQL result shape from PostgreSQL
interface FamilySummaryRaw {
  family_id: string
  family_name: string
  email: string | null
  created_at: Date
  child_count: bigint
  total_completions: bigint
  max_week_completed: number | null
  challenge_yes_count: bigint
  ai_call_count: bigint
  last_activity: Date | null
  programs_complete: bigint
}

export async function getFamilyList(
  limit = 100,
  offset = 0
): Promise<FamilySummary[]> {
  const rows = await db.$queryRaw<FamilySummaryRaw[]>`
    SELECT
      f.id                                              AS family_id,
      f."familyName"                                    AS family_name,
      f."createdAt"                                     AS created_at,
      u.email,
      COUNT(DISTINCT c.id)                              AS child_count,
      COUNT(lp.id) FILTER (WHERE lp.completed = true)  AS total_completions,
      MAX(lp."weekNumber") FILTER (WHERE lp.completed = true) AS max_week_completed,
      COUNT(cr.id) FILTER (WHERE cr.response = 'yes')  AS challenge_yes_count,
      COUNT(sc.id)                                      AS ai_call_count,
      MAX(lp."updatedAt")                               AS last_activity,
      COUNT(DISTINCT c.id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM "LessonProgress" lp2
          WHERE lp2."childId" = c.id
            AND lp2."weekNumber" = 13
            AND lp2.completed = true
        )
      )                                                 AS programs_complete
    FROM "Family" f
    JOIN "User" u ON f."userId" = u.id
    LEFT JOIN "Child" c ON c."familyId" = f.id
    LEFT JOIN "LessonProgress" lp ON lp."childId" = c.id
    LEFT JOIN "ChallengeResponse" cr ON cr."childId" = c.id
    LEFT JOIN "ScenarioCache" sc ON sc."childId" = c.id
    GROUP BY f.id, f."familyName", f."createdAt", u.email
    ORDER BY f."createdAt" DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  // PostgreSQL returns COUNT() as BigInt — convert to number
  return rows.map(r => ({
    id: r.family_id,
    familyName: r.family_name,
    email: r.email ?? '—',
    createdAt: r.created_at,
    childCount:       Number(r.child_count),
    totalCompletions: Number(r.total_completions),
    maxWeekCompleted: r.max_week_completed ?? 0,
    challengeYesCount: Number(r.challenge_yes_count),
    aiCallCount:      Number(r.ai_call_count),
    lastActivity:     r.last_activity,
    programsComplete: Number(r.programs_complete),
  }))
}

// ─── Family detail ────────────────────────────────────────────────────────────

export interface FamilyDetail {
  id: string
  familyName: string
  email: string
  createdAt: Date
  children: ChildDetail[]
}

export interface ChildDetail {
  id: string
  name: string
  age: string
  grade: string
  school: string
  track: string
  weekProgress: WeekProgress[]
  challengeYesWeeks: number[]
  aiCallCount: number
}

export interface WeekProgress {
  weekNumber: number
  completed: boolean
  completedAt: Date | null
  currentStep: string
  updatedAt: Date
}

export async function getFamilyDetail(familyId: string): Promise<FamilyDetail | null> {
  const family = await db.family.findUnique({
    where: { id: familyId },
    include: {
      user: { select: { email: true } },
      children: {
        include: {
          lessonProgress: { orderBy: { weekNumber: 'asc' } },
          challengeResponses: {
            where: { response: 'yes' },
            select: { weekNumber: true },
          },
          scenarioCache: { select: { id: true } },
        },
      },
    },
  })

  if (!family) return null

  return {
    id: family.id,
    familyName: family.familyName,
    email: family.user.email ?? '—',
    createdAt: family.createdAt,
    children: family.children.map(c => ({
      id: c.id,
      name: c.name,
      age: c.age,
      grade: c.grade,
      school: c.school,
      track: c.track,
      weekProgress: c.lessonProgress.map(p => ({
        weekNumber: p.weekNumber,
        completed: p.completed,
        completedAt: p.completedAt,
        currentStep: p.currentStep,
        updatedAt: p.updatedAt,
      })),
      challengeYesWeeks: c.challengeResponses.map(r => r.weekNumber),
      aiCallCount: c.scenarioCache.length,
    })),
  }
}


// ─── Organization management ──────────────────────────────────────────────────

export interface OrgSummary {
  id: string
  slug: string
  name: string
  tier: string
  isActive: boolean
  maxFamilies: number
  primaryColor: string
  logoUrl: string | null
  familyCount: number
  childCount: number
  completionCount: number
  createdAt: Date
}

export async function getOrgList(): Promise<OrgSummary[]> {
  const orgs = await db.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { families: true } },
      families: {
        include: {
          children: {
            include: {
              _count: { select: { id: true } },
              lessonProgress: {
                where: { completed: true },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  })

  return orgs.map(org => {
    const allChildren = org.families.flatMap(f => f.children)
    const completionCount = allChildren.reduce((sum, c) => sum + c.lessonProgress.length, 0)
    return {
      id: org.id,
      slug: org.slug,
      name: org.name,
      tier: org.tier,
      isActive: org.isActive,
      maxFamilies: org.maxFamilies,
      primaryColor: org.primaryColor,
      logoUrl: org.logoUrl,
      familyCount: org._count.families,
      childCount: allChildren.length,
      completionCount,
      createdAt: org.createdAt,
    }
  })
}

export interface OrgDetail {
  id: string
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  primaryColor: string
  tier: string
  isActive: boolean
  maxFamilies: number
  features: Record<string, boolean>
  createdAt: Date
  updatedAt: Date
  families: FamilySummary[]
  inviteCodes: OrgInvite[]
  metrics: OrgMetrics
}

export interface OrgInvite {
  id: string
  code: string
  note: string | null
  usedAt: Date | null
  usedBy: string | null
  createdAt: Date
}

export interface OrgMetrics {
  familyCount: number
  childCount: number
  totalCompletions: number
  fullProgramCount: number
  aiCallCount: number
  estimatedCostUsd: number
  activeThisWeek: number
  avgWeeksCompleted: number
}

export async function getOrgDetail(slug: string): Promise<OrgDetail | null> {
  const org = await db.organization.findUnique({ where: { slug } })
  if (!org) return null

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Org-scoped metrics
  const [families, orgChildren, aiCalls, activeCount, inviteCodes] = await Promise.all([
    // Family list scoped to this org
    getFamilyListForOrg(org.id),
    // All children in this org
    db.child.findMany({
      where: { family: { organizationId: org.id } },
      include: {
        lessonProgress: { where: { completed: true }, select: { weekNumber: true } },
        scenarioCache: { select: { id: true } },
      },
    }),
    // AI calls for this org
    db.scenarioCache.count({
      where: { child: { family: { organizationId: org.id } } },
    }),
    // Active families this week
    db.family.count({
      where: {
        organizationId: org.id,
        children: {
          some: { lessonProgress: { some: { updatedAt: { gte: sevenDaysAgo } } } },
        },
      },
    }),
    // Invite codes for this org
    db.inviteCode.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, code: true, note: true, usedAt: true, usedBy: true, createdAt: true },
    }),
  ])

  const totalCompletions = orgChildren.reduce((sum, c) => sum + c.lessonProgress.length, 0)
  const fullProgramCount = orgChildren.filter(c => c.lessonProgress.some(p => p.weekNumber === 13)).length
  const totalWeeks = orgChildren.reduce((sum, c) => sum + c.lessonProgress.length, 0)
  const avgWeeksCompleted = orgChildren.length > 0 ? Math.round((totalWeeks / orgChildren.length) * 10) / 10 : 0

  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    description: org.description,
    logoUrl: org.logoUrl,
    primaryColor: org.primaryColor,
    tier: org.tier,
    isActive: org.isActive,
    maxFamilies: org.maxFamilies,
    features: (org.features as Record<string, boolean>) ?? {},
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    families,
    inviteCodes: inviteCodes.map(i => ({
      id: i.id, code: i.code, note: i.note,
      usedAt: i.usedAt, usedBy: i.usedBy, createdAt: i.createdAt,
    })),
    metrics: {
      familyCount: families.length,
      childCount: orgChildren.length,
      totalCompletions,
      fullProgramCount,
      aiCallCount: aiCalls,
      estimatedCostUsd: Math.round(aiCalls * 0.008 * 100) / 100,
      activeThisWeek: activeCount,
      avgWeeksCompleted,
    },
  }
}

// ─── Org-scoped family list ───────────────────────────────────────────────────

interface OrgFamilyRaw {
  family_id: string
  family_name: string
  email: string | null
  created_at: Date
  child_count: bigint
  total_completions: bigint
  max_week_completed: number | null
  challenge_yes_count: bigint
  ai_call_count: bigint
  last_activity: Date | null
  programs_complete: bigint
}

export async function getFamilyListForOrg(orgId: string): Promise<FamilySummary[]> {
  const rows = await db.$queryRaw<OrgFamilyRaw[]>`
    SELECT
      f.id                                              AS family_id,
      f."familyName"                                    AS family_name,
      f."createdAt"                                     AS created_at,
      u.email,
      COUNT(DISTINCT c.id)                              AS child_count,
      COUNT(lp.id) FILTER (WHERE lp.completed = true)  AS total_completions,
      MAX(lp."weekNumber") FILTER (WHERE lp.completed = true) AS max_week_completed,
      COUNT(cr.id) FILTER (WHERE cr.response = 'yes')  AS challenge_yes_count,
      COUNT(sc.id)                                      AS ai_call_count,
      MAX(lp."updatedAt")                               AS last_activity,
      COUNT(DISTINCT c.id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM "LessonProgress" lp2
          WHERE lp2."childId" = c.id AND lp2."weekNumber" = 13 AND lp2.completed = true
        )
      )                                                 AS programs_complete
    FROM "Family" f
    JOIN "User" u ON f."userId" = u.id
    LEFT JOIN "Child" c ON c."familyId" = f.id
    LEFT JOIN "LessonProgress" lp ON lp."childId" = c.id
    LEFT JOIN "ChallengeResponse" cr ON cr."childId" = c.id
    LEFT JOIN "ScenarioCache" sc ON sc."childId" = c.id
    WHERE f."organizationId" = ${orgId}
    GROUP BY f.id, f."familyName", f."createdAt", u.email
    ORDER BY f."createdAt" DESC
  `

  return rows.map(r => ({
    id: r.family_id,
    familyName: r.family_name,
    email: r.email ?? '—',
    createdAt: r.created_at,
    childCount: Number(r.child_count),
    totalCompletions: Number(r.total_completions),
    maxWeekCompleted: r.max_week_completed ?? 0,
    challengeYesCount: Number(r.challenge_yes_count),
    aiCallCount: Number(r.ai_call_count),
    lastActivity: r.last_activity,
    programsComplete: Number(r.programs_complete),
  }))
}

// ─── Create organization ──────────────────────────────────────────────────────

export interface CreateOrgInput {
  slug: string
  name: string
  description?: string
  tier: 'pilot' | 'pro' | 'enterprise'
  maxFamilies: number
  primaryColor?: string
  adminEmail?: string  // optionally add an org admin member
}

export async function createOrganization(input: CreateOrgInput): Promise<string> {
  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error('Slug must be lowercase letters, numbers, and hyphens only')
  }

  const org = await db.organization.create({
    data: {
      slug: input.slug.toLowerCase(),
      name: input.name,
      description: input.description,
      tier: input.tier,
      maxFamilies: input.maxFamilies,
      primaryColor: input.primaryColor ?? '#0F2645',
      isActive: true,
      features: JSON.stringify({}),
    },
  })

  // Optionally add admin member
  if (input.adminEmail) {
    const user = await db.user.findUnique({
      where: { email: input.adminEmail },
      select: { id: true },
    })
    if (user) {
      await db.organizationMember.create({
        data: { organizationId: org.id, userId: user.id, role: 'admin' },
      })
    }
  }

  logAdminAccess('create_organization', 'system', `slug=${org.slug}, tier=${org.tier}`)
  return org.id
}

// ─── Update organization ──────────────────────────────────────────────────────

export interface UpdateOrgInput {
  name?: string
  description?: string
  primaryColor?: string
  logoUrl?: string
  tier?: string
  maxFamilies?: number
  isActive?: boolean
  features?: Record<string, boolean>
}

export async function updateOrganization(slug: string, input: UpdateOrgInput): Promise<void> {
  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.description !== undefined) updateData.description = input.description
  if (input.primaryColor !== undefined) updateData.primaryColor = input.primaryColor
  if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl
  if (input.tier !== undefined) updateData.tier = input.tier
  if (input.maxFamilies !== undefined) updateData.maxFamilies = input.maxFamilies
  if (input.isActive !== undefined) updateData.isActive = input.isActive
  if (input.features !== undefined) updateData.features = JSON.stringify(input.features)

  await db.organization.update({ where: { slug }, data: updateData })
  logAdminAccess('update_organization', 'admin', `slug=${slug}`)
}

// ─── Get org for a family user (for white-label branding) ────────────────────

export interface OrgBranding {
  name: string
  primaryColor: string
  logoUrl: string | null
  slug: string
}

export async function getOrgBrandingForUser(userId: string): Promise<OrgBranding | null> {
  const family = await db.family.findUnique({
    where: { userId },
    select: {
      organizationId: true,
      organization: {
        select: { name: true, primaryColor: true, logoUrl: true, slug: true, isActive: true },
      },
    },
  })

  const org = family?.organization
  if (!org || !org.isActive) return null

  // Don't apply branding for the default pilot org
  if (family?.organizationId === 'org_default_pilot') return null

  return {
    name: org.name,
    primaryColor: org.primaryColor,
    logoUrl: org.logoUrl,
    slug: org.slug,
  }
}
