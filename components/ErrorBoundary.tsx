'use client'
// components/ErrorBoundary.tsx
//
// Catches React render errors in the lesson flow so a single bad scenario
// payload or unexpected null doesn't white-screen the entire app.
// The parent renders a recovery UI; the family can go back to the dashboard.

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, send to your error tracker here (Sentry, Datadog, etc.)
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          minHeight: '100vh', background: '#F4F6FA', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F2645', margin: '0 0 8px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.6 }}>
              This lesson hit an unexpected error. Your progress is saved.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              style={{
                width: '100%', padding: '15px 22px', background: '#0F2645',
                color: '#fff', border: 'none', borderRadius: 14, fontSize: 15,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Back to dashboard →
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
