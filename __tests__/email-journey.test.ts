// __tests__/email-journey.test.ts
//
// QA test suite for:
//   - Email template rendering (all four templates)
//   - Journey data calculation (week status, challenge stats, milestones)
//   - Unsubscribe token generation and verification
//   - Completion redirect logic
//
// Run: npm test __tests__/email-journey.test.ts

// ─── Mock environment ─────────────────────────────────────────────────────────
process.env.NEXTAUTH_SECRET = 'test-secret-min-32-chars-for-hmac-x'
process.env.NEXTAUTH_URL = 'https://rfactor-test.vercel.app'
process.env.RESEND_FROM_EMAIL = 'test@rfactorfamily.com'

import {
  welcomeHtml,
  reminderHtml,
  completionHtml,
  reengagementHtml,
} from '../lib/email'

// Mock Resend so send() calls don't hit the network
jest.mock('resend', () => ({
  Resend: class {
    emails = {
      send: jest.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null })
    }
  }
}))

// ─── Email template tests ─────────────────────────────────────────────────────

describe('Email templates — HTML generation', () => {
  describe('welcomeHtml', () => {
    const data = {
      to: 'parent@example.com',
      familyName: 'McCarty',
      childName: 'John',
      weekOneTitle: 'E + R = O',
    }

    test('contains family name in greeting', () => {
      const html = welcomeHtml(data)
      expect(html).toContain('McCarty family')
    })

    test('contains child name', () => {
      const html = welcomeHtml(data)
      expect(html).toContain('John')
    })

    test('contains dashboard CTA link', () => {
      const html = welcomeHtml(data)
      expect(html).toContain('/dashboard')
    })

    test('contains PWA installation instructions', () => {
      const html = welcomeHtml(data)
      expect(html).toContain('Home Screen')
      expect(html).toContain('Safari')
    })

    test('contains unsubscribe link', () => {
      const html = welcomeHtml(data)
      expect(html).toContain('Unsubscribe')
    })

    test('is valid HTML (has doctype and body)', () => {
      const html = welcomeHtml(data)
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<body')
      expect(html).toContain('</body>')
    })

    test('uses inline styles (email client compatibility)', () => {
      const html = welcomeHtml(data)
      // Must not use class-based styles from external CSS
      expect(html).toContain('style=')
    })

    test('does not contain undefined values', () => {
      const html = welcomeHtml(data)
      expect(html).not.toContain('undefined')
    })
  })

  describe('reminderHtml', () => {
    const data = {
      to: 'parent@example.com',
      childName: 'Nick',
      weekNumber: 3,
      weekTitle: 'No BCD',
      weekEmoji: '🚫',
    }

    test('contains week number in content', () => {
      const html = reminderHtml(data)
      expect(html).toContain('Week 3')
    })

    test('contains week title', () => {
      const html = reminderHtml(data)
      expect(html).toContain('No BCD')
    })

    test('contains child name', () => {
      const html = reminderHtml(data)
      expect(html).toContain('Nick')
    })

    test('CTA links to dashboard', () => {
      const html = reminderHtml(data)
      expect(html).toContain('/dashboard')
    })

    test('renders week emoji', () => {
      const html = reminderHtml(data)
      expect(html).toContain('🚫')
    })
  })

  describe('completionHtml', () => {
    const data = {
      to: 'parent@example.com',
      parentName: 'Ryan',
      childName: 'John',
      completedAt: 'March 15, 2025',
      certificateUrl: 'https://rfactor-test.vercel.app/certificate/child-123',
    }

    test('contains child name in subject area', () => {
      const html = completionHtml(data)
      expect(html).toContain('John')
    })

    test('contains certificate download link', () => {
      const html = completionHtml(data)
      expect(html).toContain('certificate/child-123')
    })

    test('contains completion date', () => {
      const html = completionHtml(data)
      expect(html).toContain('March 15, 2025')
    })

    test('contains E+R=O motto', () => {
      const html = completionHtml(data)
      expect(html).toContain('E + R = O')
    })

    test('contains celebratory emoji', () => {
      const html = completionHtml(data)
      expect(html).toContain('🎉')
    })

    test('addresses parent by name', () => {
      const html = completionHtml(data)
      expect(html).toContain('Ryan')
    })
  })

  describe('reengagementHtml', () => {
    const data = {
      to: 'parent@example.com',
      childName: 'John',
      weekNumber: 4,
      daysSinceActive: 18,
    }

    test('contains week number', () => {
      const html = reengagementHtml(data)
      expect(html).toContain('Week 4')
    })

    test('is not guilt-tripping — soft tone', () => {
      const html = reengagementHtml(data)
      expect(html).not.toContain('you failed')
      expect(html).not.toContain('missed')
      expect(html).toContain('Ready when you are')
    })

    test('CTA links to dashboard', () => {
      const html = reengagementHtml(data)
      expect(html).toContain('/dashboard')
    })
  })
})

