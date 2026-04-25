'use client'
import { useState } from 'react'
import { colors, dark } from '@/lib/design'

interface DebateActionBarProps {
  debateId: string
  headline: string
  slug?: string | null
}

export function DebateActionBar({ debateId, headline, slug }: DebateActionBarProps) {
  const [voted, setVoted] = useState<string | null>(null)
  const [showVote, setShowVote] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const debateUrl = `https://bilateral.news/debate/${slug || debateId}`

  function handleVote(lean: string) {
    setVoted(lean)
    setShowVote(false)
    try {
      const votes = JSON.parse(localStorage.getItem('bilateral_votes') || '{}')
      votes[debateId] = { lean, at: new Date().toISOString() }
      localStorage.setItem('bilateral_votes', JSON.stringify(votes))
    } catch {}
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: headline, url: debateUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(debateUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  function handleSave() {
    setSaved(!saved)
    try {
      const saves = JSON.parse(localStorage.getItem('bilateral_saved') || '[]') as string[]
      if (saved) {
        localStorage.setItem('bilateral_saved', JSON.stringify(saves.filter(s => s !== debateId)))
      } else {
        saves.push(debateId)
        localStorage.setItem('bilateral_saved', JSON.stringify(saves))
      }
    } catch {}
  }

  const iconBtn = (active?: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    color: active ? '#FFFFFF' : dark.textDim,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '6px 10px',
    borderRadius: 8,
    transition: 'color 150ms ease',
  })

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 16px',
          background: dark.surface,
          borderTop: `1px solid ${dark.border}`,
        }}
      >
        {/* Save — secondary */}
        <button onClick={handleSave} style={iconBtn(saved)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? '#FFFFFF' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {saved ? 'Saved' : 'Save'}
        </button>

        {/* Comment — secondary */}
        <button onClick={() => setShowComment(!showComment)} style={iconBtn()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Comment
        </button>

        {/* VOTE — primary, centered, emphasized */}
        <button
          onClick={() => setShowVote(!showVote)}
          style={{
            background: voted
              ? voted === 'conservative' ? colors.conservative
                : voted === 'liberal' ? colors.liberal
                : dark.textDim
              : 'rgba(255,255,255,0.12)',
            border: voted ? 'none' : '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '10px 22px',
            borderRadius: 999,
            transition: 'all 150ms ease',
            margin: '0 8px',
          }}
        >
          {voted ? (
            voted === 'conservative' ? '← Leaning right' :
            voted === 'liberal' ? 'Leaning left →' :
            '↔ Not sure'
          ) : 'Vote'}
        </button>

        {/* Share — secondary */}
        <button onClick={handleShare} style={iconBtn(copied)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {copied ? 'Copied' : 'Share'}
        </button>

        {/* Go deeper — tertiary */}
        <a
          href={`/debate/${slug || debateId}`}
          style={{
            ...iconBtn(),
            textDecoration: 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Read
        </a>
      </div>

      {/* Vote drawer */}
      {showVote && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            background: dark.surfaceLight,
            borderTop: `1px solid ${dark.border}`,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: dark.text, marginBottom: 4 }}>
            Where do you lean?
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleVote('conservative')}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                background: colors.conservative,
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              Conservative
            </button>
            <button
              onClick={() => handleVote('unsure')}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: `1px solid ${dark.border}`,
                background: 'transparent',
                color: dark.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Not sure
            </button>
            <button
              onClick={() => handleVote('liberal')}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                background: colors.liberal,
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              Liberal
            </button>
          </div>
        </div>
      )}

      {/* Comment placeholder */}
      {showComment && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            background: dark.surfaceLight,
            borderTop: `1px solid ${dark.border}`,
            padding: '28px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: dark.text, marginBottom: 6 }}>
            Comments coming soon
          </div>
          <div style={{ fontSize: 13, color: dark.textDim }}>
            Join the conversation — launching soon.
          </div>
        </div>
      )}
    </div>
  )
}
