'use client'
import { DebateStage } from '@/components/DebateStage'
import type { StageDebate } from '@/components/DebateStage'
import { colors, dark } from '@/lib/design'

interface FeedClientProps {
  debates: StageDebate[]
}

export function FeedClient({ debates }: FeedClientProps) {
  if (debates.length === 0) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark.bg, color: dark.textMuted, fontSize: 15 }}>
        No debates available yet.
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: dark.bg, overflow: 'hidden' }}>
      {/* Header — same visual language as homepage */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', height: 48, boxSizing: 'border-box',
        background: 'linear-gradient(to bottom, rgba(10,10,10,0.9), transparent)',
        pointerEvents: 'none',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', pointerEvents: 'auto' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.conservative }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.6)' }}>bilateral</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.liberal }} />
        </a>
        <a href="/" aria-label="Back to home" style={{
          color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          textDecoration: 'none', pointerEvents: 'auto', padding: '4px 8px',
        }}>
          &times; Close
        </a>
      </div>

      {/* Vertical snap feed — same DebateStage as homepage */}
      <div className="feed-vertical" style={{
        height: '100dvh', overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        <style>{`
          .feed-vertical::-webkit-scrollbar { display: none; }
        `}</style>
        {debates.map((debate, i) => (
          <div key={debate.id} style={{ height: '100dvh', scrollSnapAlign: 'start' }}>
            <DebateStage debate={debate} showNextCue={i < debates.length - 1} />
          </div>
        ))}
      </div>
    </div>
  )
}
