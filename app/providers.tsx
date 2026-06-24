'use client'
// app/providers.tsx
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/ui/Toast'
import { injectGlobalStyles } from '@/components/tokens'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Inject global focus rings and animation keyframes once on mount
  useEffect(() => { injectGlobalStyles() }, [])

  return (
    <NextAuthSessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </NextAuthSessionProvider>
  )
}

// Keep SessionProvider export for any legacy imports
export { Providers as SessionProvider }
