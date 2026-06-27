// infrastructure/repositories/PrismaFamilyRepository.ts

import type { IFamilyRepository, FamilyData } from '@/domain/repositories/IFamilyRepository'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export class PrismaFamilyRepository implements IFamilyRepository {
  async findByUserId(userId: string): Promise<FamilyData | null> {
    const family = await db.family.findUnique({ where: { userId } })
    if (!family) return null
    return {
      id: family.id,
      userId: family.userId,
      familyName: family.familyName,
      inviteCode: family.inviteCode,
    }
  }

  async createWithInviteAndChild(
    userId: string,
    familyName: string,
    inviteCode: string,
    childData: Record<string, string>
  ): Promise<{ familyId: string; childId: string }> {
    const { family, child } = await db.$transaction(async tx => {
      const claimed = await tx.$executeRaw`
        UPDATE "InviteCode"
        SET "usedAt" = NOW(), "usedBy" = ${userId}
        WHERE code = ${inviteCode}
          AND "usedAt" IS NULL
      `

      if (claimed === 0) {
        const exists = await tx.inviteCode.findUnique({
          where: { code: inviteCode },
          select: { usedAt: true },
        })
        if (!exists) throw new Error('INVALID_INVITE')
        throw new Error('INVITE_USED')
      }

      const family = await tx.family.create({
        data: { userId, familyName, inviteCode },
      })

      // Child table holds relational fields + `track` column + a profile JSON.
      // `track` selects the program (kid vs adult), so it must live on the
      // column the app reads — not buried in the profile JSON.
      const { id: _id, familyId: _familyId, track, ...profileData } = childData
      const child = await tx.child.create({
        data: {
          familyId: family.id,
          userId,
          track: track || 'elementary',
          profile: profileData as Prisma.InputJsonObject,
        },
      })

      return { family, child }
    }, {
      isolationLevel: 'Serializable',
    })

    return { familyId: family.id, childId: child.id }
  }

  async addChild(
    familyId: string,
    childData: Record<string, string>,
    userId?: string
  ): Promise<{ childId: string }> {
    const { id: _id, familyId: _familyId, track, ...profileData } = childData
    const child = await db.child.create({
      data: {
        familyId,
        ...(userId ? { userId } : {}),
        track: track || 'elementary',
        profile: profileData as Prisma.InputJsonObject,
      },
    })
    return { childId: child.id }
  }
}
