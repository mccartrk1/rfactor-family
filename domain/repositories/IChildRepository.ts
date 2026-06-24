// domain/repositories/IChildRepository.ts
//
// Interface (port) for child data access.
// Infrastructure layer provides the Prisma implementation.
// Application layer depends only on this interface — never on Prisma directly.

import { ChildProfile, ChildProfileData } from '../entities/ChildProfile'

export interface IChildRepository {
  /** Find a child by ID, verifying it belongs to the given user. Returns null if not found or not owned. */
  findByIdForUser(childId: string, userId: string): Promise<ChildProfile | null>

  /** Create a child record. Caller is responsible for providing the familyId. */
  create(familyId: string, data: Omit<ChildProfileData, 'id' | 'familyId'>): Promise<ChildProfile>
}
