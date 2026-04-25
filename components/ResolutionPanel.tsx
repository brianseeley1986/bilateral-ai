'use client'
import { useState } from 'react'
import { colors } from '@/lib/design'

interface ResolutionPanelProps {
  debateId: string
  headline: string
  slug?: string | null
  onClose: () => void
}

export function ResolutionPanel({ debateId, headline, slug, onClose }: ResolutionPanelProps) {
  const [voted, setVoted] = useState<string | null>(() => {
    try {
      const votes = JSON.parse(localStorage.getItem('bilateral_votes') || '{}')
      return votes[debateId]?.lean || null
    } catch { return null }
  })

  function handleVote(lean: string) {
    setVoted(lean)
    try {
      const votes = JSON.parse(localStorage.getItem('bilateral_votes') || '{}')
      votes[debateId] = { lean, at: new Date().toISOString() }
      localStorage.setItem('bilateral_votes', JSON.stringify(votes))
    } catch {}
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        background: '#F5F5F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 28px',
        animation: 'fadeUp 250ms ease forwards',
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Close / back button */}
      <button
        onClick={onClose}
        aria-label="Back to debate"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#999',
          fontSize: 20,
          padding: 8,
        }}
      >
        &times;
      </button>

      {/* Headline reminder */}
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          fontWeight: 500,
          color: '#0A0A0A',
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: '-0.015em',
          maxWidth: 400,
          marginBottom: 36,
          opacity: 0.7,
        }}
      >
        {headline}
      </div>

      {!voted ? (
        <>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#0A0A0A',
              marginBottom: 28,
              fontFamily: 'var(--font-serif)',
              letterSpacing: '-0.02em',
            }}
          >
            Where do you lean?
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => handleVote('conservative')}
              style={{
                padding: '14px 28px',
                borderRadius: 999,
                border: 'none',
                background: colors.conservative,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'transform 150ms ease',
              }}
            >
              Conservative
            </button>
            <button
              onClick={() => handleVote('unsure')}
              style={{
                padding: '14px 28px',
                borderRadius: 999,
                border: '1.5px solid #D0D0D0',
                background: '#FFFFFF',
                color: '#666',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 150ms ease',
              }}
            >
              Not sure
            </button>
            <button
              onClick={() => handleVote('liberal')}
              style={{
                padding: '14px 28px',
                borderRadius: 999,
                border: 'none',
                background: colors.liberal,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'transform 150ms ease',
              }}
            >
              Liberal
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color:
                voted === 'conservative' ? colors.conservative
                : voted === 'liberal' ? colors.liberal
                : '#666',
              marginBottom: 8,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {voted === 'conservative' ? 'Leaning conservative'
              : voted === 'liberal' ? 'Leaning liberal'
              : 'Not sure yet'}
          </div>

          <div style={{ fontSize: 13, color: '#999', marginBottom: 32 }}>
            Your perspective has been noted.
          </div>

          <a
            href={`/debate/${slug || debateId}`}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#0A0A0A',
              textDecoration: 'none',
              padding: '12px 28px',
              borderRadius: 999,
              border: '1.5px solid #0A0A0A',
              transition: 'all 150ms ease',
            }}
          >
            Read full debate &rarr;
          </a>
        </>
      )}
    </div>
  )
}
