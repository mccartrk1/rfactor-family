// app/api/v1/admin/families/[familyId]/route.ts

import { ok, err } from '@/lib/api'
import { withAdminParams } from '@/lib/api/middleware'
import { getFamilyDetail } from '@/lib/admin'

export const GET = withAdminParams<{ familyId: string }>(
  'get_family_detail',
  async (_req, _adminEmail, { familyId }) => {
    const family = await getFamilyDetail(familyId)
    if (!family) return err('NOT_FOUND', 'Family not found')
    return ok({ family })
  }
)
