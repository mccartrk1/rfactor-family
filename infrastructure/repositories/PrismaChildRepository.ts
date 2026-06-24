// infrastructure/repositories/PrismaChildRepository.ts

import type { IChildRepository } from '@/domain/repositories/IChildRepository'
import { ChildProfile } from '@/domain/entities/ChildProfile'
import type { ChildProfileData } from '@/domain/entities/ChildProfile'
import { db } from '@/lib/db'

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
    const record = await db.child.create({
      data: { familyId, ...data },
    })
    return ChildProfile.fromPrisma(record as unknown as Record<string, unknown>)
  }
}
