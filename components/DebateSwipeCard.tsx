'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { PerspectivePanel } from '@/components/PerspectivePanel'
import { DebateActionBar } from '@/components/DebateActionBar'
import { dark } from '@/lib/design'

export interface DebateCardData {
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
}

interface DebateSwipeCardProps {
  debate: DebateCardData
  index: number
  total: number
  isVisible: boolean
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

function scopeLabel(scope?: string): string {
  if (!scope) return 'NATIONAL'
  return scope.toUpperCase()
}

export function DebateSwipeCard({ debate, index, total }: DebateSwipeCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activePanel, setActivePanel] = useState(0) // 0=liberal, 1=neutral, 2=conservative

  // Scroll to neutral (center) on mount
  useEffect(() => {
    if (scrollRef.current) {
      const panelWidth = scrollRef.current.offsetWidth
      scrollRef.current.scrollLeft = panelWidth // Start at center (neutral)
      setActivePanel(1)
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const panelWidth = scrollRef.current.offsetWidth
    const scrollPos = scrollRef.current.scrollLeft
    const newPanel = Math.round(scrollPos / panelWidth)
    if (newPanel !== activePanel) {
      setActivePanel(newPanel)
    }
  }, [activePanel])

  function scrollToPanel(panel: number) {
    if (!scrollRef.current) return
    const panelWidth = scrollRef.current.offsetWidth
    scrollRef.current.scrollTo({ left: panelWidth * panel, behavior: 'smooth' })
  }

  const neutralSummary = debate.whatHappened || debate.suggestedHook || ''
  const neutralDetail = debate.whyItMatters || ''

  const conSummary = debate.conservativeOneLine || debate.conservativeFeedHook || ''
  const libSummary = debate.liberalOneLine || debate.liberalFeedHook || ''

  const conDetail = debate.conservativeArgument || debate.conservativeFeedHook || null
  const libDetail = debate.liberalArgument || debate.liberalFeedHook || null

  // Panel order: Liberal (left) | Neutral (center) | Conservative (right)
  // This way swiping left reveals liberal, swiping right reveals conservative
  const panels = [
    { type: 'liberal' as const, summary: libSummary, detail: libDetail },
    { type: 'neutral' as const, summary: neutralSummary, detail: neutralDetail },
    { type: 'conservative' as const, summary: conSummary, detail: conDetail },
  ]

  return (
    <div
      style={{
        background: dark.bg,
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      {/* Progress indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 0',
          background: dark.bg,
        }}
      >
        <span style={{ fontSize: 11, color: dark.textDim, fontWeight: 600, letterSpacing: '0.05em' }}>
          {index + 1} / {total}
        </span>
        {/* Dot indicators for panel position */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {panels.map((p, i) => (
            <button
              key={p.type}
              onClick={() => scrollToPanel(i)}
              aria-label={`Go to ${p.type} view`}
              style={{
                width: activePanel === i ? 20 : 6,
                height: 6,
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 200ms ease',
                background:
                  i === 0 ? (activePanel === 0 ? '#1B4FBE' : '#333')
                  : i === 2 ? (activePanel === 2 ? '#C1121F' : '#333')
                  : (activePanel === 1 ? '#FFFFFF' : '#333'),
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 10, color: dark.textDim, fontWeight: 500, minWidth: 50, textAlign: 'right' }}>
          {timeAgo(debate.createdAt)}
        </span>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          minHeight: 380,
        }}
      >
        <style>{`
          .swipe-container::-webkit-scrollbar { display: none; }
        `}</style>
        {panels.map((panel, i) => (
          <div
            key={panel.type}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'center',
            }}
          >
            <PerspectivePanel
              type={panel.type}
              headline={debate.headline}
              summary={panel.summary}
              detail={panel.detail}
              category={panel.type === 'neutral' ? scopeLabel(debate.geographicScope) : undefined}
              timeAgo={panel.type === 'neutral' ? timeAgo(debate.createdAt) : undefined}
              isActive={activePanel === i}
            />
          </div>
        ))}
      </div>

      {/* Swipe instruction — only on neutral */}
      {activePanel === 1 && (
        <div
          style={{
            textAlign: 'center',
            padding: '8px 0',
            background: dark.bg,
          }}
        >
          <span style={{ fontSize: 10, color: dark.textDim, letterSpacing: '0.06em' }}>
            Swipe to explore both sides
          </span>
        </div>
      )}

      {/* Action bar */}
      <DebateActionBar
        debateId={debate.id}
        headline={debate.headline}
        slug={debate.slug}
      />
    </div>
  )
}
