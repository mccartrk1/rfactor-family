// app/dashboard/page.tsx
// React Server Component — no 'use client' directive.
//
// BEFORE (client component waterfall):
//   Render → useSession() → /api/children → /api/progress → render
//   User sees spinner for 2-4 seconds on every visit.
//
// AFTER (server component, one query):
//   getServerSession + Prisma findUnique with nested includes → render
//   User sees the complete week grid in the first HTML response. Zero spinner.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { DashboardShell } from './DashboardShell'
import { SubscriptionGate, TrialBannerServer } from '@/components/SubscriptionGate'
import { getSubscriptionStatus } from '@/lib/subscription'
import { OrgBrandingProvider, OrgHeaderBadge } from '@/components/OrgBrandingProvider'
import { getOrgBrandingForUser } from '@/lib/admin'
import type { Child, LessonProgress } from '@prisma/client'

export type ChildWithProgress = Child & {
  lessonProgress: LessonProgress[]
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  // Check subscription status and org branding in parallel
  const [subStatus, orgBranding] = await Promise.all([
    getSubscriptionStatus(session.user.id, session.user.email),
    getOrgBrandingForUser(session.user.id),
  ])

  // One query with nested includes: family + all children + all their progress.
  // Everything needed to render the full dashboard. No waterfalls.
  const family = await db.family.findUnique({
    where: { userId: session.user.id },
    include: {
      children: {
        orderBy: { createdAt: 'asc' },
        include: {
          lessonProgress: { orderBy: { weekNumber: 'asc' } },
        },
      },
    },
  })

  if (!family?.children?.length) redirect('/onboard')

  return (
    <OrgBrandingProvider branding={orgBranding}>
      <SubscriptionGate userId={session.user.id} userEmail={session.user.email}>
        <TrialBannerServer status={subStatus} />
        <DashboardShell
          children={family.children as ChildWithProgress[]}
          familyName={family.familyName}
          orgBranding={orgBranding}
        />
      </SubscriptionGate>
    </OrgBrandingProvider>
  )
}
