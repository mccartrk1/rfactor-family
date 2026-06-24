'use client'
// app/settings/client.tsx
// Family settings: name editing, child management, account deletion.

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Button, Input } from '@/components'
import { C, R } from '@/components/tokens'

interface FamilyData {
  id: string
  familyName: string
  createdAt: string
  userEmail: string
}

interface ChildSummary {
  id: string
  name: string
  age: string
  grade: string
  school: string
  track: string
  createdAt: string
  weeksCompleted: number
}

interface Props {
  family: FamilyData
  children: ChildSummary[]
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, margin: '0 0 14px' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: R.lg, border: `1.5px solid ${C.border}`, padding: 20 }}>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsClient({ family: initialFamily, children: initialChildren }: Props) {
  const router = useRouter()
  const toast = useToast()

  const [family, setFamily] = useState(initialFamily)
  const [children, setChildren] = useState(initialChildren)
  const [editingName, setEditingName] = useState(false)
  const [familyName, setFamilyName] = useState(initialFamily.familyName)
  const [savingName, setSavingName] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingAccountLoading, setDeletingAccountLoading] = useState(false)
  const [removingChildId, setRemovingChildId] = useState<string | null>(null)

  // ─── Family name update ───────────────────────────────────────────────────

  const saveFamilyName = useCallback(async () => {
    const name = familyName.trim()
    if (!name || name === family.familyName) {
      setEditingName(false)
      setFamilyName(family.familyName)
      return
    }

    setSavingName(true)
    try {
      const res = await fetch('/api/v1/families/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyName: name }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error?.message ?? 'Could not update family name')
        setFamilyName(family.familyName)
      } else {
        setFamily(prev => ({ ...prev, familyName: name }))
        toast.success('Family name updated')
        setEditingName(false)
      }
    } catch {
      toast.error('Network error. Try again.')
      setFamilyName(family.familyName)
    } finally {
      setSavingName(false)
    }
  }, [familyName, family.familyName, toast])

  // ─── Remove child ─────────────────────────────────────────────────────────

  const removeChild = useCallback(async (childId: string, childName: string) => {
    if (!confirm(`Remove ${childName} from your family? This deletes all their progress and cannot be undone.`)) return

    setRemovingChildId(childId)
    try {
      const res = await fetch(`/api/v1/children/${childId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error?.message ?? 'Could not remove child')
      } else {
        // FIX (HIGH): Use functional update to compute remaining children from
        // current state — avoids stale closure where children.length was captured
        // at the time the callback was created, not when the delete completes.
        setChildren(prev => {
          const remaining = prev.filter(c => c.id !== childId)
          if (remaining.length === 0) router.push('/onboard')
          return remaining
        })
        toast.success(`${childName} has been removed`)
      }
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setRemovingChildId(null)
    }
  }, [children.length, router, toast])

  // ─── Delete account ───────────────────────────────────────────────────────

  const deleteAccount = useCallback(async () => {
    if (deleteConfirm.toLowerCase() !== family.userEmail.toLowerCase()) {
      toast.error('Email does not match your account')
      return
    }
    setDeletingAccountLoading(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: deleteConfirm }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Could not delete account')
        setDeletingAccountLoading(false)
      } else {
        router.push('/auth/login')
      }
    } catch {
      toast.error('Network error. Try again.')
      setDeletingAccountLoading(false)
    }
  }, [deleteConfirm, family.userEmail, router, toast])

  return (
    <>
      {/* ── Children ─────────────────────────────────────────────────── */}
      <Section title="Children">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children.map(child => (
            <Card key={child.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: C.navy, margin: '0 0 3px' }}>{child.name}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                    {[child.age && `Age ${child.age}`, child.grade, child.school].filter(Boolean).join(' · ')}
                  </p>
                  <p style={{ fontSize: 11, color: C.muted, margin: '4px 0 0' }}>
                    {child.weeksCompleted} of 13 weeks completed
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/settings/children/${child.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={removingChildId === child.id}
                    onClick={() => removeChild(child.id, child.name)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Button
            variant="secondary"
            fullWidth
            style={{ border: `1.5px dashed ${C.border}` }}
            onClick={() => router.push('/onboard?add=true')}
          >
            + Add another child
          </Button>
        </div>
      </Section>

      {/* ── Family name ───────────────────────────────────────────────── */}
      <Section title="Family">
        <Card>
          {editingName ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <Input
                label="Family name"
                value={familyName}
                onChange={setFamilyName}
                placeholder="e.g. McCarty"
                autoFocus
                onEnter={saveFamilyName}
                style={{ flex: 1 }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 0 }}>
                <Button variant="primary" size="sm" loading={savingName} onClick={saveFamilyName}>Save</Button>
                <Button variant="secondary" size="sm" onClick={() => { setEditingName(false); setFamilyName(family.familyName) }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, color: C.muted, margin: '0 0 2px' }}>Family name</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0 }}>{family.familyName}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEditingName(true)}>Edit</Button>
            </div>
          )}
        </Card>
      </Section>

      {/* ── Account ───────────────────────────────────────────────────── */}
      <Section title="Account">
        <Card>
          <p style={{ fontSize: 13, color: C.textMid, margin: '0 0 4px' }}>Signed in as</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 16px' }}>{family.userEmail}</p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeletingAccount(d => !d)}
          >
            Delete account
          </Button>

          {deletingAccount && (
            <div style={{ marginTop: 16, padding: 16, background: '#FFF0F0', borderRadius: R.md, border: `1.5px solid #FECACA` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.dangerDark, margin: '0 0 4px' }}>
                This permanently deletes all data
              </p>
              <p style={{ fontSize: 12, color: C.dangerDark, margin: '0 0 12px', lineHeight: 1.5 }}>
                Deleting your account removes your family, all children, all lesson progress, and all AI scenarios. This cannot be undone.
              </p>
              <Input
                label={`Type your email to confirm: ${family.userEmail}`}
                value={deleteConfirm}
                onChange={setDeleteConfirm}
                placeholder={family.userEmail}
                inputStyle={{ borderColor: C.danger }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletingAccountLoading}
                  disabled={deleteConfirm.toLowerCase() !== family.userEmail.toLowerCase()}
                  onClick={deleteAccount}
                >
                  Delete everything
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setDeletingAccount(false); setDeleteConfirm('') }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </Section>

      {/* ── Version ───────────────────────────────────────────────────── */}
      <p style={{ fontSize: 11, color: C.faint, textAlign: 'center', margin: 0 }}>
        R Factor Family App · v0.1 · {new Date(family.createdAt).toLocaleDateString()}
      </p>
    </>
  )
}
