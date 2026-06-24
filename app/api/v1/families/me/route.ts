// app/api/v1/families/me/route.ts
// GET  — return current family + children summary
// PUT  — update family name

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, err } from '@/lib/api'
import { withAuth, withBody } from '@/lib/api/middleware'
import { validateFamilyUpdate } from '@/lib/api/validation'

export const GET = withAuth(async (_req, session) => {
  const family = await db.family.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      familyName: true,
      inviteCode: true,
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
          updatedAt: true,
        },
      },
    },
  })

  if (!family) {
    return err('NOT_FOUND', 'No family found for this account')
  }

  return ok({ family })
})

export const PUT = withAuth(
  withBody(validateFamilyUpdate)(async (_req, session, body) => {
    const family = await db.family.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!family) {
      return err('NOT_FOUND', 'No family found for this account')
    }

    const updated = await db.family.update({
      where: { id: family.id },
      data: { familyName: body.familyName },
      select: { id: true, familyName: true, createdAt: true },
    })

    return ok({ family: updated })
  })
)
