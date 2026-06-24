// app/api/v1/admin/orgs/[slug]/route.ts
// GET — get org detail with metrics and families
// PUT — update org settings (branding, tier, status)

import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { withAdminParams } from '@/lib/api/middleware'
import { getOrgDetail, updateOrganization } from '@/lib/admin'

type Params = { slug: string }

// ─── GET ─────────────────────────────────────────────────────────────────────

export const GET = withAdminParams<Params>(
  'get_org_detail',
  async (_req, _adminEmail, { slug }) => {
    const org = await getOrgDetail(slug)
    if (!org) return err('NOT_FOUND', `Organization '${slug}' not found`)
    return ok({ org })
  }
)

// ─── PUT ─────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest, ctx: { params: Params }) {
  return withAdminParams<Params>(
    'update_org',
    async (_req, _adminEmail, { slug }) => {
      let body: Record<string, unknown>
      try { body = await req.json() }
      catch { return err('VALIDATION_ERROR', 'Invalid JSON') }

      const update: Record<string, unknown> = {}
      if (body.name !== undefined) {
        const name = String(body.name).trim()
        if (!name) return err('VALIDATION_ERROR', 'Name cannot be empty')
        update.name = name
      }
      if (body.description !== undefined) update.description = String(body.description).trim()
      if (body.primaryColor !== undefined) {
        const color = String(body.primaryColor)
        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return err('VALIDATION_ERROR', 'primaryColor must be a valid hex color (#RRGGBB)')
        update.primaryColor = color
      }
      if (body.logoUrl !== undefined) {
        const url = String(body.logoUrl).trim()
        if (url && !url.startsWith('https://')) return err('VALIDATION_ERROR', 'logoUrl must use HTTPS')
        update.logoUrl = url || null
      }
      if (body.tier !== undefined) {
        if (!['pilot','pro','enterprise'].includes(String(body.tier))) {
          return err('VALIDATION_ERROR', 'tier must be pilot, pro, or enterprise')
        }
        update.tier = String(body.tier)
      }
      if (body.maxFamilies !== undefined) {
        const max = parseInt(String(body.maxFamilies), 10)
        if (isNaN(max) || max < 1) return err('VALIDATION_ERROR', 'maxFamilies must be a positive integer')
        update.maxFamilies = max
      }
      if (body.isActive !== undefined) {
        update.isActive = body.isActive === true || body.isActive === 'true'
      }

      try {
        await updateOrganization(slug, update as any)
        return ok({ updated: true })
      } catch (e) {
        return err('INTERNAL_ERROR', e instanceof Error ? e.message : 'Update failed')
      }
    }
  )(req, ctx)
}
