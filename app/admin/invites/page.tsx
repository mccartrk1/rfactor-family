'use client'
// app/admin/invites/page.tsx
// Client component for invite management — needs interactive create form.

import { useState, useEffect } from 'react'

interface InviteCode {
  id: string
  code: string
  note: string | null
  usedAt: string | null
  usedBy: string | null
  createdAt: string
}

export default function AdminInvitesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [newNote, setNewNote] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/admin/invites')
      .then(r => r.json())
      .then(d => { setCodes(d.codes ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function createCode() {
    if (!newCode.trim()) return
    setCreating(true); setError(''); setSuccess('')

    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode, note: newNote }),
    })
    const data = await res.json()
    setCreating(false)

    if (!res.ok) { setError(data.error || 'Failed to create'); return }
    setCodes(prev => [data.code, ...prev])
    setNewCode(''); setNewNote('')
    setSuccess(`Created: ${data.code.code}`)
  }

  async function deleteCode(id: string, code: string) {
    if (!confirm(`Delete invite code "${code}"?`)) return
    const res = await fetch('/api/admin/invites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setCodes(prev => prev.filter(c => c.id !== id))
    else { const d = await res.json(); alert(d.error) }
  }

  const used = codes.filter(c => c.usedAt)
  const available = codes.filter(c => !c.usedAt)

  const S = {
    box: { background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '22px 24px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 } as const,
    input: { width: '100%', padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box' } as const,
    btn: { padding: '12px 20px', background: '#FF5C35', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' } as const,
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: -0.5 }}>Invite Codes</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          {available.length} available · {used.length} used · {codes.length} total
        </p>
      </div>

      {/* Create form */}
      <div style={S.box}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>Create new code</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10 }}>
          <input
            value={newCode}
            onChange={e => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            onKeyDown={e => e.key === 'Enter' && createCode()}
            placeholder="code (e.g. jones2025)"
            style={S.input}
          />
          <input
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createCode()}
            placeholder="note (e.g. Jones family — Cincinnati pilot)"
            style={S.input}
          />
          <button onClick={createCode} disabled={creating || !newCode.trim()} style={{ ...S.btn, opacity: creating || !newCode.trim() ? 0.5 : 1 }}>
            {creating ? 'Creating...' : '+ Create'}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: '#FF5C35', margin: '8px 0 0' }}>{error}</p>}
        {success && <p style={{ fontSize: 12, color: '#00875A', margin: '8px 0 0' }}>✓ {success}</p>}
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '10px 0 0' }}>
          Lowercase letters, numbers, and hyphens only. 4-32 characters.
        </p>
      </div>

      {/* Available codes */}
      {available.length > 0 && (
        <div style={S.box}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>
            Available ({available.length})
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Code', 'Note', 'Created', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', padding: '0 0 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {available.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '10px 0' }}>
                    <code style={{ fontSize: 13, fontWeight: 700, color: '#FF5C35', background: 'rgba(255,92,53,0.12)', padding: '3px 10px', borderRadius: 6 }}>{c.code}</code>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{c.note || '—'}</td>
                  <td style={{ padding: '10px 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>
                    <button
                      onClick={() => deleteCode(c.id, c.code)}
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Used codes */}
      {used.length > 0 && (
        <div style={S.box}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>
            Used ({used.length})
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Code', 'Note', 'Used'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', padding: '0 0 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {used.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '10px 0' }}>
                    <code style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 6 }}>{c.code}</code>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{c.note || '—'}</td>
                  <td style={{ padding: '10px 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                    {c.usedAt ? new Date(c.usedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Loading...</p>}
    </>
  )
}
