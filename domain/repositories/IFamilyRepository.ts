// domain/repositories/IFamilyRepository.ts

export interface FamilyData {
  id: string
  userId: string
  familyName: string
  inviteCode: string | null
}

export interface IFamilyRepository {
  /** Find a family by the owning user's ID. Returns null if no family exists yet. */
  findByUserId(userId: string): Promise<FamilyData | null>

  /**
   * Atomically creates a family, consumes the invite code, and creates the first child.
   * All three operations succeed or all fail together.
   */
  createWithInviteAndChild(
    userId: string,
    familyName: string,
    inviteCode: string,
    childData: Record<string, string>
  ): Promise<{ familyId: string; childId: string }>

  /** Add a child to an existing family. */
  addChild(familyId: string, childData: Record<string, string>, userId?: string): Promise<{ childId: string }>
}
