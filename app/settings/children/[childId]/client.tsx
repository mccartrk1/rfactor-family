'use client'
// app/settings/children/[childId]/client.tsx
//
// Profile edit form for a single child.
// Groups the 22 profile fields into three logical sections.
// Tracks unsaved changes and warns before navigation.
//
// Key behaviors:
//   - Form is pre-populated with current values (from RSC props)
//   - Dirty tracking: only fields that changed are submitted
//   - Unsaved changes: warn user on back/navigate
//   - Saving: form disabled + spinner, then Toast on success/error
//   - After save: local state updated (no refetch needed)

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Button, Input } from '@/components'
import { C, R, SP } from '@/components/tokens'
import { isAdultTrack } from '@/lib/tracks'

// Profile shape (matches Prisma Child select)
interface ChildProfile {
  id: string
  name: string
  familyName: string
  age: string
  grade: string
  school: string
  mascot: string
  teacher: string
  bestFriend: string
  friends: string
  activity: string
  game: string
  loveFood: string
  hateFood: string
  athlete: string
  team: string
  grandparent: string
  trustedAdults: string
  babysitter: string
  hardThing: string
  flashPoint: string
  siblings: string
  track: string
}

interface Props { child: ChildProfile }

type FieldDef = {
  id: keyof ChildProfile
  label: string
  placeholder: string
  hint?: string
}

// Field definitions grouped by section
const SECTIONS: Array<{ title: string; emoji: string; fields: FieldDef[] }> = [
  {
    title: 'About',
    emoji: '👦',
    fields: [
      { id: 'name',       label: 'First name',  placeholder: 'e.g. John' },
      { id: 'familyName', label: 'Last name',   placeholder: 'e.g. McCarty' },
      { id: 'age',        label: 'Age',         placeholder: 'e.g. 6', hint: 'Used to calibrate language and scenario complexity' },
      { id: 'grade',      label: 'Grade',       placeholder: 'e.g. 1st grade' },
      { id: 'school',     label: 'School',      placeholder: 'e.g. St. Jude School' },
      { id: 'mascot',     label: 'School mascot', placeholder: 'e.g. Eagles' },
      { id: 'teacher',    label: 'Teacher',     placeholder: 'e.g. Mrs. Smith' },
    ],
  },
  {
    title: 'Their world',
    emoji: '🌟',
    fields: [
      { id: 'bestFriend',   label: 'Best friend',         placeholder: 'e.g. Vinny', hint: 'Appears by name in scenarios' },
      { id: 'friends',      label: 'Other friends',       placeholder: 'e.g. Caden, Liam' },
      { id: 'game',         label: 'Favorite game or show', placeholder: 'e.g. Mario, Bluey' },
      { id: 'activity',     label: 'Favorite activity',   placeholder: 'e.g. soccer, swimming' },
      { id: 'athlete',      label: 'Who they look up to', placeholder: 'e.g. LeBron James' },
      { id: 'team',         label: 'Favorite team',       placeholder: 'e.g. Bengals' },
      { id: 'loveFood',     label: 'Favorite food',       placeholder: 'e.g. pizza' },
      { id: 'hateFood',     label: 'Food they hate',      placeholder: 'e.g. broccoli', hint: 'Used for mealtime scenarios' },
    ],
  },
  {
    title: 'Family',
    emoji: '🏠',
    fields: [
      { id: 'siblings',      label: 'Brothers and sisters', placeholder: 'e.g. Nick, Michael', hint: 'Sibling names appear in scenarios by name' },
      { id: 'grandparent',   label: 'What they call grandparents', placeholder: 'e.g. Gaga, Pappy' },
      { id: 'trustedAdults', label: 'Trusted adults',  placeholder: 'e.g. Aunt Janet, Coach Mike' },
      { id: 'babysitter',    label: 'Babysitter',       placeholder: 'e.g. Miss Sarah' },
      { id: 'hardThing',     label: 'Something hard for them', placeholder: 'e.g. making new friends', hint: 'Helps calibrate scenario difficulty' },
      { id: 'flashPoint',    label: 'Biggest home trigger',   placeholder: 'e.g. screen time, bedtime', hint: 'Used to make scenarios feel real and specific' },
    ],
  },
]

// Field definitions for the ADULT (parent) program. Grade, school, mascot,
// favorites and the rest of the kid fields do not apply to a grown-up learner,
// so the parent form asks about their kids and what sets them off instead.
const ADULT_SECTIONS: Array<{ title: string; emoji: string; fields: FieldDef[] }> = [
  {
    title: 'About you',
    emoji: '🧑',
    fields: [
      { id: 'name',       label: 'First name', placeholder: 'e.g. Kristen' },
      { id: 'familyName', label: 'Last name',  placeholder: 'e.g. McCarty' },
    ],
  },
  {
    title: 'Your family',
    emoji: '🏠',
    fields: [
      { id: 'siblings',   label: 'Your kids’ names and ages', placeholder: 'e.g. John (6), Nick (4), Michael (1)', hint: 'Your kids appear by name in your scenarios' },
      { id: 'babysitter', label: 'Babysitter or other caregivers', placeholder: 'e.g. Miss Sarah, Grandma', hint: 'Optional — used when a scenario involves childcare' },
    ],
  },
  {
    title: 'What sets you off',
    emoji: '⚡',
    fields: [
      { id: 'flashPoint', label: 'Your biggest trigger when they act up', placeholder: 'e.g. backtalk, bedtime stalling, whining', hint: 'Used to make scenarios feel real and specific to you' },
    ],
  },
]

