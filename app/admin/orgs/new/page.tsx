// app/admin/orgs/new/page.tsx
// Create a new organization.
// Used to onboard Focus 3, schools, churches.

import { requireAdmin, createOrganization } from '@/lib/admin'
import { redirect } from 'next/navigation'

export const metadata = { title: 'New Organization — Admin' }

// Server action for form submission
async function createOrgAction(formData: FormData) {
  'use server'
  await requireAdmin()

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase()
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const tier = String(formData.get('tier') ?? 'pilot') as 'pilot' | 'pro' | 'enterprise'
  const maxFamilies = parseInt(String(formData.get('maxFamilies') ?? '50'), 10)
  const primaryColor = String(formData.get('primaryColor') ?? '#0F2645')
  const adminEmail = String(formData.get('adminEmail') ?? '').trim()

  if (!slug || !name) return  // client validation handles this

  await createOrganization({
    slug, name, description: description || undefined,
    tier, maxFamilies, primaryColor,
    adminEmail: adminEmail || undefined,
  })

  redirect(`/admin/orgs/${slug}`)
}

export default async function NewOrgPage() {
  await requireAdmin()

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E2E8F0',
    borderRadius: 10,
    fontSize: 15,
    fontFamily: 'inherit',
    color: '#0F2645',
    background: '#fff',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6 }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <a href="/admin/orgs" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>← Organizations</a>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F2645', margin: '12px 0 4px' }}>New Organization</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Creates a new organizational context for families, invite codes, and analytics.</p>
      </div>

      <form action={createOrgAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic info */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 20px' }}>Basic information</p>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="name" style={labelStyle}>Organization name <span style={{ color: '#EF4444' }}>*</span></label>
            <input id="name" name="name" required placeholder="Focus 3" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="slug" style={labelStyle}>
              Slug (URL identifier) <span style={{ color: '#EF4444' }}>*</span>
              <span style={{ fontWeight: 400, marginLeft: 8 }}>— lowercase letters, numbers, hyphens</span>
            </label>
            <input id="slug" name="slug" required placeholder="focus3" pattern="[a-z0-9-]+" style={inputStyle} />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>
              URL will be: /admin/orgs/<strong>focus3</strong>
            </p>
          </div>

          <div>
            <label htmlFor="description" style={labelStyle}>Description (optional)</label>
            <textarea id="description" name="description" placeholder="Focus 3 corporate training partner" rows={2}
              style={{ ...inputStyle, resize: 'none' as const }} />
          </div>
        </div>

        {/* Plan */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 20px' }}>Plan settings</p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="tier" style={labelStyle}>Tier</label>
              <select id="tier" name="tier" style={inputStyle}>
                <option value="pilot">Pilot (free)</option>
                <option value="pro">Pro ($299/year)</option>
                <option value="enterprise">Enterprise (custom)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="maxFamilies" style={labelStyle}>Max families</label>
              <input id="maxFamilies" name="maxFamilies" type="number" min="1" max="10000" defaultValue="50" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 20px' }}>Branding</p>
          <div>
            <label htmlFor="primaryColor" style={labelStyle}>Brand color</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input id="primaryColor" name="primaryColor" type="color" defaultValue="#0F2645"
                style={{ width: 48, height: 40, border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
              <span style={{ fontSize: 13, color: '#6B7280' }}>Applied to org-branded headers</span>
            </div>
          </div>
        </div>

        {/* Admin */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 20px' }}>Org administrator (optional)</p>
          <div>
            <label htmlFor="adminEmail" style={labelStyle}>Admin email</label>
            <input id="adminEmail" name="adminEmail" type="email" placeholder="admin@focus3.com" style={inputStyle} />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>
              They must have signed in at least once. Gives them org-scoped admin access.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={{ flex: 1, padding: '14px 24px', background: '#FF5C35', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            Create organization →
          </button>
          <a href="/admin/orgs" style={{ padding: '14px 24px', background: '#F4F6FA', color: '#6B7280', textDecoration: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600 }}>
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
