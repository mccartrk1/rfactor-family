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

  const child = await db.child.findFirst({
    where: { id: params.childId, userId: session.user.id },
    select: {
      id: true,
      name: true,
      familyName: true,
      age: true,
      grade: true,
      school: true,
      mascot: true,
      teacher: true,
      bestFriend: true,
      friends: true,
      activity: true,
      game: true,
      loveFood: true,
      hateFood: true,
      athlete: true,
      team: true,
      grandparent: true,
      trustedAdults: true,
      babysitter: true,
      hardThing: true,
      flashPoint: true,
      siblings: true,
      track: true,
    },
  })

  if (!child) notFound()

  return <ChildProfileEditClient child={child} />
}
