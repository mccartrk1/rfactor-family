// infrastructure/repositories/PrismaFamilyRepository.ts

import type { IFamilyRepository, FamilyData } from '@/domain/repositories/IFamilyRepository'
import { db } from '@/lib/db'

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
      // Atomic conditional claim: mark invite used only if it's still available
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

      // Spread childData first, then override familyId and userId so placeholders
      // from ChildProfile never reach the database. profile defaults to {} if
      // not supplied — it is a required JSON column in the schema.
      const child = await tx.child.create({
        data: { ...childData, familyId: family.id, userId, profile: {} },
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
    const child = await db.child.create({
      data: {
        ...childData,
        familyId,
        profile: {},
        ...(userId ? { userId } : {}),
      },
    })
    return { childId: child.id }
  }
}
