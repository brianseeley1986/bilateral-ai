'use client'
import { useState } from 'react'
import { EmailCapture } from '@/components/EmailCapture'

export function SubscribeBlock() {
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: '0 1px 2px rgba(10,10,10,0.04)',
          marginBottom: 48,
        }}
      >
        <EmailCapture />
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '24px 28px',
        boxShadow: '0 1px 2px rgba(10,10,10,0.04)',
        marginBottom: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 260px', minWidth: 220 }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            fontWeight: 600,
            color: '#0A0A0A',
            letterSpacing: '-0.015em',
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          Fresh debates, every morning.
        </div>
        <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.55 }}>
          One email. The debates worth reading. Unsubscribe anytime.
        </div>
      </div>
      <button
        onClick={() => setShowForm(true)}
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#F5F5F0',
          background: '#0A0A0A',
          border: 'none',
          padding: '11px 22px',
          borderRadius: 999,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Subscribe
      </button>
    </div>
  )
}
