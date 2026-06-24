// app/admin/orgs/[slug]/settings/page.tsx
// Server component — re-exports OrgSettingsServer which contains Server Actions.
// Must NOT have 'use client' — Server Actions cannot live in client component trees.

export { default } from './OrgSettingsServer'
