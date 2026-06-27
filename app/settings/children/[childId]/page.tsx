// app/settings/children/[childId]/page.tsx
// RSC — loads full child profile, passes to edit form.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { ChildProfileEditClient } from './client'

interface Props { params: { childId: string } }

export default async function ChildProfileEditPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  // All profile fields (name, age, grade, mascot, ...) live inside the JSONB
  // `profile` column, not as top-level Child columns. Select `profile` and flatten
  // it for the edit form. Selecting the old columns directly crashed this page.
  const child = await db.child.findFirst({
    where: { id: params.childId, userId: session.user.id },
    select: {
      id: true,
      track: true,
      profile: true,
      family: { select: { familyName: true } },
    },
  })

  if (!child) notFound()

  const profile = (child.profile as Record<string, unknown> | null) ?? {}
  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

  const childData = {
    id: child.id,
    name: str(profile.name),
    familyName: str(profile.familyName) || str(child.family?.familyName),
    age: str(profile.age),
    grade: str(profile.grade),
    school: str(profile.school),
    mascot: str(profile.mascot),
    teacher: str(profile.teacher),
    bestFriend: str(profile.bestFriend),
    friends: str(profile.friends),
    activity: str(profile.activity),
    game: str(profile.game),
    loveFood: str(profile.loveFood),
    hateFood: str(profile.hateFood),
    athlete: str(profile.athlete),
    team: str(profile.team),
    grandparent: str(profile.grandparent),
    trustedAdults: str(profile.trustedAdults),
    babysitter: str(profile.babysitter),
    hardThing: str(profile.hardThing),
    flashPoint: str(profile.flashPoint),
    siblings: str(profile.siblings),
    track: child.track,
  }

  return <ChildProfileEditClient child={childData} />
}
