// app/api/cron/email-reminders/route.ts
//
// Daily email reminder cron.
// Schedule: 0 9 * * * (9am UTC daily, 5am ET)
// Protected by CRON_SECRET bearer token.
//
// Logic:
//   1. Find children who completed a lesson exactly 7 days ago (±1 hour tolerance)
//      and have not yet started the next lesson
//   2. Send a reminder to the parent email for that child
//   3. Find families that have been inactive for 14+ days
//      and have not received a re-engagement email in 7+ days
//   4. Send a re-engagement email
//
// Rate controls:
//   - Max 1 reminder email per child per lesson gap
//   - Max 1 re-engagement per family per 7 days
//   - If RESEND_API_KEY absent, log and exit cleanly
//
// De-duplication:
//   The LessonProgress.updatedAt timestamp determines the 7-day window.
//   A reminder is NOT sent if weekNumber+1 progress already exists
//   (meaning they already started the next lesson — no need to remind).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendReminderEmail, sendReengagementEmail } from '@/lib/email'
import { logger, LogEvents } from '@/lib/logger'
import { timingSafeEqual } from 'crypto'
import { WEEKS } from '@/content/weeks'

// Timing-safe CRON_SECRET comparison
function verifySecret(authHeader: string): boolean {
  const secret = process.env.CRON_SECRET ?? ''
  const expected = `Bearer ${secret}`
  try {
    const a = Buffer.from(authHeader.padEnd(expected.length))
    const b = Buffer.from(expected.padEnd(authHeader.length))
    return a.length === b.length && timingSafeEqual(a, b)
  } catch { return false }
}

// Day window for "completed 7 days ago" check: [6.5 days, 7.5 days]
const REMINDER_DAYS = 7
const WINDOW_HOURS = 12  // ± 12h around the 7-day mark
const REENGAGEMENT_DAYS = 14

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  if (!verifySecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    logger.warn('email.cron_skipped', { reason: 'RESEND_API_KEY not configured' })
    return NextResponse.json({ skipped: true, reason: 'Email not configured' })
  }

  const now = new Date()
  const results = { reminders: 0, reengagements: 0, skipped: 0, errors: 0 }

  // ── Weekly reminders ──────────────────────────────────────────────────────
  // Find lessons completed ~7 days ago where next lesson not started

  const sevenDaysAgo = new Date(now.getTime() - REMINDER_DAYS * 24 * 60 * 60 * 1000)
  const windowStart  = new Date(sevenDaysAgo.getTime() - WINDOW_HOURS * 60 * 60 * 1000)
  const windowEnd    = new Date(sevenDaysAgo.getTime() + WINDOW_HOURS * 60 * 60 * 1000)

  const dueLessons = await db.lessonProgress.findMany({
    where: {
      completed: true,
      completedAt: { gte: windowStart, lte: windowEnd },
      weekNumber: { lt: 13 },  // don't send reminders for post-week-13
    },
    select: {
      childId: true,
      weekNumber: true,
      child: {
        select: {
          id: true,
          profile: true,
          userId: true,
          family: {
            select: {
              user: { select: { email: true, name: true } },
            },
          },
        },
      },
    },
  })

  for (const lesson of dueLessons) {
    const nextWeek = lesson.weekNumber + 1

    // Check if next lesson already started — if so, skip
    const nextStarted = await db.lessonProgress.findFirst({
      where: { childId: lesson.childId, weekNumber: nextWeek },
      select: { id: true },
    })
    if (nextStarted) { results.skipped++; continue }

    const email = lesson.child.family?.user?.email
    if (!email) { results.skipped++; continue }

    const profile = lesson.child.profile as unknown as Record<string, string>
    const childName = profile.name ?? 'your child'
    const weekData = WEEKS.find(w => w.w === nextWeek)
    if (!weekData) { results.skipped++; continue }

    const result = await sendReminderEmail({
      to: email,
      childName,
      weekNumber: nextWeek,
      weekTitle: weekData.title,
      weekEmoji: weekData.emoji,
    })

    if (result.success) {
      results.reminders++
      logger.info('email.reminder_sent', { childId: lesson.childId, week: nextWeek })
    } else {
      results.errors++
      logger.error('email.reminder_failed', { childId: lesson.childId, error: result.error })
    }

    // Brief pause to be gentle on Resend's API
    await new Promise(r => setTimeout(r, 100))
  }

  // ── Re-engagement emails ──────────────────────────────────────────────────
  // Families inactive 14+ days who haven't received re-engagement in 7 days

  const twoWeeksAgo = new Date(now.getTime() - REENGAGEMENT_DAYS * 24 * 60 * 60 * 1000)

  const inactiveFamilies = await db.family.findMany({
    where: {
      children: {
        some: {
          lessonProgress: {
            some: {
              completed: false,
              updatedAt: { lt: twoWeeksAgo },
            },
          },
        },
      },
    },
    select: {
      user: { select: { email: true } },
      children: {
        select: {
          id: true,
          profile: true,
          lessonProgress: {
            where: { completed: false },
            orderBy: { weekNumber: 'asc' },
            take: 1,
            select: { weekNumber: true, updatedAt: true },
          },
        },
        take: 1,  // first child only for re-engagement
      },
    },
    take: 100,  // cap per cron run
  })

  for (const family of inactiveFamilies) {
    const email = family.user?.email
    const child = family.children[0]
    if (!email || !child) { results.skipped++; continue }

    // SEC-05 FIX: Throttle re-engagement to max 1 per family per 7 days
    // Reuse the RateLimit table with a 'reengagement:userId' key
    const userId = family.user?.email ?? ''
    const throttleKey = `reengagement:${Buffer.from(userId).toString('base64').slice(0, 16)}`
    const sevenDaysAgoThrottle = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentReengagement = await db.rateLimit.findFirst({
      where: { key: throttleKey, updatedAt: { gt: sevenDaysAgoThrottle } },
      select: { id: true },
    })
    if (recentReengagement) { results.skipped++; continue }

    const inProgress = child.lessonProgress[0]
    if (!inProgress) { results.skipped++; continue }

    const lastActive = inProgress.updatedAt
    const daysSince = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince < REENGAGEMENT_DAYS) { results.skipped++; continue }

    const profile = child.profile as unknown as Record<string, string>
    const childName = profile.name ?? 'your child'

    const result = await sendReengagementEmail({
      to: email,
      childName,
      weekNumber: inProgress.weekNumber,
      daysSinceActive: daysSince,
    })

    if (result.success) {
      results.reengagements++
      logger.info('email.reengagement_sent', { childId: child.id, daysSince })
      // Record send to throttle future attempts
      await db.rateLimit.upsert({
        where: { key: throttleKey },
        create: { key: throttleKey, count: 1, windowStart: now },
        update: { count: { increment: 1 }, windowStart: now },
      })
    } else {
      results.errors++
    }

    await new Promise(r => setTimeout(r, 100))
  }

  logger.info(LogEvents.CRON_CLEANUP, {
    type: 'email_reminders',
    ...results,
  })

  return NextResponse.json({ ok: true, ...results })
}
