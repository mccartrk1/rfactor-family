// app/api/v1/admin/orgs/validation.ts
//
// Body validator for creating an organization. This lives outside route.ts on
// purpose: Next.js route files may only export request handlers and route
// config, not helpers. Keeping the validator here lets the route import it and
// lets tests import it directly.
import type { BodyValidator } from '@/lib/api/middleware'

export interface CreateOrgBody {
  slug: string
  name: string
  description?: string
  tier: 'pilot' | 'pro' | 'enterprise'
  maxFamilies: number
  primaryColor?: string
  adminEmail?: string
}

export const validateCreateOrg: BodyValidator<CreateOrgBody> = (raw) => {
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
