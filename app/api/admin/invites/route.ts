// app/api/admin/invites/route.ts
// Admin-only API for invite code management.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminEmail, logAdminAccess } from '@/lib/admin'
import { db } from '@/lib/db'

async function verifyAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return null
  }
  return session
}

export async function GET() {
  const session = await verifyAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  logAdminAccess('list_invite_codes', session.user.email!)
  const codes = await db.inviteCode.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ codes })
}

export async function POST(req: NextRequest) {
  const session = await verifyAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let code: unknown, note: unknown
  try {
    const body = await req.json()
    code = body.code
    note = body.note
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate code format
  const cleaned = String(code ?? '').trim().toLowerCase()
  if (!cleaned) return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  if (!/^[a-z0-9-]+$/.test(cleaned)) {
    return NextResponse.json({ error: 'Code must be lowercase letters, numbers, and hyphens only' }, { status: 400 })
  }
  const noteStr = String(note ?? '').trim()
  if (noteStr.length > 200) {
    return NextResponse.json({ error: 'Note must be 200 characters or fewer' }, { status: 400 })
  }
  if (cleaned.length < 4 || cleaned.length > 32) {
    return NextResponse.json({ error: 'Code must be 4-32 characters' }, { status: 400 })
  }

  logAdminAccess('create_invite_code', session.user.email!, `code=${cleaned}`)
  try {
    const created = await db.inviteCode.create({
      data: { code: cleaned, note: noteStr || null },
    })
    return NextResponse.json({ code: created }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('P2002')) {
      return NextResponse.json({ error: 'This code already exists' }, { status: 409 })
    }
    // MED-02 FIX: Don't propagate internal Prisma errors to HTTP response
    // Log the error server-side, return a safe generic message
    console.error('[admin/invites] Unexpected error:', e)
    return NextResponse.json({ error: 'Failed to create invite code' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifyAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let id: unknown
  try {
    const body = await req.json()
    id = body.id
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Don't delete used codes — they're audit records
  const existing = await db.inviteCode.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.usedAt) {
    return NextResponse.json({ error: 'Cannot delete a used invite code' }, { status: 400 })
  }

  logAdminAccess('delete_invite_code', session.user.email!, `id=${id}`)
  await db.inviteCode.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
