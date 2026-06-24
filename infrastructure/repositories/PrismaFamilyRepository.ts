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
    // RACE CONDITION FIX: Move invite validation INSIDE the transaction.
    //
    // Previous flow had a TOCTOU gap:
    //   1. findUnique check (outside tx) — both concurrent requests pass
    //   2. $transaction — both enter, both mark the invite used
    //   Result: one invite code creates two families
    //
    // Fix: Use a conditional UPDATE that only succeeds when usedAt IS NULL.
    // If two requests race, only one UPDATE will match the WHERE clause.
    // The other gets rowsAffected=0 and throws INVITE_USED.
    // No explicit SELECT needed — the UPDATE return value is the source of truth.
    //
    // Using serializable isolation to prevent phantom reads in the transaction.

    const { family, child } = await db.$transaction(async tx => {
      // Atomic conditional claim: mark invite used only if it's still available
      const claimed = await tx.$executeRaw`
        UPDATE "InviteCode"
        SET "usedAt" = NOW(), "usedBy" = ${userId}
        WHERE code = ${inviteCode}
          AND "usedAt" IS NULL
      `

      // claimed = 0 means either code doesn't exist OR is already used
      // Distinguish the two for better error messages
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
      const child = await tx.child.create({
        data: { familyId: family.id, ...childData },
      })
      return { family, child }
    }, {
      isolationLevel: 'Serializable',
    })

    return { familyId: family.id, childId: child.id }
  }

  async addChild(
    familyId: string,
    childData: Record<string, string>
  ): Promise<{ childId: string }> {
    const child = await db.child.create({
      data: { familyId, ...childData },
    })
    return { childId: child.id }
  }
}
