// app/certificate/[childId]/page.tsx
// Printable completion certificate.
// Public-ish URL: /certificate/[childId]
// Ownership check: childId must belong to authenticated user (or be signed via token for sharing).
// For simplicity in the pilot: requires authentication, same family.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'

interface Props { params: { childId: string } }

export default async function CertificatePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  const child = await db.child.findFirst({
    where: { id: params.childId, userId: session.user.id },
    select: { name: true, familyName: true },
  })
  if (!child) notFound()

  const week13 = await db.lessonProgress.findUnique({
    where: { childId_weekNumber: { childId: params.childId, weekNumber: 13 } },
    select: { completed: true, completedAt: true },
  })
  if (!week13?.completed) notFound()

  const date = (week13.completedAt ?? new Date()).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <html lang="en">
      <head>
        <title>R Factor Certificate — {child.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #F4F6FA; }
        `}</style>
      </head>
      <body>
        {/* Print button */}
        <div className="no-print" style={{ textAlign: 'center', padding: '20px', background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
          <button
            onClick={() => window.print()}
            style={{ padding: '12px 24px', background: '#0F2645', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            🖨️ Print certificate
          </button>
        </div>

        {/* Certificate */}
        <div style={{
          maxWidth: 680, margin: '40px auto', padding: '60px 60px',
          background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          textAlign: 'center', border: '8px solid #0F2645',
          position: 'relative',
        }}>
          {/* Corner decorations */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => {
            const [v, h] = pos.split('-')
            return (
              <div key={pos} style={{
                position: 'absolute', [v]: 16, [h]: 16,
                width: 32, height: 32,
                border: '3px solid #FF5C35',
                borderRadius: v === 'top' ? (h === 'left' ? '8px 0 0 0' : '0 8px 0 0') : (h === 'left' ? '0 0 0 8px' : '0 0 8px 0'),
              }} />
            )
          })}

          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 20px' }}>
            R Factor Family Program
          </p>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 12px' }}>This certifies that</p>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#0F2645', margin: '0 0 8px', letterSpacing: -1 }}>
            {child.name} {child.familyName}
          </h1>
          <p style={{ fontSize: 16, color: '#374151', margin: '0 0 32px', lineHeight: 1.6 }}>
            has successfully completed all <strong>13 weeks</strong> of the<br />
            R Factor Family Behavioral Coaching Program
          </p>

          {/* All 13 weeks dots */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '0 0 32px' }}>
            {Array.from({ length: 13 }, (_, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: '#FF5C35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: 24 }}>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 4px' }}>Completed</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#0F2645', margin: 0 }}>{date}</p>
          </div>

          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '24px 0 0', fontStyle: 'italic' }}>
            "E + R = O · Character is built one response at a time."
          </p>
        </div>
      </body>
    </html>
  )
}
