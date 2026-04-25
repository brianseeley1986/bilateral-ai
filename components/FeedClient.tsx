'use client'
import { FeedCard } from '@/components/FeedCard'
import { colors, dark } from '@/lib/design'
import type { DebateCardData } from '@/components/DebateSwipeCard'

interface FeedClientProps {
  debates: DebateCardData[]
}

export function FeedClient({ debates }: FeedClientProps) {
  if (debates.length === 0) {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: dark.bg,
          color: dark.textMuted,
          fontSize: 15,
        }}
      >
        No debates available yet.
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: dark.bg,
        overflow: 'hidden',
      }}
    >
      {/* Minimal chrome — logo + close */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          pointerEvents: 'none',
        }}
      >
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.conservative }} />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            bilateral
          </span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.liberal }} />
        </a>
        <a
          href="/"
          aria-label="Close feed"
          style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 22,
            textDecoration: 'none',
            pointerEvents: 'auto',
            padding: '4px 8px',
          }}
        >
          &times;
        </a>
      </div>

      {/* Vertical snap feed */}
      <div
        className="feed-vertical"
        style={{
          height: '100dvh',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        <style>{`
          .feed-vertical::-webkit-scrollbar { display: none; }
          .feed-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        {debates.map((debate, i) => (
          <FeedCard
            key={debate.id}
            debate={debate}
            index={i}
            total={debates.length}
          />
        ))}
      </div>
    </div>
  )
}
