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
          track: true,
          createdAt: true,
          updatedAt: true,
          // name/age/grade/school live in the JSONB `profile` column.
          profile: true,
        },
      },
    },
  })

  if (!family) {
    return err('NOT_FOUND', 'No family found for this account')
  }

  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
  const children = family.children.map((c: { id: string; track: string; createdAt: Date; updatedAt: Date; profile: unknown }) => {
    const p = (c.profile as Record<string, unknown> | null) ?? {}
    return {
      id: c.id,
      name: str(p.name),
      age: str(p.age),
      grade: str(p.grade),
      school: str(p.school),
      track: c.track,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }
  })

  return ok({ family: { ...family, children } })
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
