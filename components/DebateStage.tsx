'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { colors, dark } from '@/lib/design'

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function smartTrim(text: string, max: number): string {
  if (!text || text.length <= max) return text
  // Find the last sentence-ending punctuation within range
  const window = text.slice(0, max + 40)
  // Look for ". " or "." at end, or "? " or "! " — real sentence boundaries
  let best = -1
  for (let i = Math.min(window.length - 1, max + 30); i >= max * 0.35; i--) {
    if ((window[i] === '.' || window[i] === '?' || window[i] === '!') &&
        (i === window.length - 1 || window[i + 1] === ' ' || window[i + 1] === '\n')) {
      best = i
      break
    }
  }
  if (best > 0) return text.slice(0, best + 1)
  // No sentence boundary — fall back to word boundary
  const wordEnd = text.lastIndexOf(' ', max)
  return (wordEnd > max * 0.5 ? text.slice(0, wordEnd) : text.slice(0, max)) + '...'
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

  const context = smartTrim(debate.whatHappened || debate.suggestedHook || '', 220)
  const con = debate.conservativeOneLine || debate.conservativeFeedHook || ''
  const conDetail = debate.conservativeArgument ? smartTrim(debate.conservativeArgument, 300) : null
  const lib = debate.liberalOneLine || debate.liberalFeedHook || ''
  const libDetail = debate.liberalArgument ? smartTrim(debate.liberalArgument, 300) : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: dark.bg }}>

      {/* ═══ Horizontal panels ═══ */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="stage-hscroll"
        style={{
          flex: 1, display: 'flex', overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', minHeight: 0,
        }}
      >
        {/* ── LIBERAL (left) ── */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: '24px 48px', boxSizing: 'border-box',
            background: `radial-gradient(ellipse at 30% 50%, rgba(27,79,190,0.12) 0%, ${dark.surface} 60%, #080e1a 100%)`,
            boxShadow: 'inset 0 0 160px rgba(27,79,190,0.15)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: colors.liberal, background: 'rgba(27,79,190,0.18)', padding: '5px 16px', borderRadius: 999, marginBottom: 20, textTransform: 'uppercase' }}>
              Liberal
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.02em', color: '#FFFFFF', textAlign: 'center', margin: 0, marginBottom: 14, maxWidth: 460 }}>
              {lib}
            </h2>
            {libDetail && (
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.55)', textAlign: 'center', margin: 0, maxWidth: 400 }}>
                {libDetail}
              </p>
            )}
          </div>
        </div>

        {/* ── NEUTRAL (center) ── */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: '24px 48px', boxSizing: 'border-box',
            background: dark.bg, position: 'relative',
          }}>
            {/* ── Strong blue glow — left ── */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to right, rgba(27,79,190,0.35), rgba(27,79,190,0.08) 60%, transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, pointerEvents: 'none', zIndex: 2 }}>
              <span style={{ fontSize: 14, color: colors.liberal, opacity: 0.7 }}>&larr;</span>
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.liberal, opacity: 0.6 }}>Liberal</span>
            </div>

            {/* ── Strong red glow — right ── */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to left, rgba(193,18,31,0.35), rgba(193,18,31,0.08) 60%, transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, pointerEvents: 'none', zIndex: 2 }}>
              <span style={{ fontSize: 14, color: colors.conservative, opacity: 0.7 }}>&rarr;</span>
              <span style={{ writingMode: 'vertical-rl', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.conservative, opacity: 0.6 }}>Conservative</span>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark.textMuted, background: dark.surfaceLight, padding: '4px 10px', borderRadius: 6 }}>
                {(debate.geographicScope || 'national').toUpperCase()}
              </span>
              <span style={{ fontSize: 10, color: dark.textDim }}>{timeAgo(debate.createdAt)}</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.025em', color: '#FFFFFF', textAlign: 'center', margin: 0, marginBottom: 14, maxWidth: 480 }}>
              {debate.headline}
            </h2>

            <p style={{ fontSize: 14, lineHeight: 1.55, color: dark.textMuted, textAlign: 'center', margin: 0, maxWidth: 400 }}>
              {context}
            </p>
          </div>
        </div>

        {/* ── CONSERVATIVE (right) ── */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: '24px 48px', boxSizing: 'border-box',
            background: `radial-gradient(ellipse at 70% 50%, rgba(193,18,31,0.12) 0%, ${dark.surface} 60%, #1a0808 100%)`,
            boxShadow: 'inset 0 0 160px rgba(193,18,31,0.15)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: colors.conservative, background: 'rgba(193,18,31,0.18)', padding: '5px 16px', borderRadius: 999, marginBottom: 20, textTransform: 'uppercase' }}>
              Conservative
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.02em', color: '#FFFFFF', textAlign: 'center', margin: 0, marginBottom: 14, maxWidth: 460 }}>
              {con}
            </h2>
            {conDetail && (
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.55)', textAlign: 'center', margin: 0, maxWidth: 400 }}>
                {conDetail}
              </p>
            )}
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

      {/* ═══ Vote + Actions ═══ */}
      <div style={{
        padding: '12px 16px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        background: dark.bg, flexShrink: 0,
      }}>
        {/* Vote */}
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: dark.textMuted, marginBottom: 8 }}>
            Where do you lean?
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={() => handleVote('liberal')}
              style={voteBtn(colors.liberal, voted === 'liberal')}
            >
              {voted === 'liberal' ? '← Leaning liberal' : 'Liberal'}
            </button>
            <button
              onClick={() => handleVote('unsure')}
              style={voteBtn('#444', voted === 'unsure', true)}
            >
              {voted === 'unsure' ? 'Not sure' : 'Not sure'}
            </button>
            <button
              onClick={() => handleVote('conservative')}
              style={voteBtn(colors.conservative, voted === 'conservative')}
            >
              {voted === 'conservative' ? 'Leaning right →' : 'Conservative'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderTop: `1px solid ${dark.border}`, paddingTop: 10 }}>
          <ActionIcon label="Comment" icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />
          <ActionIcon label={copied ? 'Copied!' : 'Share'} onClick={handleShare} icon={<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></>} />
          <a
            href={`/debate/${debate.slug || debate.id}`}
            style={{
              fontSize: 12, fontWeight: 600, color: dark.textMuted,
              textDecoration: 'none', letterSpacing: '0.02em', padding: '4px 0',
            }}
          >
            Read full debate &rarr;
          </a>
        </div>
      </div>

      <style>{`
        .stage-hscroll::-webkit-scrollbar { display: none; }
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

function voteBtn(bg: string, selected?: boolean, outline?: boolean): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 999,
    border: outline && !selected ? '1px solid rgba(255,255,255,0.2)' : 'none',
    background: selected ? bg : (outline ? 'transparent' : `${bg}88`),
    color: '#FFFFFF', fontSize: 10, fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.04em', textTransform: 'uppercase',
    transition: 'all 120ms ease',
    opacity: selected ? 1 : 0.7,
    boxShadow: selected ? `0 0 12px ${bg}44` : 'none',
  }
}

function ActionIcon({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      color: dark.textDim, fontSize: 9, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 6px',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
      {label}
    </button>
  )
}
