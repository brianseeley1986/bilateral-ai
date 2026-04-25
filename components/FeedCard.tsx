'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { ResolutionPanel } from '@/components/ResolutionPanel'
import { colors, dark } from '@/lib/design'
import type { DebateCardData } from '@/components/DebateSwipeCard'

interface FeedCardProps {
  debate: DebateCardData
  index: number
  total: number
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return text.slice(0, cut > 0 ? cut : max) + '...'
}

export function FeedCard({ debate, index, total }: FeedCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activePanel, setActivePanel] = useState(1) // 0=liberal, 1=neutral, 2=conservative
  const [visitedPanels, setVisitedPanels] = useState<Set<number>>(new Set([1]))
  const [showResolution, setShowResolution] = useState(false)

  // Scroll to neutral (center) on mount
  useEffect(() => {
    if (scrollRef.current) {
      const w = scrollRef.current.offsetWidth
      scrollRef.current.scrollLeft = w
    }
  }, [])

  // Track which panels have been seen — trigger resolution after viewing both sides
  useEffect(() => {
    const next = new Set(visitedPanels)
    next.add(activePanel)
    if (next.size !== visitedPanels.size) {
      setVisitedPanels(next)
    }
    // If user has seen all three panels, auto-trigger resolution after a brief pause
    if (next.has(0) && next.has(2) && !showResolution) {
      const timer = setTimeout(() => setShowResolution(true), 600)
      return () => clearTimeout(timer)
    }
  }, [activePanel]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const w = scrollRef.current.offsetWidth
    const newPanel = Math.round(scrollRef.current.scrollLeft / w)
    if (newPanel !== activePanel) setActivePanel(newPanel)
  }, [activePanel])

  function scrollToPanel(p: number) {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ left: scrollRef.current.offsetWidth * p, behavior: 'smooth' })
  }

  const neutralContext = debate.whatHappened
    ? truncate(debate.whatHappened, 120)
    : debate.suggestedHook || ''

  const conSummary = debate.conservativeOneLine || debate.conservativeFeedHook || ''
  const libSummary = debate.liberalOneLine || debate.liberalFeedHook || ''
  const conDetail = debate.conservativeArgument ? truncate(debate.conservativeArgument, 200) : null
  const libDetail = debate.liberalArgument ? truncate(debate.liberalArgument, 200) : null

  return (
    <div
      style={{
        height: '100dvh',
        width: '100%',
        scrollSnapAlign: 'start',
        position: 'relative',
        background: dark.bg,
        overflow: 'hidden',
      }}
    >
      {/* Resolution overlay */}
      {showResolution && (
        <ResolutionPanel
          debateId={debate.id}
          headline={debate.headline}
          slug={debate.slug}
          onClose={() => setShowResolution(false)}
        />
      )}

      {/* Top bar — progress + dots */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.8), transparent)',
        }}
      >
        <span style={{ fontSize: 11, color: dark.textDim, fontWeight: 600, letterSpacing: '0.05em' }}>
          {index + 1} / {total}
        </span>

        {/* Panel dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => scrollToPanel(i)}
              aria-label={i === 0 ? 'Liberal' : i === 1 ? 'Neutral' : 'Conservative'}
              style={{
                width: activePanel === i ? 18 : 6,
                height: 6,
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 200ms ease',
                background:
                  i === 0 ? (activePanel === 0 ? colors.liberal : '#333')
                  : i === 2 ? (activePanel === 2 ? colors.conservative : '#333')
                  : (activePanel === 1 ? '#FFFFFF' : '#333'),
              }}
            />
          ))}
        </div>

        {/* Vote trigger */}
        <button
          onClick={() => setShowResolution(true)}
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: dark.textMuted,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '4px 12px',
            borderRadius: 999,
            cursor: 'pointer',
          }}
        >
          Vote
        </button>
      </div>

      {/* Horizontal scroll — 3 panels */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="feed-scroll"
        style={{
          display: 'flex',
          height: '100%',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {/* ───── LIBERAL (left) ───── */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '60px 32px 80px',
              boxSizing: 'border-box',
              background: dark.surface,
              boxShadow: `inset 0 0 80px ${dark.glowBlue}`,
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: colors.liberal,
                background: 'rgba(27,79,190,0.15)',
                padding: '5px 16px',
                borderRadius: 999,
                marginBottom: 24,
                textTransform: 'uppercase',
              }}
            >
              Liberal
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 26,
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                color: colors.liberal,
                textAlign: 'center',
                margin: 0,
                marginBottom: 18,
                maxWidth: 480,
              }}
            >
              {libSummary}
            </h2>
            {libDetail && (
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: dark.textMuted,
                  textAlign: 'center',
                  margin: 0,
                  maxWidth: 420,
                }}
              >
                {libDetail}
              </p>
            )}

            {/* Right edge cue → neutral */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 40,
                background: 'linear-gradient(to left, rgba(255,255,255,0.04), transparent)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* ───── NEUTRAL (center) ───── */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '60px 32px 80px',
              boxSizing: 'border-box',
              background: dark.bg,
              position: 'relative',
            }}
          >
            {/* Category */}
            {debate.geographicScope && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: dark.textMuted,
                  background: dark.surfaceLight,
                  padding: '4px 12px',
                  borderRadius: 6,
                  marginBottom: 18,
                }}
              >
                {debate.geographicScope.toUpperCase()}
              </span>
            )}

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 32,
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                color: '#FFFFFF',
                textAlign: 'center',
                margin: 0,
                marginBottom: 18,
                maxWidth: 520,
              }}
            >
              {debate.headline}
            </h2>

            <p
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: dark.textMuted,
                textAlign: 'center',
                margin: 0,
                maxWidth: 420,
              }}
            >
              {neutralContext}
            </p>

            {/* Left edge — blue cue */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '30%',
                bottom: '30%',
                width: 4,
                borderRadius: 2,
                background: `linear-gradient(to bottom, transparent, ${colors.liberal}, transparent)`,
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            />

            {/* Right edge — red cue */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '30%',
                bottom: '30%',
                width: 4,
                borderRadius: 2,
                background: `linear-gradient(to bottom, transparent, ${colors.conservative}, transparent)`,
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* ───── CONSERVATIVE (right) ───── */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '60px 32px 80px',
              boxSizing: 'border-box',
              background: dark.surface,
              boxShadow: `inset 0 0 80px ${dark.glowRed}`,
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: colors.conservative,
                background: 'rgba(193,18,31,0.15)',
                padding: '5px 16px',
                borderRadius: 999,
                marginBottom: 24,
                textTransform: 'uppercase',
              }}
            >
              Conservative
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 26,
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                color: colors.conservative,
                textAlign: 'center',
                margin: 0,
                marginBottom: 18,
                maxWidth: 480,
              }}
            >
              {conSummary}
            </h2>
            {conDetail && (
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: dark.textMuted,
                  textAlign: 'center',
                  margin: 0,
                  maxWidth: 420,
                }}
              >
                {conDetail}
              </p>
            )}

            {/* Left edge cue → neutral */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 40,
                background: 'linear-gradient(to right, rgba(255,255,255,0.04), transparent)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '12px 20px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, rgba(10,10,10,0.9), rgba(10,10,10,0.5), transparent)',
        }}
      >
        <FeedActionButton
          icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />}
          label="Comment"
        />
        <FeedActionButton
          icon={<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></>}
          label="Share"
          onClick={() => {
            const url = `https://bilateral.news/debate/${debate.slug || debate.id}`
            if (navigator.share) {
              navigator.share({ title: debate.headline, url }).catch(() => {})
            } else {
              navigator.clipboard.writeText(url)
            }
          }}
        />
        <a
          href={`/debate/${debate.slug || debate.id}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: dark.textDim,
            textDecoration: 'none',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Read
        </a>
      </div>
    </div>
  )
}

function FeedActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        color: dark.textDim,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icon}
      </svg>
      {label}
    </button>
  )
}
