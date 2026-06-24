// types/next-auth.d.ts
// Augments NextAuth types so session.user.id is correctly typed.
//
// BUG 6 FIX: Removed `familyId` and `hasFamily` from this declaration.
// The previous refactor removed those fields from auth.ts's session callback,
// but the type declaration was never updated. TypeScript believed they existed
// (typed as string | null and boolean) while at runtime they were always
// undefined. Any code checking session.familyId would silently get undefined
// where it expected string | null.
//
// Family data is now fetched lazily by each page that needs it via the API.

import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}