export function ChildProfileEditClient({ child }: Props) {
  const router = useRouter()
  const toast = useToast()

  // Parent learners see an adult-appropriate field set; kids see the full one.
  const sections = isAdultTrack(child.track) ? ADULT_SECTIONS : SECTIONS

  // Form state — initialize from props
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {}
    for (const section of sections) {
      for (const field of section.fields) {
        v[field.id] = (child as Record<string, string>)[field.id] ?? ''
      }
    }
    return v
  })

  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const savedRef = useRef(values)

  // Track dirty state
  useEffect(() => {
    const dirty = Object.keys(values).some(k => values[k] !== savedRef.current[k])
    setIsDirty(dirty)
  }, [values])

  // Warn on browser back / tab close when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const updateField = useCallback((id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }))
  }, [])

  // ─── Save ──────────────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    // Only send changed fields
    const changed: Record<string, string> = {}
    for (const [k, v] of Object.entries(values)) {
      if (v !== savedRef.current[k]) changed[k] = v
    }

    if (Object.keys(changed).length === 0) {
      toast.info('No changes to save')
      return
    }

    // Require name to be non-empty
    if (('name' in values) && !values.name?.trim()) {
      toast.error("Child's name cannot be empty")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/v1/children/${child.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changed),
      })
      const data = await res.json()

      if (!res.ok) {
        const msg = data.error?.details
          ? Object.values(data.error.details).join('. ')
          : (data.error?.message ?? 'Could not save changes')
        toast.error(msg)
      } else {
        savedRef.current = { ...values }
        setIsDirty(false)
        toast.success('Profile updated. Future scenarios will use the new information.')
      }
    } catch {
      toast.error('Network error. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }, [values, child.id, toast])

  const handleBack = useCallback(() => {
    if (isDirty && !confirm('You have unsaved changes. Leave without saving?')) return
    router.push('/settings')
  }, [isDirty, router])

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={handleBack}
          style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 12, display: 'block' }}
        >
          ← Back to settings
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.navy, margin: '0 0 4px', letterSpacing: -0.5 }}>
          {values.name || child.name}&apos;s Profile
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
          Changes apply to the next AI scenario generated for {values.name || child.name}.
        </p>
      </div>

      {/* Field sections */}
      {sections.map(section => (
        <div key={section.title} style={{ marginBottom: 28 }}>
          <p style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.muted, margin: '0 0 12px',
          }}>
            {section.emoji} {section.title}
          </p>
          <div style={{
            background: '#fff', borderRadius: R.lg,
            border: `1.5px solid ${C.border}`,
            overflow: 'hidden',
          }}>
            {section.fields.map((field, i) => {
              const isChanged = values[field.id] !== savedRef.current[field.id]
              return (
                <div
                  key={field.id}
                  style={{
                    padding: '14px 18px',
                    borderTop: i > 0 ? `1px solid ${C.border}` : undefined,
                    background: isChanged ? '#FFFBEB' : undefined,
                    transition: 'background 0.2s',
                  }}
                >
                  <label
                    htmlFor={field.id}
                    style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}
                  >
                    {field.label}
                    {isChanged && <span style={{ fontSize: 9, color: '#92400E', marginLeft: 6, fontWeight: 800, letterSpacing: '0.1em' }}>CHANGED</span>}
                  </label>
                  <input
                    id={field.id}
                    value={values[field.id] ?? ''}
                    onChange={e => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={saving}
                    maxLength={field.id === 'name' ? 50 : 200}
                    aria-label={field.label}
                    style={{
                      width: '100%',
                      fontSize: 15,
                      fontFamily: 'inherit',
                      color: C.text,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      padding: 0,
                      opacity: saving ? 0.6 : 1,
                      boxSizing: 'border-box',
                    }}
                  />
                  {field.hint && (
                    <p style={{ fontSize: 11, color: C.faint, margin: '4px 0 0', lineHeight: 1.4 }}>{field.hint}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Save bar — sticky at bottom */}
      <div style={{
        position: 'sticky', bottom: 0, background: C.bg,
        padding: '14px 0', marginTop: 8,
        borderTop: `1px solid ${C.border}`,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          onClick={save}
          style={{ opacity: !isDirty && !saving ? 0.5 : 1 }}
        >
          {saving ? 'Saving...' : isDirty ? 'Save changes' : 'No changes'}
        </Button>
        {isDirty && (
          <Button
            variant="secondary"
            size="md"
            disabled={saving}
            onClick={() => { setValues({ ...savedRef.current }); setIsDirty(false) }}
          >
            Reset
          </Button>
        )}
      </div>
    </>
  )
}
