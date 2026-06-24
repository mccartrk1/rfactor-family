// components/cards/index.tsx
'use client'
import { useState } from 'react'
import { LessonChunk } from '@/types'
import Image from 'next/image'

interface Props {
  vtype: string
  chunk: LessonChunk
  weekColor: string
}

export function VisualCard({ vtype, chunk, weekColor }: Props) {
  switch (vtype) {
    case 'ero-hero':
      return (
        <div style={{ marginBottom: 18 }}>
          <Image src="/images/ero-graphic.png" alt="E+R=O" width={500} height={280} style={{ width: '100%', borderRadius: 16 }} />
        </div>
      )

    case 'ero-example':
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ background: '#EAF0FB', borderRadius: 14, padding: '13px 16px', marginBottom: 8, border: '2px solid #0F2645' }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#0F2645', margin: '0 0 6px' }}>⚡ The Event</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F2645', margin: 0 }}>A sibling grabs something of yours. On purpose.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: '#FEF2F2', borderRadius: 12, padding: 12, border: '1.5px solid #FECACA' }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B91C1C', margin: '0 0 6px' }}>🤖 Default R</p>
              <p style={{ fontSize: 12, color: '#B91C1C', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>You shout and push back.</p>
              <div style={{ background: 'rgba(185,28,28,0.08)', borderRadius: 8, padding: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B91C1C', margin: '0 0 2px' }}>Outcome</p>
                <p style={{ fontSize: 11, color: '#B91C1C', margin: 0, lineHeight: 1.4 }}>Everyone is in trouble.</p>
              </div>
            </div>
            <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 12, border: '1.5px solid #86EFAC' }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#15803D', margin: '0 0 6px' }}>🐯 Discipline R</p>
              <p style={{ fontSize: 12, color: '#15803D', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>One breath. You say how you feel.</p>
              <div style={{ background: 'rgba(21,128,61,0.08)', borderRadius: 8, padding: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#15803D', margin: '0 0 2px' }}>Outcome</p>
                <p style={{ fontSize: 11, color: '#15803D', margin: 0, lineHeight: 1.4 }}>Things get resolved.</p>
              </div>
            </div>
          </div>
        </div>
      )

    case 'sqft-image':
      return (
        <div style={{ marginBottom: 18 }}>
          <Image src="/images/20-square-feet.png" alt="Your 20 Square Feet" width={500} height={500} style={{ width: '100%', borderRadius: 16, display: 'block' }} />
        </div>
      )

    case 'bcd-prohibition':
      return (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <Image src="/images/no-bcd-sign.png" alt="No BCD" width={200} height={200} style={{ display: 'block', margin: '0 auto 10px', objectFit: 'contain' }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', margin: '0 0 4px' }}>Blaming. Complaining. Defending.</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>None of these ever fix anything.</p>
        </div>
      )

    case 'bcd-tiles':
      return <BCDTilesCard />

    case 'bcd-to-resolution':
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ background: '#FEF2F2', borderRadius: '14px 0 0 14px', padding: '14px 12px', border: '1.5px solid #FECACA', borderRight: 'none' }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B91C1C', margin: '0 0 10px', textAlign: 'center' }}>🤖 BCD says...</p>
              {['"It\'s not my fault!"', '"This always happens!"', '"What can I do?"'].map(t => (
                <div key={t} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', marginBottom: 6, border: '1px solid #FECACA' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#B91C1C', fontStyle: 'italic' }}>{t}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#F0FDF4', borderRadius: '0 14px 14px 0', padding: '14px 12px', border: '1.5px solid #86EFAC' }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#15803D', margin: '0 0 10px', textAlign: 'center' }}>🐯 Resolution says...</p>
              {['"What can I do right now?"', '"How do I fix this?"', '"What is my R?"'].map(t => (
                <div key={t} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', marginBottom: 6, border: '1px solid #86EFAC' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#15803D', fontWeight: 700 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'character-bot':
    case 'character-tiger': {
      const isBot = vtype === 'character-bot'
      return (
        <div style={{ textAlign: 'center', background: isBot ? '#F3F4F6' : '#FFF3EE', borderRadius: 16, padding: '18px 16px', marginBottom: 18, border: `2px solid ${isBot ? '#E2E8F0' : '#FFDCC8'}` }}>
          <Image src={isBot ? '/images/default-bot-full.png' : '/images/tiger-full.png'} alt={isBot ? 'Default' : 'Discipline'} width={160} height={160} style={{ objectFit: 'contain', marginBottom: 4 }} />
          {chunk.title && <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: isBot ? '#6B7280' : '#FF5C35' }}>{chunk.title}</p>}
          {chunk.subtitle && <p style={{ margin: '0 0 10px', fontSize: 13, color: isBot ? '#4B5563' : '#C2410C', lineHeight: 1.5 }}>{chunk.subtitle}</p>}
          {chunk.traits && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {chunk.traits.map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: isBot ? '#E5E7EB' : '#FFDCC8', color: isBot ? '#6B7280' : '#FF5C35' }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )
    }

    case 'radio':
      return (
        <div style={{ marginBottom: 18, textAlign: 'center' }}>
          <Image src="/images/radio.png" alt="Default and Discipline Stations" width={400} height={300} style={{ width: '100%', borderRadius: 16, display: 'block', margin: '0 auto' }} />
          <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 700, color: '#0F2645', textAlign: 'center' }}>You always control the dial. 🎛️</p>
        </div>
      )

    case 'comparison':
      return (
        <div style={{ marginBottom: 18 }}>
          <Image src="/images/tiger-vs-robot.png" alt="Discipline vs Default" width={500} height={350} style={{ width: '100%', borderRadius: 16, display: 'block' }} />
        </div>
      )

    case 'tiger-pause-img':
      return (
        <div style={{ marginBottom: 18, textAlign: 'center' }}>
          <Image src="/images/tiger-pause.png" alt="Press Pause" width={220} height={220} style={{ objectFit: 'contain', display: 'block', margin: '0 auto' }} />
        </div>
      )

    case 'body-cues':
      return (
        <div style={{ background: '#FFF0F0', borderRadius: 16, padding: 16, marginBottom: 18, border: '1.5px solid #FECACA' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C81E4A', margin: '0 0 14px', textAlign: 'center' }}>Your body&apos;s Pause signal</p>
          {[['😤', 'Face gets hot'], ['💓', 'Chest gets tight'], ['🔊', 'Voice gets loud fast'], ['👊', 'Fists want to clench']].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{label}</p>
            </div>
          ))}
          <div style={{ background: '#C81E4A', borderRadius: 10, padding: '10px 14px', marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 700, textAlign: 'center' }}>Feel these → PAUSE ⏸️</p>
          </div>
        </div>
      )

    case 'three-pause':
      return (
        <div style={{ marginBottom: 18 }}>
          {[
            { type: 'Proactive', when: 'Before the E', desc: 'Look ahead. You know this is coming. Plan your R before it happens. The most underused pause — and the most powerful.', color: '#0077C2', bg: '#EFF6FF', border: '#BFDBFE', emoji: '🔭' },
            { type: 'Situational', when: 'Right in the E', desc: 'In the moment. Face gets hot. Take one breath. This is the hardest one — it takes the most built skill.', color: '#00875A', bg: '#F0FDF4', border: '#BBF7D0', emoji: '⏸️' },
            { type: 'Reflective', when: 'After the O', desc: 'Look back. What happened? What role did you play? What would you do differently? Learn and move forward.', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', emoji: '🪞' },
          ].map(({ type, when, desc, color, bg, border, emoji }) => (
            <div key={type} style={{ background: bg, borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: `1.5px solid ${border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color }}>{type} Pause</p>
                  <p style={{ margin: 0, fontSize: 11, color, opacity: 0.75 }}>{when}</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      )

    case 'mindset-cycle':
      return (
        <div style={{ marginBottom: 18 }}>
          <Image src="/images/mindset-cycle.png" alt="Mindset Cycle" width={400} height={400} style={{ width: '100%', maxWidth: 360, borderRadius: 16, display: 'block', margin: '0 auto' }} />
        </div>
      )

    case 'thought-card':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div style={{ background: '#F3F4F6', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🤖</div>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 8px' }}>Default Station</p>
            <p style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.5, fontStyle: 'italic', margin: 0 }}>&quot;I cannot do this.&quot; &quot;I always mess up.&quot; &quot;It is not fair.&quot;</p>
          </div>
          <div style={{ background: '#FFF3EE', borderRadius: 14, padding: '14px 12px', textAlign: 'center', border: '1.5px solid #FFDCC8' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🐯</div>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FF5C35', margin: '0 0 8px' }}>Discipline Station</p>
            <p style={{ fontSize: 11, color: '#C2410C', lineHeight: 1.5, fontStyle: 'italic', fontWeight: 600, margin: 0 }}>&quot;I can figure this out.&quot; &quot;One step at a time.&quot;</p>
          </div>
        </div>
      )

    case 'step-up-four':
      return (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1.5px solid #E2E8F0', marginBottom: 18 }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 14px', textAlign: 'center' }}>Four ways to Step Up</p>
          {[
            { num: '1', label: 'Win the Moment', desc: 'The next 5 minutes. That is it. Do not think about the whole day — just win this one moment.', color: '#00875A' },
            { num: '2', label: 'Win the Day', desc: 'Stack the moments. Win each one and the day takes care of itself.', color: '#0077C2' },
            { num: '3', label: 'Step Up to Predictable', desc: 'You know this is coming. Pre-plan your R before the E arrives.', color: '#7C3AED' },
            { num: '4', label: 'Step Up to Adversity', desc: 'Train your habits now so that when pressure hits, Discipline shows up automatically.', color: '#C94A0A' },
          ].map(({ num, label, desc, color }) => (
            <div key={num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{num}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )

    case 'adjust-three-ways':
      return (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1.5px solid #E2E8F0', marginBottom: 18 }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 14px', textAlign: 'center' }}>Three ways to Adjust & Adapt</p>
          {[
            { emoji: '🔄', label: 'Be Responsive', desc: 'Something changed and you did not ask for it. Adjust anyway.', color: '#00875A' },
            { emoji: '🔭', label: 'Be Proactive', desc: 'You see something coming before it hits. Move first.', color: '#0077C2' },
            { emoji: '✨', label: 'Be Transformative', desc: 'Try a completely different way — change what you believe is possible.', color: '#7C3AED' },
          ].map(({ emoji, label, desc, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{emoji}</div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )

    case 'change-conditions':
      return (
        <div style={{ background: '#F0FDF4', borderRadius: 16, padding: 16, marginBottom: 18, border: '1.5px solid #86EFAC' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#15803D', margin: '0 0 12px', textAlign: 'center' }}>To adjust, you need to be...</p>
          {[{ word: 'OPEN', q: 'Are you open to trying a different way?', emoji: '🚪' }, { word: 'AWARE', q: 'Do you see what is not working right now?', emoji: '👀' }, { word: 'WILLING', q: 'Are you willing to be uncomfortable for a minute?', emoji: '💪' }].map(({ word, q, emoji }) => (
            <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{emoji}</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#15803D' }}>{word}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{q}</p>
              </div>
            </div>
          ))}
        </div>
      )

    case 'plan-list':
      return (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1.5px solid #E2E8F0', marginBottom: 18 }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 12px', textAlign: 'center' }}>When Plan A does not work</p>
          {[{ label: 'Plan A', note: '(gone)', strike: true, bg: '#FEF2F2', tc: '#B91C1C' }, { label: 'Plan B', note: 'find the next move', strike: false, bg: '#F0FDF4', tc: '#15803D' }, { label: 'Plan C', note: 'find another way', strike: false, bg: '#EFF6FF', tc: '#1D4ED8' }, { label: 'Plan D', note: 'that works too', strike: false, bg: '#FFF7ED', tc: '#C2410C' }].map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: p.bg, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: p.tc, textDecoration: p.strike ? 'line-through' : 'none', minWidth: 55 }}>{p.label}</span>
              <span style={{ fontSize: 13, color: p.tc }}>{p.note}</span>
            </div>
          ))}
          <div style={{ background: '#0F2645', borderRadius: 10, padding: '10px 14px', marginTop: 4 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 700, textAlign: 'center' }}>Options always exist. Find the next one.</p>
          </div>
        </div>
      )

    case 'zoom-card':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div style={{ background: '#FEF2F2', borderRadius: 14, padding: '14px 12px', textAlign: 'center', border: '1.5px solid #FECACA' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🔬</div>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C81E4A', margin: '0 0 6px' }}>Zoomed in</p>
            <p style={{ fontSize: 12, color: '#B91C1C', lineHeight: 1.5, margin: 0 }}>One bad thing fills your whole view.</p>
          </div>
          <div style={{ background: '#F0FDF4', borderRadius: 14, padding: '14px 12px', textAlign: 'center', border: '1.5px solid #86EFAC' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🔭</div>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#00875A', margin: '0 0 6px' }}>Zoomed out</p>
            <p style={{ fontSize: 12, color: '#15803D', lineHeight: 1.5, margin: 0 }}>That thing is small. Lots of good stuff is still here.</p>
          </div>
        </div>
      )

    case 'ripple-card':
      return (
        <div style={{ marginBottom: 18, textAlign: 'center' }}>
          <Image src="/images/ripple.png" alt="Ripple Effect" width={400} height={400} style={{ width: '100%', borderRadius: 16, maxWidth: 400, display: 'block', margin: '0 auto 8px' }} />
          <p style={{ margin: 0, fontSize: 13, color: '#0F2645', fontWeight: 700 }}>Your R becomes an E for everyone around you.</p>
        </div>
      )

    case 'activity-prompt':
      return (
        <div style={{ background: '#EFF6FF', borderRadius: 16, padding: 20, marginBottom: 18, border: '2px solid #93C5FD', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🌊</div>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1D4ED8', margin: '0 0 8px' }}>Stop here — do this together</p>
          <p style={{ fontSize: 15, color: '#1E3A8A', fontWeight: 700, lineHeight: 1.6, margin: '0 0 8px' }}>Drop something into a bowl of water. Watch the ripples spread outward.</p>
          <p style={{ fontSize: 13, color: '#3B82F6', margin: 0, lineHeight: 1.6 }}>That is what one choice does from your 20 square feet — it keeps going.</p>
        </div>
      )

    case 'skill-bar':
      return (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1.5px solid #E2E8F0', marginBottom: 18 }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 14px', textAlign: 'center' }}>R Factor skills grow with practice</p>
          {[{ skill: 'Press Pause', pct: 80, color: '#0077C2' }, { skill: 'Get Your Mind Right', pct: 68, color: '#6C3FC5' }, { skill: 'Step Up', pct: 62, color: '#00875A' }, { skill: 'Adjust & Adapt', pct: 55, color: '#B45309' }].map(({ skill, pct, color }) => (
            <div key={skill} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827' }}>{skill}</p>
                <p style={{ margin: 0, fontSize: 10, color: '#6B7280' }}>growing ↑</p>
              </div>
              <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
              </div>
            </div>
          ))}
          <p style={{ margin: '10px 0 0', fontSize: 12, color: '#6B7280', textAlign: 'center', fontStyle: 'italic' }}>Practice makes permanent.</p>
        </div>
      )

    default:
      if (vtype.startsWith('instead-of')) {
        return <InsteadOfSayingCard pairs={chunk.pairs || []} />
      }
      return null
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function BCDTilesCard() {
  const [open, setOpen] = useState<string | null>(null)
  const tiles = [
    { letter: 'B', word: 'Blaming', icon: '👆', color: '#FEF2F2', border: '#FECACA', text: '#B91C1C', def: 'Pointing the finger at someone else. "He started it." "It is your fault."' },
    { letter: 'C', word: 'Complaining', icon: '😤', color: '#FFF7ED', border: '#FED7AA', text: '#C2410C', def: 'Saying what is wrong without trying to fix it. "This is so unfair." "I hate this."' },
    { letter: 'D', word: 'Defending', icon: '🛡️', color: '#FEFCE8', border: '#FDE68A', text: '#A16207', def: 'Making excuses instead of owning it. "I could not help it." "It was not my fault."' },
  ]
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {tiles.map(({ letter, word, icon, color, border, text, def }) => (
          <div key={letter} onClick={() => setOpen(open === letter ? null : letter)} style={{ cursor: 'pointer' }}>
            <div style={{ background: color, border: `1.5px solid ${border}`, borderRadius: open === letter ? '10px 10px 0 0' : 10, padding: '12px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 3 }}>{icon}</div>
              <p style={{ margin: '0 0 1px', fontSize: 24, fontWeight: 900, color: text }}>{letter}</p>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 800, color: text }}>{word}</p>
              <p style={{ margin: 0, fontSize: 9, color: text, opacity: 0.6 }}>{open === letter ? '▴ close' : '▾ tap'}</p>
            </div>
            {open === letter && (
              <div style={{ background: color, border: `1.5px solid ${border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 10 }}>
                <p style={{ margin: 0, fontSize: 12, color: text, lineHeight: 1.6 }}>{def}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function InsteadOfSayingCard({ pairs }: { pairs: Array<{ before: string; after: string }> }) {
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  if (!pairs.length) return null
  const pair = pairs[idx]
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7280', margin: 0 }}>Instead of saying...</p>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7280', margin: 0 }}>{idx + 1} / {pairs.length}</p>
      </div>
      <div style={{ background: '#FEF2F2', borderRadius: '14px 14px 0 0', padding: 16, border: '1.5px solid #FECACA', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 24 }}>😤</span><p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#B91C1C', margin: 0 }}>Default says...</p></div>
        <p style={{ fontSize: 17, fontWeight: 800, color: '#B91C1C', margin: 0, lineHeight: 1.4 }}>&quot;{pair.before}&quot;</p>
      </div>
      {revealed ? (
        <div style={{ background: '#F0FDF4', borderRadius: '0 0 14px 14px', padding: 16, border: '1.5px solid #86EFAC', borderTop: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 24 }}>🐯</span><p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#15803D', margin: 0 }}>Discipline says...</p></div>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#15803D', margin: 0, lineHeight: 1.4 }}>&quot;{pair.after}&quot;</p>
        </div>
      ) : (
        <div onClick={() => setRevealed(true)} style={{ background: '#F0FDF4', borderRadius: '0 0 14px 14px', padding: 16, border: '1.5px solid #86EFAC', borderTop: 'none', cursor: 'pointer', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#15803D', fontWeight: 700, margin: 0 }}>🐯 Tap to see what Discipline says →</p>
        </div>
      )}
      {revealed && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {idx > 0 && <button onClick={() => { setIdx(idx - 1); setRevealed(false) }} style={{ flex: 1, padding: 10, background: 'transparent', border: '1.5px solid #E2E8F0', borderRadius: 10, color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
          {idx < pairs.length - 1 && <button onClick={() => { setIdx(idx + 1); setRevealed(false) }} style={{ flex: 1, padding: 10, background: '#0F2645', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Next phrase →</button>}
        </div>
      )}
    </div>
  )
}
