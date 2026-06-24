// scripts/seed-invites.ts
// Run with: npx ts-node scripts/seed-invites.ts
// Or: npx prisma db seed

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const INVITE_CODES = [
  { code: 'mccarty2025', note: 'McCarty family — pilot test' },
  { code: 'family001',   note: 'Pilot family 1' },
  { code: 'family002',   note: 'Pilot family 2' },
  { code: 'family003',   note: 'Pilot family 3' },
  { code: 'family004',   note: 'Pilot family 4' },
  { code: 'family005',   note: 'Pilot family 5' },
]

async function main() {
  console.log('Seeding invite codes...')
  for (const invite of INVITE_CODES) {
    const result = await db.inviteCode.upsert({
      where: { code: invite.code },
      create: invite,
      update: { note: invite.note },
    })
    console.log(`  ✓ ${result.code}`)
  }
  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
