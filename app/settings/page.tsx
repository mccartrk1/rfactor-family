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
          name: true,
          age: true,
          grade: true,
          school: true,
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
      children={family.children.map(c => ({
        id: c.id,
        name: c.name,
        age: c.age,
        grade: c.grade,
        school: c.school,
        track: c.track,
        createdAt: c.createdAt.toISOString(),
        weeksCompleted: c.lessonProgress.length,
      }))}
    />
  )
}
