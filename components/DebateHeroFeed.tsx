'use client'
import { useRef, useState, useCallback } from 'react'
import { DebateSwipeCard } from '@/components/DebateSwipeCard'
import type { DebateCardData } from '@/components/DebateSwipeCard'
import { dark } from '@/lib/design'

interface DebateHeroFeedProps {
  debates: DebateCardData[]
}

export function DebateHeroFeed({ debates }: DebateHeroFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null)
  const [activeDebate, setActiveDebate] = useState(0)

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return
    const children = feedRef.current.children
    const scrollTop = feedRef.current.scrollTop
    const containerHeight = feedRef.current.offsetHeight

    let closest = 0
    let minDist = Infinity
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement
      const dist = Math.abs(child.offsetTop - scrollTop - containerHeight * 0.1)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    }
    if (closest !== activeDebate) setActiveDebate(closest)
  }, [activeDebate])

  if (debates.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical progress bar */}
      <div
        style={{
          position: 'absolute',
          right: -20,
          top: 20,
          bottom: 20,
          width: 3,
          background: dark.border,
          borderRadius: 2,
          zIndex: 2,
          display: debates.length > 1 ? 'block' : 'none',
        }}
      >
        <div
          style={{
            width: 3,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.4)',
            transition: 'all 300ms ease',
            position: 'absolute',
            top: `${(activeDebate / debates.length) * 100}%`,
            height: `${(1 / debates.length) * 100}%`,
          }}
        />
      </div>

      {/* Feed container */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          paddingBottom: 20,
        }}
      >
        {debates.map((debate, i) => (
          <DebateSwipeCard
            key={debate.id}
            debate={debate}
            index={i}
            total={debates.length}
            isVisible={Math.abs(i - activeDebate) <= 1}
          />
        ))}
      </div>

      {/* Bottom scroll cue */}
      {debates.length > 1 && activeDebate < debates.length - 1 && (
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0 0',
          }}
        >
          <span style={{ fontSize: 11, color: dark.textDim, letterSpacing: '0.06em' }}>
            ↓ Scroll for more debates
          </span>
        </div>
      )}
    </div>
  )
}
