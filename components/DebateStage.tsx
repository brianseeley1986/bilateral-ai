'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { colors, dark } from '@/lib/design'

/**
 * DebateStage — the ONE shared debate experience.
 * Used by both homepage hero and /feed.
 */

export interface StageDebate {
  id: string
  headline: string
  createdAt: string
  geographicScope?: string
  conservativeOneLine: string
  liberalOneLine: string
  conservativeFeedHook?: string | null
  liberalFeedHook?: string | null
  conservativeArgument?: string | null
  liberalArgument?: string | null
  whatHappened?: string | null
  whyItMatters?: string | null
  suggestedHook?: string
  slug?: string | null
  imageUrl?: string | null
  imageSource?: string | null
}

interface DebateStageProps {
  debate: StageDebate
  showNextCue?: boolean
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return text.slice(0, cut > 0 ? cut : max) + '...'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export function DebateStage({ debate }: DebateStageProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState(1)
  const [voted, setVoted] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.offsetWidth
    }
  }, [])

  useEffect(() => {
    try {
      const votes = JSON.parse(localStorage.getItem('bilateral_votes') || '{}')
      if (votes[debate.id]) setVoted(votes[debate.id].lean)
    } catch {}
  }, [debate.id])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const w = scrollRef.current.offsetWidth
    const p = Math.round(scrollRef.current.scrollLeft / w)
    if (p !== panel) setPanel(p)
  }, [panel])

  function goTo(p: number) {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ left: scrollRef.current.offsetWidth * p, behavior: 'smooth' })
  }

  function handleVote(lean: string) {
    setVoted(lean)
    try {
      const votes = JSON.parse(localStorage.getItem('bilateral_votes') || '{}')
      votes[debate.id] = { lean, at: new Date().toISOString() }
      localStorage.setItem('bilateral_votes', JSON.stringify(votes))
    } catch {}
  }

  function handleShare() {
    const url = `https://bilateral.news/debate/${debate.slug || debate.id}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: debate.headline, url }).catch(() => {})
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const context = debate.whatHappened ? truncate(debate.whatHappened, 120) : debate.suggestedHook || ''
  const con = debate.conservativeOneLine || debate.conservativeFeedHook || ''
  const lib = debate.liberalOneLine || debate.liberalFeedHook || ''

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: dark.bg }}>

      {/* ═══ Horizontal panels — takes remaining space ═══ */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="stage-hscroll"
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          minHeight: 0, // allow flex shrink
        }}
      >
        {/* ── LIBERAL (left) ── */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: '24px 40px', boxSizing: 'border-box',
            background: `radial-gradient(ellipse at center, ${dark.surface} 0%, #0c1428 100%)`,
            boxShadow: 'inset 0 0 120px rgba(27,79,190,0.2)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: colors.liberal, background: 'rgba(27,79,190,0.18)', padding: '5px 16px', borderRadius: 999, marginBottom: 20, textTransform: 'uppercase' }}>
              Liberal
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#FFFFFF', textAlign: 'center', margin: 0, maxWidth: 460 }}>
              {lib}
            </h2>
          </div>
        </div>

        {/* ── NEUTRAL (center) ── */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: '24px 40px', boxSizing: 'border-box',
            background: dark.bg, position: 'relative',
          }}>
            {/* Blue glow — left */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to right, rgba(27,79,190,0.25), transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none', zIndex: 2 }}>
              <span style={{ fontSize: 12, color: colors.liberal, opacity: 0.6 }}>&larr;</span>
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.liberal, opacity: 0.5 }}>Liberal</span>
            </div>

            {/* Red glow — right */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to left, rgba(193,18,31,0.25), transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none', zIndex: 2 }}>
              <span style={{ fontSize: 12, color: colors.conservative, opacity: 0.6 }}>&rarr;</span>
              <span style={{ writingMode: 'vertical-rl', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.conservative, opacity: 0.5 }}>Conservative</span>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark.textMuted, background: dark.surfaceLight, padding: '3px 9px', borderRadius: 6 }}>
                {(debate.geographicScope || 'national').toUpperCase()}
              </span>
              <span style={{ fontSize: 9, color: dark.textDim }}>{timeAgo(debate.createdAt)}</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.025em', color: '#FFFFFF', textAlign: 'center', margin: 0, marginBottom: 12, maxWidth: 460 }}>
              {debate.headline}
            </h2>

            <p style={{ fontSize: 13, lineHeight: 1.5, color: dark.textMuted, textAlign: 'center', margin: 0, maxWidth: 380 }}>
              {context}
            </p>
          </div>
        </div>

        {/* ── CONSERVATIVE (right) ── */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: '24px 40px', boxSizing: 'border-box',
            background: `radial-gradient(ellipse at center, ${dark.surface} 0%, #1a0a0a 100%)`,
            boxShadow: 'inset 0 0 120px rgba(193,18,31,0.2)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: colors.conservative, background: 'rgba(193,18,31,0.18)', padding: '5px 16px', borderRadius: 999, marginBottom: 20, textTransform: 'uppercase' }}>
              Conservative
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#FFFFFF', textAlign: 'center', margin: 0, maxWidth: 460 }}>
              {con}
            </h2>
          </div>
        </div>
      </div>

      {/* ═══ Tab bar ═══ */}
      <div style={{
        display: 'flex', borderTop: `1px solid ${dark.border}`,
        background: dark.surface, flexShrink: 0,
      }}>
        <button onClick={() => goTo(0)} style={tabStyle(panel === 0, colors.liberal)}>Liberal</button>
        <button onClick={() => goTo(1)} style={tabStyle(panel === 1, '#FFFFFF')}>Neutral</button>
        <button onClick={() => goTo(2)} style={tabStyle(panel === 2, colors.conservative)}>Conservative</button>
      </div>

      {/* ═══ Vote + Actions — clean layout ═══ */}
      <div style={{
        padding: '12px 16px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        background: dark.bg, flexShrink: 0,
      }}>
        {/* Vote section */}
        {!voted ? (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: dark.textMuted, marginBottom: 8 }}>
              Where do you lean?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => handleVote('conservative')} style={voteBtn(colors.conservative)}>Conservative</button>
              <button onClick={() => handleVote('unsure')} style={voteBtn('#444', true)}>Not sure</button>
              <button onClick={() => handleVote('liberal')} style={voteBtn(colors.liberal)}>Liberal</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: voted === 'conservative' ? colors.conservative : voted === 'liberal' ? colors.liberal : '#888' }}>
              {voted === 'conservative' ? '← Leaning conservative' : voted === 'liberal' ? 'Leaning liberal →' : 'Not sure yet'}
            </span>
          </div>
        )}

        {/* Action row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderTop: `1px solid ${dark.border}`, paddingTop: 10 }}>
          <ActionIcon label="Comment" icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />
          <ActionIcon label={copied ? 'Copied!' : 'Share'} onClick={handleShare} icon={<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></>} />
          <a
            href={`/debate/${debate.slug || debate.id}`}
            style={{
              fontSize: 11, fontWeight: 600, color: dark.textMuted,
              textDecoration: 'none', letterSpacing: '0.02em',
              padding: '4px 0',
            }}
          >
            Read full debate &rarr;
          </a>
        </div>
      </div>

      <style>{`
        .stage-hscroll::-webkit-scrollbar { display: none; }
        @keyframes stagePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

function tabStyle(active: boolean, color: string): React.CSSProperties {
  return {
    flex: 1, padding: '8px 0', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: active ? color : 'rgba(255,255,255,0.25)',
    borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
    transition: 'all 150ms ease',
  }
}

function voteBtn(bg: string, outline?: boolean): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 999, border: outline ? '1px solid rgba(255,255,255,0.2)' : 'none',
    background: outline ? 'transparent' : bg, color: '#FFFFFF',
    fontSize: 9, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em',
    textTransform: 'uppercase', transition: 'all 120ms ease',
  }
}

function ActionIcon({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      color: dark.textDim, fontSize: 8, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 6px',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
      {label}
    </button>
  )
}
