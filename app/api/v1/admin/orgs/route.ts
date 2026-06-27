// app/api/v1/admin/orgs/route.ts
// GET  — list all organizations
// POST — create a new organization

import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { withAdmin, withAdminAndBody } from '@/lib/api/middleware'
import { getOrgList, createOrganization } from '@/lib/admin'
import { validateCreateOrg } from './validation'

// ─── GET: list orgs ───────────────────────────────────────────────────────────

export const GET = withAdmin('list_orgs', async () => {
  const orgs = await getOrgList()
  return ok({ orgs })
})

// ─── POST: create org ─────────────────────────────────────────────────────────

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
