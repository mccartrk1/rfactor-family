// application/use-cases/CreateFamilyUseCase.ts
//
// Business rules for creating a family:
//   - Invite code must exist and be unused (new family only)
//   - Family + invite consumption + child creation are atomic
//   - Second child skips invite code logic entirely
//
// No HTTP concerns. No Prisma types. Testable in isolation.

import type { IFamilyRepository } from '@/domain/repositories/IFamilyRepository'
import { ChildProfile, ChildProfileError } from '@/domain/entities/ChildProfile'

export interface CreateFamilyInput {
  userId: string
  userName: string | null
  childData: Record<string, unknown>
  inviteCode?: string
  isNewFamily: boolean
  existingFamilyId?: string
}

export type CreateFamilyResult =
  | { success: true; childId: string }
  | { success: false; error: string; code: 'INVALID_INVITE' | 'INVITE_USED' | 'VALIDATION' | 'CONFLICT' | 'UNKNOWN' }

export class CreateFamilyUseCase {
  constructor(private readonly families: IFamilyRepository) {}

  async execute(input: CreateFamilyInput): Promise<CreateFamilyResult> {
    // Validate child data using the domain entity — errors surface cleanly
    let profile: ChildProfile
    try {
      profile = ChildProfile.create({
        id: 'pending',
        familyId: 'pending',
        ...Object.fromEntries(
          Object.entries(input.childData).map(([k, v]) => [k, String(v ?? '')])
        ),
      })
    } catch (e) {
      if (e instanceof ChildProfileError) {
        return { success: false, error: e.message, code: 'VALIDATION' }
      }
      throw e
    }

    try {
      if (!input.isNewFamily && input.existingFamilyId) {
        // Adding a second child — no invite needed
        const { childId } = await this.families.addChild(
  input.existingFamilyId,
  profile.toCreateInput() as Record<string, string>,
  input.userId
)
        return { success: true, childId }
      }

      // New family — invite code is required
      const code = (input.inviteCode ?? '').trim().toLowerCase()
      if (!code) {
        return { success: false, error: 'Invite code required', code: 'INVALID_INVITE' }
      }

      const { childId } = await this.families.createWithInviteAndChild(
        input.userId,
        String(input.childData.familyName ?? input.userName ?? 'Family'),
        code,
        profile.toCreateInput() as Record<string, string>
      )

      return { success: true, childId }
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('INVALID_INVITE')) return { success: false, error: 'Invalid invite code', code: 'INVALID_INVITE' }
      if (msg.includes('INVITE_USED')) return { success: false, error: 'This invite code has already been used', code: 'INVITE_USED' }
      if (msg.includes('P2002') || msg.includes('Unique constraint')) return { success: false, error: 'Account already set up', code: 'CONFLICT' }
      return { success: false, error: 'Something went wrong', code: 'UNKNOWN' }
    }
  }
}
