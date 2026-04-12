'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface FeedCard {
  id: string
  headline: string
  track: 'serious' | 'local' | 'satire'
  sourceType?: string
  geographicScope?: string
  createdAt: string
  conservativeOneLine: string
  liberalOneLine: string
  suggestedHook: string
}

function resolveBadge(
  track: string,
  sourceType?: string,
  geoScope?: string,
): { label: string; bg: string; text: string } {
  if (track === 'satire') return { label: 'SATIRE', bg: '#fef3c7', text: '#b45309' }
  if (track === 'local' || geoScope === 'local') return { label: 'LOCAL', bg: '#dbeafe', text: '#1B4FBE' }
  if (sourceType === 'trending' || sourceType === 'rss') return { label: 'BREAKING', bg: '#fee2e2', text: '#C1121F' }
  return { label: 'ANALYSIS', bg: '#f1f1ef', text: '#444444' }
}

function timeSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function NewsFeed() {
  const [cards, setCards] = useState<FeedCard[]>([])
  const [pulse, setPulse] = useState(false)
  const prevIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch('/api/debate?feed=true', { cache: 'no-store' })
        if (!res.ok) return
        const data: FeedCard[] = await res.json()
        if (cancelled) return

        const current = new Set(data.map((c) => c.id))
        const hasNew =
          prevIds.current.size > 0 &&
          data.some((c) => !prevIds.current.has(c.id))
        prevIds.current = current

        setCards(data)
        if (hasNew) {
          setPulse(true)
          setTimeout(() => setPulse(false), 2500)
        }
      } catch {}
    }

    load()
    const t = setInterval(load, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  return (
    <div style={{ maxWidth: '720px', margin: '56px auto 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px',
          fontSize: '11px',
          color: '#6B6B6B',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: pulse ? '#16a34a' : '#C1121F',
            boxShadow: pulse ? '0 0 0 5px rgba(22,163,74,0.18)' : 'none',
            transition: 'all 0.3s',
          }}
        />
        Live feed
      </div>

      {cards.length === 0 ? (
        <div
          style={{
            fontSize: '13px',
            color: '#6B6B6B',
            padding: '32px 0',
            textAlign: 'center',
            borderTop: '0.5px solid #d0d0d0',
            borderBottom: '0.5px solid #d0d0d0',
          }}
        >
          No stories in the feed yet. Drop a headline above to start one.
        </div>
      ) : (
        <div style={{ borderTop: '0.5px solid #d0d0d0' }}>
          {cards.map((card) => {
            const normalizedTrack = (card.track?.toLowerCase() || 'serious') as FeedCard['track']
            const b = resolveBadge(normalizedTrack, card.sourceType, card.geographicScope)
            const isSatire = normalizedTrack === 'satire'
            return (
              <div
                key={card.id}
                style={{
                  padding: '20px 18px',
                  borderBottom: '0.5px solid #d0d0d0',
                  background: isSatire ? '#fffbf5' : 'transparent',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      background: b.bg,
                      color: b.text,
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '3px',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {b.label}
                  </span>
                  <span style={{ fontSize: '11px', color: '#6B6B6B' }}>
                    {timeSince(card.createdAt)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: '#0A0A0A',
                    marginBottom: '12px',
                  }}
                >
                  {card.headline}
                </div>
                {card.conservativeOneLine && (
                  <div
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.55,
                      color: '#C1121F',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: '6px' }}>C</span>
                    {card.conservativeOneLine}
                  </div>
                )}
                {card.liberalOneLine && (
                  <div
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.55,
                      color: '#1B4FBE',
                      marginBottom: '14px',
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: '6px' }}>L</span>
                    {card.liberalOneLine}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link
                    href={`/debate/${card.id}`}
                    style={{
                      fontSize: '12px',
                      color: '#0A0A0A',
                      textDecoration: 'none',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Go Deeper →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