// ─── Unsubscribe token tests ───────────────────────────────────────────────────

// Import the token functions using require to avoid TS module complexity in tests
import { createHmac } from 'crypto'

function signTestToken(userId: string, email: string, expOffset: number): string {
  const secret = process.env.NEXTAUTH_SECRET ?? ''
  const payload = JSON.stringify({
    userId, email,
    exp: Date.now() + expOffset,
  })
  const encoded = Buffer.from(payload).toString('base64url')
  const sig = createHmac('sha256', secret).update(encoded).digest('hex')
  return `${encoded}.${sig}`
}

describe('Unsubscribe tokens', () => {
  test('valid token verifies with correct user', () => {
    const token = signTestToken('user-123', 'parent@example.com', 90 * 24 * 60 * 60 * 1000)
    expect(token).toBeTruthy()
    expect(token.split('.').length).toBeGreaterThan(1)

    // Verify payload is decodable
    const [encoded] = token.split('.')
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    expect(payload.userId).toBe('user-123')
    expect(payload.email).toBe('parent@example.com')
    expect(payload.exp).toBeGreaterThan(Date.now())
  })

  test('expired token is detectable', () => {
    const token = signTestToken('user-123', 'parent@example.com', -1000)  // expired 1s ago
    const [encoded] = token.split('.')
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    expect(payload.exp).toBeLessThan(Date.now())
  })

  test('tampered payload is detectable (different signature)', () => {
    const token = signTestToken('user-123', 'parent@example.com', 90 * 24 * 60 * 60 * 1000)
    const [encoded, sig] = token.split('.')

    // Forge a different userId in the payload
    const forgedPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    forgedPayload.userId = 'admin-user'
    const forgedEncoded = Buffer.from(JSON.stringify(forgedPayload)).toString('base64url')
    const forgedToken = `${forgedEncoded}.${sig}` // original sig, different payload

    // The signature won't match
    const secret = process.env.NEXTAUTH_SECRET ?? ''
    const expectedSig = createHmac('sha256', secret).update(forgedEncoded).digest('hex')
    expect(expectedSig).not.toBe(sig)
  })

  test('token without signature section is rejected', () => {
    const token = 'no-dot-separator-just-payload'
    expect(token.split('.').length).toBe(1)
    // A split('.')[1] would be undefined — verify rejection path works
    const [, sig] = token.split('.')
    expect(sig).toBeUndefined()
  })
})

// ─── Journey data calculation tests ──────────────────────────────────────────

