'use client'
// app/complete/client.tsx
// Animated completion celebration.
// Phases: confetti burst → headline reveal → certificate → CTAs

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { C, R } from '@/components/tokens'
import { Button } from '@/components'

interface Props {
  childName: string
  familyName: string
  completedAt: string
  certificateUrl: string
}

// Confetti particle
interface Particle { id: number; x: number; y: number; color: string; size: number; delay: number; duration: number }

const COLORS = ['#FF5C35', '#0F2645', '#00875A', '#F59E0B', '#6C3FC5', '#C81E4A']

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
  }))
}

export function CompletionClient({ childName, familyName, completedAt, certificateUrl }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState(0)        // 0=confetti, 1=headline, 2=cert, 3=full
  const [particles] = useState(() => generateParticles(60))

  // Phase progression — timed reveals
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // Inject confetti keyframes once
  useEffect(() => {
    const id = 'rf-confetti-styles'
    if (document.getElementById(id)) return
    const s = document.createElement('style')
    s.id = id
    s.textContent = `
      @keyframes fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
      @keyframes fade-up { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      @keyframes scale-in { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
      @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(255,92,53,0)} 50%{box-shadow:0 0 0 12px rgba(255,92,53,0.1)} }
    `
    document.head.appendChild(s)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, #0F2645 0%, #1a3a60 50%, #0F2645 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', overflow: 'hidden', position: 'relative',
    }}>
      {/* Confetti */}
      {particles.map(p => (
        <div
          key={p.id}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `fall ${p.duration}s ${p.delay}s ease-in forwards`,
            opacity: 0,
          }}
        />
      ))}

      <div style={{ maxWidth: 460, width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Emoji + headline */}
        {phase >= 1 && (
          <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fade-up 0.5s ease' }}>
            <p style={{ fontSize: 64, margin: '0 0 12px', lineHeight: 1 }}>🎉</p>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: -1 }}>
              {childName} did it.
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              All 13 weeks. The full R Factor program.
            </p>
          </div>
        )}

        {/* Certificate card */}
        {phase >= 2 && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.15)',
            borderRadius: R.xl,
            padding: 32,
            textAlign: 'center',
            marginBottom: 24,
            animation: 'scale-in 0.4s ease',
            backdropFilter: 'blur(10px)',
          }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>
              Certificate of Completion
            </p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: -0.5 }}>
              {childName}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 20px', lineHeight: 1.5 }}>
              completed all 13 weeks of the<br />R Factor Family Program
            </p>

            {/* Progress dots — all filled */}
            <div aria-label="13 weeks completed" style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 20 }}>
              {Array.from({ length: 13 }, (_, i) => (
                <div key={i} aria-hidden="true" style={{ width: 18, height: 6, borderRadius: 999, background: C.orange }} />
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              {completedAt} · E + R = O
            </p>
          </div>
        )}

        {/* CTAs */}
        {phase >= 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fade-up 0.4s ease' }}>
            <Button
              variant="accent"
              size="lg"
              fullWidth
              onClick={() => window.open(certificateUrl, '_blank')}
            >
              Download certificate
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}
              onClick={() => router.push('/dashboard')}
            >
              Back to dashboard
            </Button>
          </div>
        )}

        {/* Quote */}
        {phase >= 3 && (
          <p style={{
            textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)',
            marginTop: 32, lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            "Character is built one response at a time."
          </p>
        )}
      </div>
    </div>
  )
}
