// app/api/v1/admin/orgs/route.ts
// GET  — list all organizations
// POST — create a new organization

import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { withAdmin, withAdminAndBody } from '@/lib/api/middleware'
import { getOrgList, createOrganization } from '@/lib/admin'
import type { BodyValidator } from '@/lib/api/middleware'

// ─── GET: list orgs ───────────────────────────────────────────────────────────

export const GET = withAdmin('list_orgs', async () => {
  const orgs = await getOrgList()
  return ok({ orgs })
})

// ─── POST: create org ─────────────────────────────────────────────────────────

interface CreateOrgBody {
  slug: string
  name: string
  description?: string
  tier: 'pilot' | 'pro' | 'enterprise'
  maxFamilies: number
  primaryColor?: string
  adminEmail?: string
}

const validateCreateOrg: BodyValidator<CreateOrgBody> = (raw) => {
  const b = raw as Record<string, unknown>
  const errors: Record<string, string> = {}

  const slug = String(b.slug ?? '').trim().toLowerCase()
  if (!slug) errors.slug = 'Slug is required'
  else if (!/^[a-z0-9-]+$/.test(slug)) errors.slug = 'Lowercase letters, numbers, hyphens only'
  else if (slug.length < 2 || slug.length > 32) errors.slug = 'Must be 2–32 characters'

  const name = String(b.name ?? '').trim()
  if (!name) errors.name = 'Name is required'
  if (name.length > 100) errors.name = 'Name must be 100 characters or fewer'

  if (b.primaryColor !== undefined) {
    const color = String(b.primaryColor)
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) errors.primaryColor = 'Must be a valid hex color (#RRGGBB)'
  }

  const tier = String(b.tier ?? 'pilot')
  if (!['pilot', 'pro', 'enterprise'].includes(tier)) errors.tier = 'Must be pilot, pro, or enterprise'

  const maxFamilies = typeof b.maxFamilies === 'number' ? b.maxFamilies : parseInt(String(b.maxFamilies), 10)
  if (isNaN(maxFamilies) || maxFamilies < 1 || maxFamilies > 100000) errors.maxFamilies = 'Must be 1–100,000'

  if (Object.keys(errors).length) return { ok: false, errors }

  return {
    ok: true,
    data: {
      slug,
      name,
      description: b.description ? String(b.description).trim().slice(0, 500) : undefined,
      tier: tier as 'pilot' | 'pro' | 'enterprise',
      maxFamilies,
      primaryColor: b.primaryColor ? String(b.primaryColor) : undefined,
      adminEmail: b.adminEmail ? String(b.adminEmail).trim().toLowerCase() : undefined,
    },
  }
}

export const POST = withAdminAndBody('create_org', validateCreateOrg)(
  async (_req, _adminEmail, body) => {
    try {
      const orgId = await createOrganization(body)
      return ok({ orgId, slug: body.slug }, 201)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('Unique constraint') || msg.includes('P2002')) {
        return err('CONFLICT', 'An organization with this slug already exists')
      }
      return err('INTERNAL_ERROR', 'Could not create organization')
    }
  }
)
