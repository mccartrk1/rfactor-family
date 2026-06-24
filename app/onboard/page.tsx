'use client'
// app/onboard/page.tsx
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// useSession removed — session data not needed in this component

const QUESTIONS = [
  { id: 'name',          label: "What's your child's first name?",                   placeholder: 'First name',            optional: false },
  { id: 'familyName',    label: "What's your family's last name?",                   placeholder: 'e.g. McCarty',          optional: false },
  { id: 'age',           label: (a: any) => `How old is ${a.name || 'your child'}?`, placeholder: 'Age (e.g. 6)',          optional: false },
  { id: 'grade',         label: (a: any) => `What grade is ${a.name || 'they'} in?`, placeholder: 'e.g. 1st grade',       optional: false },
  { id: 'school',        label: (a: any) => `What school does ${a.name || 'they'} go to?`, placeholder: 'School name',    optional: true  },
  { id: 'bestFriend',    label: (a: any) => `Who is ${a.name || "your child"}'s best friend?`, placeholder: 'Best friend', optional: true },
  { id: 'friends',       label: 'Who else do they hang out with? (Up to 3)',          placeholder: 'e.g. Vinny, Caden',    optional: true  },
  { id: 'game',          label: (a: any) => `What is ${a.name || "their"}'s favorite game or show?`, placeholder: 'e.g. Mario, Bluey', optional: true },
  { id: 'athlete',       label: (a: any) => `Who does ${a.name || 'they'} look up to most?`, placeholder: 'e.g. Michael Jordan', optional: true },
  { id: 'grandparent',   label: (a: any) => `What does ${a.name || 'they'} call their grandparent?`, placeholder: 'e.g. Gaga, Nana, Pappy', optional: true },
  { id: 'trustedAdults', label: 'Who are the trusted adults in their life besides parents?', placeholder: 'e.g. Aunt Janet, Coach Mike', optional: true },
  { id: 'siblings',      label: 'Any brothers or sisters?',                           placeholder: 'e.g. Nick, Michael',   optional: true  },
  { id: 'hateFood',      label: (a: any) => `What food does ${a.name || 'they'} absolutely hate?`, placeholder: 'e.g. broccoli', optional: true },
  { id: 'flashPoint',    label: (a: any) => `What is ${a.name || "their"}'s biggest trigger at home?`, placeholder: 'e.g. screen time, bedtime', optional: true },
]

function OnboardPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // isAdding removed — add-child vs first-child behavior is handled server-side

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [inputVal, setInputVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const q = QUESTIONS[step]
  const label = typeof q.label === 'function' ? q.label(answers) : q.label
  const progress = Math.round(((step) / QUESTIONS.length) * 100)
  const canNext = inputVal.trim().length > 0 || q.optional

  // BUG 3 FIX: Accept the value to save explicitly instead of reading inputVal
  // from state. The Skip button called setInputVal('') then next() in the same
  // handler. Since React batches state updates, next() read the stale inputVal
  // (whatever was typed) before the empty-string update committed.
  async function advance(valueToSave: string) {
    const newAnswers = { ...answers, [q.id]: valueToSave }
    setAnswers(newAnswers)

    if (step < QUESTIONS.length - 1) {
      setInputVal(newAnswers[QUESTIONS[step + 1].id] || '')
      setStep(step + 1)
    } else {
      setSaving(true)
      const inviteCode = sessionStorage.getItem('rf_invite') || ''
      try {
        const res = await fetch('/api/children', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newAnswers, inviteCode }),
        })
        const data = await res.json()
        // BUG 4 FIX: Surface API errors instead of silently doing nothing.
        if (!res.ok || !data.child) {
          setError(data.error || 'Something went wrong. Try again.')
          setSaving(false)
          return
        }
        localStorage.setItem('rf_active_child', data.child.id)
        router.push('/dashboard')
      } catch {
        setError('Network error. Check your connection and try again.')
        setSaving(false)
      }
    }
  }

  function next() { if (canNext) advance(inputVal.trim()) }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: '#E2E8F0' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#FF5C35', transition: 'width 0.3s' }} />
      </div>

      <div style={{ flex: 1, padding: '36px 24px 32px', maxWidth: 460, margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FF5C35', margin: '0 0 28px' }}>
          {step + 1} / {QUESTIONS.length}
        </p>
        {error && (
          <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, border: '1.5px solid #FECACA' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>{error}</p>
          </div>
        )}

        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F2645', margin: '0 0 28px', lineHeight: 1.35, letterSpacing: -0.4 }}>{label}</h2>

        <textarea
          autoFocus
          value={inputVal}
          rows={2}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canNext) next() } }}
          placeholder={q.placeholder}
          style={{ flex: 1, padding: '16px 18px', fontSize: 17, fontFamily: 'inherit', border: `2px solid ${inputVal.trim() ? '#0F2645' : '#E2E8F0'}`, borderRadius: 14, background: '#fff', color: '#111827', outline: 'none', resize: 'none', lineHeight: 1.6, maxHeight: 120 }}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            onClick={next}
            disabled={!canNext || saving}
            style={{ flex: 1, padding: '16px 22px', background: canNext ? '#0F2645' : '#E2E8F0', color: canNext ? '#fff' : '#6B7280', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed', fontFamily: 'inherit', marginBottom: 0 }}
          >
            {saving ? 'Saving...' : step === QUESTIONS.length - 1 ? 'Build my program →' : 'Next →'}
          </button>
          {q.optional && (
            <button
              onClick={() => advance('')}
              style={{ padding: '14px 18px', background: 'transparent', color: '#6B7280', border: '1.5px solid #E2E8F0', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Skip
            </button>
          )}
        </div>

        {step > 0 && (
          <button
            onClick={() => { setStep(step - 1); setInputVal(answers[QUESTIONS[step - 1].id] || '') }}
            style={{ marginTop: 14, background: 'none', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}

// useSearchParams requires a Suspense boundary in Next.js 14.
export default function OnboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F4F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48 }}>🎯</div>
      </div>
    }>
      <OnboardPageInner />
    </Suspense>
  )
}
