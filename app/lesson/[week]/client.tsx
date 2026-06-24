'use client'
// app/lesson/[week]/client.tsx
//
// Pure renderer. This component has ONE job: render the current machine state.
// All navigation logic, side effects, progress saves, and scenario fetching
// live in useLessonMachine (hooks/) which drives the pure reducer in
// domain/services/LessonNavigator.ts.
//
// Adding a new lesson screen: add a case to the reducer + a render block here.
// Changing navigation logic: edit the reducer only. This file never changes.

import { useLessonMachine } from '@/hooks/useLessonMachine'
import { VisualCard } from '@/components/cards'
import { WEEKS } from '@/content/weeks'
import { isCheckCorrect, isSealAnswered, isSealCorrect } from '@/domain/services/LessonNavigator'
import {
  Button,
  Badge,
  ProgressDots,
  Collapsible,
  LoadingScreen,
  QuizGroup,
  ChoiceGroup,
} from '@/components'
import Image from 'next/image'
import type { Lesson, Week } from '@/types'

interface Props {
  weekNumber: number
  childId: string
  lesson: Lesson
  week: Week
  prevChallenge: [string, string, string] | null
}

export default function LessonClient({ weekNumber, childId, lesson, week, prevChallenge }: Props) {
  const m = useLessonMachine({ lesson, week, childId, weekNumber })
  const { state, weekColor: wc } = m

  // Derived seal values — computed once per render from pure helper functions
  const sealQ      = lesson.seal[state.sealIndex]
  const sealAns    = isSealAnswered(state)
  const sealRight  = sealQ ? isSealCorrect(state, sealQ.answer) : false

  // Derived check values
  const checkQ     = m.chunk?.check
  const checkAns   = state.checkAnswer !== null
  const checkRight = checkQ ? isCheckCorrect(state, checkQ.answer) : false

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA', display: 'flex', flexDirection: 'column' }}>

      {/* Week header — static, never changes during lesson */}
      <div style={{ background: wc, padding: '48px 22px 24px' }}>
        <button onClick={m.goBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 20, display: 'block', fontFamily: 'inherit' }}>← Back</button>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 3px' }}>Week {week.w}</p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 3px', letterSpacing: -0.5 }}>{week.title}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{week.emoji} {week.sub}</p>
      </div>

      <div style={{ flex: 1, padding: '22px 18px 48px', maxWidth: 500, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── INTRO ── */}
        {state.step === 'intro' && (
          <>
            {weekNumber > 1 && prevChallenge && (
              <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '13px 16px', marginBottom: 16, border: '1.5px solid #FDE68A' }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#92400E', margin: '0 0 6px' }}>💬 Before we start</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#78350F', margin: '0 0 10px' }}>Did you try last week&apos;s challenge?</p>
                {prevChallenge.map((item, i) => (
                  <p key={i} style={{ margin: '0 0 4px', fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>• {item}</p>
                ))}
                {state.challengeResponse === 'yes' && <p style={{ margin: '10px 0 0', fontSize: 12, fontWeight: 700, color: '#15803D' }}>✓ Great — keep building on it.</p>}
                {state.challengeResponse === 'not-yet' && <p style={{ margin: '10px 0 0', fontSize: 12, fontWeight: 600, color: '#92400E' }}>No problem — this week is another chance.</p>}
                {!state.challengeResponse && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => m.setChallengeResponse('yes')} style={{ flex: 1, padding: '10px 8px', background: '#00875A', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, we tried it 🙌</button>
                    <button onClick={() => m.setChallengeResponse('not-yet')} style={{ flex: 1, padding: '10px 8px', background: 'transparent', border: '1.5px solid #FDE68A', borderRadius: 10, color: '#92400E', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Not yet</button>
                  </div>
                )}
              </div>
            )}

            {lesson.note && (
              <div style={{ background: '#FFFBEB', borderRadius: 12, marginBottom: 16, border: '1.5px solid #FDE68A', overflow: 'hidden' }}>
                <div onClick={m.toggleParentNote} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>👨‍👩‍👦</span>
                    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#92400E', margin: 0 }}>Parent tip — tap to {state.parentNoteOpen ? 'close' : 'read'}</p>
                  </div>
                  <span style={{ fontSize: 16, color: '#92400E', transform: state.parentNoteOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                </div>
                {state.parentNoteOpen && <div style={{ padding: '0 16px 14px' }}><p style={{ margin: 0, fontSize: 13, color: '#78350F', lineHeight: 1.55 }}>{lesson.note}</p></div>}
              </div>
            )}

            {lesson.recap && (
              <div style={{ background: '#EAF0FB', borderRadius: 12, padding: '13px 16px', marginBottom: 16, border: '1.5px solid #E2E8F0' }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 6px' }}>Last week</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F2645', margin: '0 0 8px' }}>{lesson.recap.emoji} {lesson.recap.title}</p>
                {lesson.recap.points.map((pt, i) => <p key={i} style={{ margin: '0 0 3px', fontSize: 12, color: '#6B7280' }}>• {pt}</p>)}
              </div>
            )}

            <div style={{ display: 'inline-block', background: wc, borderRadius: 999, padding: '7px 16px', marginBottom: 18 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{lesson.keyLine}</span>
            </div>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: '#0F2645', margin: '0 0 12px', lineHeight: 1.35, letterSpacing: -0.3 }}>{lesson.headline}</h2>
            <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: '0 0 26px' }}>{lesson.body}</p>

            <button onClick={m.startLesson} style={{ width: '100%', padding: '16px 22px', background: wc, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
              Start lesson →
            </button>
            <button onClick={() => { m.completeWeek(); m.nextScreen() }} style={{ width: '100%', padding: '14px 22px', background: 'transparent', color: '#6B7280', border: '1.5px solid #E2E8F0', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Mark complete and move on
            </button>
          </>
        )}

        {/* ── TEACHING ── */}
        {state.step === 'teaching' && m.chunk && (
          <>
            <ProgressDots
              total={lesson.chunks.length}
              current={state.chunkIndex}
              color={wc}
              label="Teaching chunk"
              style={{ marginBottom: 20 }}
            />
            <VisualCard vtype={m.vtype} chunk={m.chunk} weekColor={wc} />
            <p style={{ fontSize: 16, color: '#111827', lineHeight: 1.85, margin: '0 0 22px' }}>{m.chunk.teach}</p>

            {checkQ ? (
              <>
                <QuizGroup
                  question={checkQ.q}
                  options={Array.from(checkQ.opts)}
                  questionColor={wc}
                  selectedIndex={state.checkAnswer}
                  correctIndex={checkQ.answer}
                  onSelect={m.tapCheck}
                />
                {checkAns && (
                  <Button variant="primary" size="lg" fullWidth onClick={m.advanceChunk}
                    style={{ background: wc, marginTop: 4 }}>
                    {m.isLastChunk ? 'Seal it in →' : 'Got it →'}
                  </Button>
                )}
              </>
            ) : (
              <Button variant="primary" size="lg" fullWidth onClick={m.advanceChunk}
                style={{ background: wc, marginTop: 4 }}>
                {m.isLastChunk ? 'Seal it in →' : 'Next →'}
              </Button>
            )}
          </>
        )}

        {/* ── SEAL ── */}
        {state.step === 'seal' && sealQ && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
              <ProgressDots
                total={lesson.seal.length}
                current={state.sealIndex}
                color="#F59E0B"
                label="Seal question"
                size="md"
              />
              <Badge variant="warning" size="sm">Seal it in</Badge>
            </div>
            <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '13px 18px', marginBottom: 20, border: '1.5px solid #FDE68A' }}>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#92400E', margin: '0 0 4px' }}>🔒 Question {state.sealIndex + 1} of {lesson.seal.length}</p>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#78350F', lineHeight: 1.4 }}>{sealQ.q}</p>
            </div>
            {!sealAns && sealQ.opts.map((opt, i) => (
              <div key={i}>
                {i > 0 && <div style={{ textAlign: 'center', margin: '-4px 0', color: '#6B7280', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>— or —</div>}
                <div onClick={() => m.tapSeal(i)} style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1.5px solid #E2E8F0', cursor: 'pointer', marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#111827', fontWeight: 600, lineHeight: 1.4 }}>{opt}</p>
                </div>
              </div>
            ))}
            {sealAns && (
              <>
                {sealQ.opts.map((opt, i) => {
                  const isC = i === sealQ.answer; const isBad = i === state.sealAnswer && !isC
                  return <div key={i} style={{ background: isC ? '#00875A' : isBad ? '#C81E4A' : '#fff', borderRadius: 16, padding: '14px 16px', border: `2px solid ${isC ? '#00875A' : isBad ? '#C81E4A' : '#E2E8F0'}`, marginBottom: 10 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: (isC || isBad) ? '#fff' : '#6B7280' }}>{isC ? '✓ ' : isBad ? '✗ ' : ''}{opt}</p></div>
                })}
                <p style={{ fontSize: 12, margin: '2px 0 12px', fontWeight: 700, color: sealRight ? '#00875A' : '#6B7280', fontStyle: sealRight ? 'normal' : 'italic' }}>
                  {sealRight ? 'Locked in. ✓' : 'Not quite — the right answer is in green.'}
                </p>
                <button onClick={m.isLastSeal ? () => m.generateScenario(0) : m.advanceSeal} style={{ width: '100%', padding: '15px 22px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {m.isLastSeal ? 'See your scenario →' : 'Next question →'}
                </button>
              </>
            )}
          </>
        )}

        {/* ── LOADING ── */}
        {state.step === 'loading' && (
          <LoadingScreen
            emoji={week.emoji}
            weekColor={wc}
            heading="Building your scenario..."
            subtext="Pulling from real life..."
          />
        )}

        {/* ── SCENARIO ── */}
        {state.step === 'scenario' && m.scenario && (
          <>
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1.5px solid #E2E8F0', marginBottom: 14 }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                {m.iconData.img ? (
                  <Image src={m.iconData.img} alt="" width={80} height={80} style={{ objectFit: 'contain', margin: '0 auto 6px', display: 'block' }} />
                ) : (
                  <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 6 }}>{m.iconData.emoji}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7280', margin: 0 }}>Your situation</p>
                  {!state.apiError && <Badge variant="personalized">personalized</Badge>}
                </div>
              </div>
              <p style={{ fontSize: 15, color: '#111827', margin: '0 0 12px', lineHeight: 1.8 }}>{m.scenario.setup}</p>
              <div style={{ background: '#EAF0FB', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 14, color: '#1E3A5F', margin: 0, fontWeight: 700, lineHeight: 1.55 }}>{m.scenario.event}</p>
              </div>
            </div>

            {state.apiError && (
              <div style={{ background: '#FFF7ED', borderRadius: 10, padding: '10px 14px', marginBottom: 12, border: '1.5px solid #FED7AA' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#92400E', lineHeight: 1.5 }}><strong>Note:</strong> {state.apiError}</p>
              </div>
            )}

            {m.scenario.question && (
              <div style={{ background: wc, borderRadius: 12, padding: '13px 18px', marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 700, lineHeight: 1.55 }}>💬 {m.scenario.question}</p>
              </div>
            )}

            <ChoiceGroup
              disciplineChoice={m.scenario.disciplinePath.choice}
              disciplineResult={m.scenario.disciplinePath.result}
              defaultChoice={m.scenario.defaultPath.choice}
              defaultResult={m.scenario.defaultPath.result}
              selected={state.choice}
              onSelect={m.pickPath}
            />

            <button onClick={m.proceedToChallenge} style={{ width: '100%', padding: '15px 22px', background: '#0F2645', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
              See this week&apos;s challenge →
            </button>
            {state.scenarioCount < 3 && (
              <button onClick={m.tryAnother} style={{ width: '100%', padding: '12px 22px', background: 'transparent', color: '#6B7280', border: '1.5px solid #E2E8F0', borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ↺ Try a different scenario ({state.scenarioCount}/3)
              </button>
            )}
          </>
        )}

        {/* ── CHALLENGE ── */}
        {state.step === 'challenge' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>{week.emoji}</div>
              <h2 style={{ fontSize: 21, fontWeight: 900, color: '#0F2645', margin: '0 0 4px', letterSpacing: -0.3 }}>This Week&apos;s Challenge</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Three things to practice</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1.5px solid #E2E8F0', marginBottom: 24 }}>
              {lesson.challenge.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < 2 ? 16 : 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: wc, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{i + 1}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#111827', lineHeight: 1.65, fontWeight: 500 }}>{item}</p>
                </div>
              ))}
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={m.completeWeek} style={{ background: wc }}>
              Complete Week {weekNumber} ✓
            </Button>
          </>
        )}

        {/* ── PLEDGE ── */}
        {state.step === 'pledge' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>🏆</div>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FF5C35', margin: '0 0 16px' }}>Week {weekNumber} complete</p>
            <div style={{ background: '#0F2645', borderRadius: 20, padding: '28px 24px', marginBottom: 28 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', letterSpacing: 1.5, fontWeight: 700 }}>THE PLEDGE</p>
              <p style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1.85, margin: 0 }}>
                I control my Response.<br />I own my 20 square feet.<br />I choose Discipline.<br /><span style={{ color: '#FF5C35' }}>And I&apos;ve got this.</span>
              </p>
            </div>
            <button onClick={m.nextScreen} style={{ width: '100%', padding: '16px 22px', background: '#FF5C35', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {weekNumber === 13 ? 'See your certificate →' : 'Back to program →'}
            </button>
          </div>
        )}

        {/* ── COMPLETE (Certificate) ── */}
        {state.step === 'complete' && (
          <div style={{ textAlign: 'center', padding: '12px 0 40px' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FF5C35', margin: '0 0 4px' }}>13 weeks complete</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F2645', margin: '0 0 4px', letterSpacing: -1 }}>R Factor Family</h1>
            <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 28px' }}>All the way through.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
              {WEEKS.map(w => <div key={w.w} style={{ width: 44, height: 44, borderRadius: 12, background: w.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{w.emoji}</div>)}
            </div>
            <div style={{ background: '#0F2645', borderRadius: 20, padding: '28px 24px', marginBottom: 28 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', letterSpacing: 1.5, fontWeight: 700 }}>THE PLEDGE</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.85, margin: 0 }}>
                I control my Response.<br />I own my 20 square feet.<br />I choose Discipline.<br /><span style={{ color: '#FF5C35' }}>And I&apos;ve got this.</span>
              </p>
            </div>
            <button onClick={m.nextScreen} style={{ width: '100%', padding: '16px 22px', background: '#FF5C35', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Back to dashboard →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
