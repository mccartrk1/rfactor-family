// infrastructure/repositories/PrismaChildRepository.ts

import type { IChildRepository } from '@/domain/repositories/IChildRepository'
import { ChildProfile } from '@/domain/entities/ChildProfile'
import type { ChildProfileData } from '@/domain/entities/ChildProfile'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export class PrismaChildRepository implements IChildRepository {
  async findByIdForUser(childId: string, userId: string): Promise<ChildProfile | null> {
    const record = await db.child.findFirst({
      where: { id: childId, family: { userId } },
    })
    if (!record) return null
    return ChildProfile.fromPrisma(record as unknown as Record<string, unknown>)
  }

  async create(
    familyId: string,
    data: Omit<ChildProfileData, 'id' | 'familyId'>
  ): Promise<ChildProfile> {
    // userId is denormalized onto Child for index-only ownership checks.
    const family = await db.family.findUniqueOrThrow({
      where: { id: familyId },
      select: { userId: true },
    })
    // Everything except track lives in the JSONB profile column.
    const { track, ...profileData } = data
    const record = await db.child.create({
      data: {
        familyId,
        userId: family.userId,
        track: track || 'elementary',
        profile: profileData as unknown as Prisma.InputJsonObject,
      },
    })
    return ChildProfile.fromPrisma(record as unknown as Record<string, unknown>)
  }
}