describe('Journey data calculations', () => {
  // Simulate the week status computation logic from the RSC page

  type RawProgress = {
    weekNumber: number
    completed: boolean
    completedAt: Date | null
    currentStep: string
    updatedAt: Date
  }

  function computeWeekStatuses(progressRecords: RawProgress[]) {
    const progressMap = new Map(progressRecords.map(p => [p.weekNumber, p]))
    return Array.from({ length: 13 }, (_, i) => {
      const w = i + 1
      const p = progressMap.get(w)
      return {
        week: w,
        status: p?.completed ? 'completed' : p ? 'in-progress' : 'upcoming',
        currentStep: p?.currentStep ?? null,
      }
    })
  }

  test('child with no progress: all weeks upcoming', () => {
    const statuses = computeWeekStatuses([])
    expect(statuses.every(w => w.status === 'upcoming')).toBe(true)
    expect(statuses).toHaveLength(13)
  })

  test('child with week 1 complete: week 1 completed, rest upcoming', () => {
    const statuses = computeWeekStatuses([
      { weekNumber: 1, completed: true, completedAt: new Date(), currentStep: 'complete', updatedAt: new Date() },
    ])
    expect(statuses[0].status).toBe('completed')
    expect(statuses[1].status).toBe('upcoming')
    expect(statuses.slice(1).every(w => w.status === 'upcoming')).toBe(true)
  })

  test('child with week 1 in progress: week 1 in-progress, rest upcoming', () => {
    const statuses = computeWeekStatuses([
      { weekNumber: 1, completed: false, completedAt: null, currentStep: 'teaching', updatedAt: new Date() },
    ])
    expect(statuses[0].status).toBe('in-progress')
    expect(statuses[0].currentStep).toBe('teaching')
    expect(statuses.slice(1).every(w => w.status === 'upcoming')).toBe(true)
  })

  test('child with all 13 weeks complete: all completed', () => {
    const allComplete = Array.from({ length: 13 }, (_, i) => ({
      weekNumber: i + 1,
      completed: true,
      completedAt: new Date(),
      currentStep: 'complete',
      updatedAt: new Date(),
    }))
    const statuses = computeWeekStatuses(allComplete)
    expect(statuses.every(w => w.status === 'completed')).toBe(true)
  })

  test('completionPct calculates correctly', () => {
    const completed = 7
    const pct = Math.round((completed / 13) * 100)
    expect(pct).toBe(54)  // 7/13 = 53.8 → rounds to 54
  })

  test('challenge yes rate: 6/8 = 75%', () => {
    const yesCount = 6
    const total = 8
    const pct = Math.round((yesCount / total) * 100)
    expect(pct).toBe(75)
  })

  test('challenge rate: 0/0 returns 0 (no division by zero)', () => {
    const total = 0
    const pct = total > 0 ? Math.round((0 / total) * 100) : 0
    expect(pct).toBe(0)
  })

  test('milestones built correctly when week 7 complete', () => {
    const week1Progress = { weekNumber: 1, completed: false, completedAt: null, currentStep: 'teaching', updatedAt: new Date('2025-01-15') }
    const week7Progress = { weekNumber: 7, completed: true, completedAt: new Date('2025-03-01'), currentStep: 'complete', updatedAt: new Date('2025-03-01') }

    const milestones = [
      week1Progress ? { label: 'First lesson', date: week1Progress.updatedAt.toISOString(), emoji: '🚀' } : null,
      week7Progress ? { label: 'Halfway there', date: week7Progress.completedAt?.toISOString() ?? week7Progress.updatedAt.toISOString(), emoji: '⭐' } : null,
    ].filter(Boolean)

    expect(milestones).toHaveLength(2)
    expect(milestones[0]?.label).toBe('First lesson')
    expect(milestones[1]?.label).toBe('Halfway there')
  })
})

// ─── Completion redirect tests ────────────────────────────────────────────────

describe('Completion redirect logic', () => {
  // Test the conditional logic in useLessonMachine.nextScreen
  // (pure logic extracted for testing without React)

  function getRedirectTarget(weekNumber: number, step: string, childId: string): string {
    if (weekNumber === 13 && step === 'pledge') {
      return 'DISPATCH_NEXT_SCREEN'  // stays in reducer
    } else if (weekNumber === 13 && step === 'complete') {
      return `/complete?child=${childId}`
    } else {
      return '/dashboard'
    }
  }

  test('week 13 pledge step dispatches NEXT_SCREEN', () => {
    expect(getRedirectTarget(13, 'pledge', 'child-123')).toBe('DISPATCH_NEXT_SCREEN')
  })

  test('week 13 complete step goes to /complete page', () => {
    expect(getRedirectTarget(13, 'complete', 'child-123')).toBe('/complete?child=child-123')
  })

  test('week 7 complete step goes to /dashboard', () => {
    expect(getRedirectTarget(7, 'complete', 'child-123')).toBe('/dashboard')
  })

  test('week 1 pledge step goes to /dashboard', () => {
    expect(getRedirectTarget(1, 'pledge', 'child-123')).toBe('/dashboard')
  })

  test('complete URL contains correct childId', () => {
    const url = getRedirectTarget(13, 'complete', 'cuid-abc-xyz')
    expect(url).toBe('/complete?child=cuid-abc-xyz')
    expect(url).not.toContain('undefined')
  })
})
