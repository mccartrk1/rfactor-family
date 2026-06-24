// app/admin/orgs/[slug]/settings/OrgSettingsServer.tsx
// RSC wrapper — loads org data, delegates to client form

import { requireAdmin, getOrgDetail, updateOrganization, logAdminAccess } from '@/lib/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface Props { params: { slug: string } }

async function updateOrgAction(slug: string, formData: FormData) {
  'use server'
  const adminEmail = await requireAdmin()
  logAdminAccess('update_org_settings', adminEmail, `slug=${slug}`)

  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const primaryColor = String(formData.get('primaryColor') ?? '')
  const logoUrl = String(formData.get('logoUrl') ?? '').trim()
  const tier = String(formData.get('tier') ?? 'pilot')
  const maxFamilies = parseInt(String(formData.get('maxFamilies') ?? '50'), 10)
  const isActive = formData.get('isActive') === 'true'

  await updateOrganization(slug, {
    name: name || undefined,
    description: description || undefined,
    primaryColor: primaryColor || undefined,
    logoUrl: logoUrl || undefined,
    tier,
    maxFamilies: isNaN(maxFamilies) ? undefined : maxFamilies,
    isActive,
  })

  redirect(`/admin/orgs/${slug}`)
}

export default async function OrgSettingsServer({ params }: Props) {
  await requireAdmin()
  const org = await getOrgDetail(params.slug)
  if (!org) notFound()

  const updateAction = updateOrgAction.bind(null, params.slug)

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
        <Link href={`/admin/orgs/${org.slug}`} style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>
          ← {org.name}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F2645', margin: '12px 0 0' }}>Organization settings</h1>
      </div>

      {/* Live branding preview */}
      <div style={{ background: org.primaryColor, borderRadius: 14, padding: '24px 24px', marginBottom: 24 }}>
        {org.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logoUrl} alt={org.name} style={{ height: 32, marginBottom: 12, objectFit: 'contain' }} />
        )}
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>
          {org.name}
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>R Factor Program</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Live preview — update and save to see changes</p>
      </div>

      <form action={updateAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 20px' }}>Organization</p>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="name" style={labelStyle}>Display name</label>
            <input id="name" name="name" defaultValue={org.name} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="description" style={labelStyle}>Description</label>
            <textarea id="description" name="description" defaultValue={org.description ?? ''} rows={2}
              style={{ ...inputStyle, resize: 'none' as const }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="tier" style={labelStyle}>Tier</label>
              <select id="tier" name="tier" defaultValue={org.tier} style={inputStyle}>
                <option value="pilot">Pilot</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="maxFamilies" style={labelStyle}>Max families</label>
              <input id="maxFamilies" name="maxFamilies" type="number" min="1" defaultValue={org.maxFamilies} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 20px' }}>Branding</p>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="primaryColor" style={labelStyle}>Brand color</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input id="primaryColor" name="primaryColor" type="color" defaultValue={org.primaryColor}
                style={{ width: 48, height: 40, border: '1.5px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
              <span style={{ fontSize: 13, color: '#6B7280' }}>Appears in the family dashboard header for this org</span>
            </div>
          </div>
          <div>
            <label htmlFor="logoUrl" style={labelStyle}>Logo URL (optional)</label>
            <input id="logoUrl" name="logoUrl" type="url" defaultValue={org.logoUrl ?? ''} placeholder="https://cdn.focus3.com/logo.png" style={inputStyle} />
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>Must be HTTPS. Recommended size: 200×50px</p>
          </div>
        </div>

        {/* Status */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', margin: '0 0 16px' }}>Status</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="isActive" value="true" defaultChecked={org.isActive} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F2645' }}>Active</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="isActive" value="false" defaultChecked={!org.isActive} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#EF4444' }}>Inactive</span>
            </label>
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '8px 0 0' }}>
            Inactive orgs: families lose subscription inheritance. Families are NOT deleted.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={{ flex: 1, padding: '14px 24px', background: '#FF5C35', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            Save settings
          </button>
          <Link href={`/admin/orgs/${org.slug}`} style={{ padding: '14px 24px', background: '#F4F6FA', color: '#6B7280', textDecoration: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600 }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
