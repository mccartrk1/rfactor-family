// app/api/v1/billing/portal/route.ts
import { ok, err } from '@/lib/api'
import { withAuth } from '@/lib/api/middleware'
import { createBillingPortalSession } from '@/lib/stripe'
import { db } from '@/lib/db'

export const POST = withAuth(async (_req, session) => {
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true } as any,
  })

  const customerId = (user as any)?.stripeCustomerId
  if (!customerId) {
    return err('NOT_FOUND', 'No billing account found. Please subscribe first.')
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://rfactor-family.vercel.app'

  try {
    const url = await createBillingPortalSession(customerId, `${baseUrl}/billing`)
    return ok({ url })
  } catch (e) {
    return err('INTERNAL_ERROR', e instanceof Error ? e.message : 'Could not open billing portal')
  }
})
