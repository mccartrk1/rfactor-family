// app/api/v1/admin/families/route.ts
// GET — paginated list of all families with progress summary

import { NextRequest } from 'next/server'
import { paginated } from '@/lib/api'
import { withAdmin } from '@/lib/api/middleware'
import { parsePagination } from '@/lib/api'
import { getFamilyList } from '@/lib/admin'
import { db } from '@/lib/db'

export const GET = withAdmin('list_families', async (req) => {
  const url = new URL(req.url)
  const { page, limit, offset } = parsePagination(url, 100)

  const [families, total] = await Promise.all([
    getFamilyList(limit, offset),
    db.family.count(),
  ])

  return paginated(families, {
    page,
    limit,
    total,
    hasMore: offset + families.length < total,
  })
})
