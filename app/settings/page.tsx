// app/settings/page.tsx
// RSC — loads family + children, passes to client shell.
// Zero loading spinner on first paint.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SettingsClient } from './client'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  const family = await db.family.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      familyName: true,
      createdAt: true,
      children: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          // name, age, grade, school live inside the JSONB `profile` column,
          // not as top-level Child columns. Selecting them directly threw a
          // Prisma error and crashed the Settings page. Read `profile` instead.
          profile: true,
          track: true,
          createdAt: true,
          lessonProgress: {
            where: { completed: true },
            select: { weekNumber: true },
          },
        },
      },
    },
  })

  if (!family) redirect('/onboard')

  const userEmail = session.user.email ?? ''

  return (
    <SettingsClient
      family={{
        id: family.id,
        familyName: family.familyName,
        createdAt: family.createdAt.toISOString(),
        userEmail,
      }}
      children={family.children.map((c: { id: string; track: string; createdAt: Date; profile: unknown; lessonProgress: { weekNumber: number }[] }) => {
        const profile = (c.profile as Record<string, unknown> | null) ?? {}
        const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
        return {
          id: c.id,
          name: str(profile.name),
          age: str(profile.age),
          grade: str(profile.grade),
          school: str(profile.school),
          track: c.track,
          createdAt: c.createdAt.toISOString(),
          weeksCompleted: c.lessonProgress.length,
        }
      })}
    />
  )
}
