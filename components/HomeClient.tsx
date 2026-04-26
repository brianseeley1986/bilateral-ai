'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { HeadlineInput } from '@/components/HeadlineInput'
import { SubscribeBlock } from '@/components/SubscribeBlock'
import { DebateStage } from '@/components/DebateStage'
import { dark, colors } from '@/lib/design'
import type { ZoneData, LibraryFeatured } from '@/lib/zones'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return text.slice(0, cut > 0 ? cut : max) + '...'
}

/* ═══ HERO CONTAINER — self-contained vertical scroll ═══ */

function HeroContainer({ debates }: { debates: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const h = containerRef.current.offsetHeight
    const idx = Math.round(containerRef.current.scrollTop / h)
    if (idx !== activeIndex) setActiveIndex(idx)
  }, [activeIndex])

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="hero-vscroll"
        style={{
          height: '80vh',
          maxHeight: 680,
          minHeight: 480,
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          borderRadius: 20,
          background: dark.bg,
          overscrollBehavior: 'contain',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        <style>{`.hero-vscroll::-webkit-scrollbar { display: none; }`}</style>
        {debates.map((d, i) => (
          <div key={d.id} style={{ height: '100%', scrollSnapAlign: 'start' }}>
            <DebateStage debate={d} showNextCue={i < debates.length - 1} />
          </div>
        ))}
      </div>

      {/* Vertical progress — right edge */}
      {debates.length > 1 && (
        <div style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 6, zIndex: 20,
        }}>
          {debates.map((_, i) => (
            <div key={i} style={{
              width: 3, height: activeIndex === i ? 16 : 4, borderRadius: 2,
              background: activeIndex === i ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)',
              transition: 'all 200ms ease',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══ EDITORIAL ROW ═══ */

function EditorialRow({ debate }: { debate: any }) {
  const con = truncate(debate.conservativeOneLine || debate.conservativeFeedHook || '', 65)
  const lib = truncate(debate.liberalOneLine || debate.liberalFeedHook || '', 65)

  return (
    <a href={`/debate/${debate.slug || debate.id}`} style={{
      display: 'grid', gridTemplateColumns: '72px 1fr', gap: 14,
      textDecoration: 'none', color: 'inherit', padding: '16px 0',
      borderBottom: '1px solid #F0F0F0',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(27,79,190,0.12) 0%, #1a1a1a 40%, #1a1a1a 60%, rgba(193,18,31,0.12) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: 2, background: colors.liberal, opacity: 0.5 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: 2, background: colors.conservative, opacity: 0.5 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: '#BBB', fontWeight: 500 }}>{timeAgo(debate.createdAt)}</span>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em', color: '#0A0A0A' }}>
          {debate.headline}
        </div>
        {(con || lib) && (
          <div style={{ display: 'flex', gap: 10 }}>
            {con && <div style={{ flex: 1, fontSize: 11, lineHeight: 1.35, color: '#888', borderLeft: `2px solid ${colors.conservative}`, paddingLeft: 6 }}>{con}</div>}
            {lib && <div style={{ flex: 1, fontSize: 11, lineHeight: 1.35, color: '#888', borderLeft: `2px solid ${colors.liberal}`, paddingLeft: 6 }}>{lib}</div>}
          </div>
        )}
      </div>
    </a>
  )
}

const FAULT_LINES = [
  'Immigration', 'Climate', 'Gun Rights', 'Education',
  'Healthcare', 'Taxes', 'Free Speech', 'Abortion',
  'National Security', 'Economics', 'Crime', 'Rights & Society',
]

/* ═══════════════════ MAIN ═══════════════════ */

export function HomeClient({
  zones,
}: {
  zones: ZoneData
  library?: LibraryFeatured[]
}) {
  const [urlMessage, setUrlMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('confirmed') === 'true') setUrlMessage('Confirmed! Your first digest arrives tomorrow morning.')
    if (params.get('unsubscribed') === 'true') setUrlMessage("Unsubscribed. We\u2019ll miss you.")
  }, [])

  const allDebates = [...zones.national, ...zones.international]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const heroDebates = allDebates.slice(0, Math.min(4, allDebates.length))
  const todaysDebates = allDebates.slice(heroDebates.length)

  return (
    <>
      {/* ═══ DARK HERO — full width ═══ */}
      <section style={{ background: dark.bg }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', height: 64, boxSizing: 'border-box',
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.conservative }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF' }}>bilateral</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.liberal }} />
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/debates" style={{ fontSize: 12, color: dark.textMuted, textDecoration: 'none', fontWeight: 500 }}>Debates</a>
            <a href="/about" style={{ fontSize: 12, color: dark.textMuted, textDecoration: 'none', fontWeight: 500 }}>About</a>
            <a href="/feed" style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#FFFFFF', background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)', padding: '6px 14px',
              borderRadius: 999, textDecoration: 'none',
            }}>Start the feed &rarr;</a>
          </nav>
        </header>

        {urlMessage && (
          <div style={{ maxWidth: 600, margin: '0 auto 0', background: '#166534', border: '1px solid #22c55e', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#FFFFFF', textAlign: 'center' }}>
            {urlMessage}
          </div>
        )}

        {/* Hero — contained preview stage */}
        {heroDebates.length > 0 && (
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
            <HeroContainer debates={heroDebates} />
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '28px 20px 40px', background: dark.bg }}>
          <a href="/feed" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
            color: '#FFFFFF', background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            padding: '14px 36px', borderRadius: 999, textDecoration: 'none',
          }}>
            Continue in the full feed &rarr;
          </a>
        </div>
      </section>

      {/* ═══ LIGHT SECTIONS ═══ */}
      <section style={{ background: '#FFFFFF', padding: '48px 20px 0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <SubscribeBlock />

          {todaysDebates.length > 0 && (
            <div style={{ marginBottom: 56 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0 }}>Today&apos;s debates</h2>
                <a href="/debates" style={{ fontSize: 12, fontWeight: 600, color: '#999', textDecoration: 'none' }}>View all</a>
              </div>
              <p style={{ fontSize: 13, color: '#BBB', margin: 0, marginBottom: 8 }}>The debates the country is having right now.</p>
              <div>{todaysDebates.slice(0, 5).map((d) => <EditorialRow key={d.id} debate={d} />)}</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, marginBottom: 56 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0 }}>From readers</h2>
                <a href="/debates/readers" style={{ fontSize: 12, fontWeight: 600, color: '#999', textDecoration: 'none' }}>View all</a>
              </div>
              {zones.userSubmitted.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {zones.userSubmitted.slice(0, 5).map((d) => (
                    <a key={d.id} href={`/debate/${d.slug || d.id}`} style={{ display: 'block', textDecoration: 'none', color: '#0A0A0A', fontSize: 14, lineHeight: 1.4, padding: '11px 0', borderBottom: '1px solid #F0F0F0' }}>
                      {d.headline}
                    </a>
                  ))}
                </div>
              ) : <p style={{ fontSize: 13, color: '#999' }}>No reader submissions yet.</p>}
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0, marginBottom: 16 }}>The Fault Lines</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {FAULT_LINES.map((topic) => (
                  <a key={topic} href={`/debates?topic=${encodeURIComponent(topic.toLowerCase())}`} style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', background: '#F5F5F0', border: '1px solid #E8E8E4', borderRadius: 999, padding: '8px 16px', textDecoration: 'none' }}>
                    {topic}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div id="submit" style={{ marginBottom: 48 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0, marginBottom: 4 }}>Start a debate</h3>
            <p style={{ fontSize: 13, color: '#999', margin: 0, marginBottom: 16 }}>Drop any headline. We&apos;ll build both sides.</p>
            <HeadlineInput />
          </div>

          <div style={{ textAlign: 'center', padding: '36px 24px', marginBottom: 48, background: '#F5F5F0', borderRadius: 16 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: '#0A0A0A', letterSpacing: '-0.015em', marginBottom: 6 }}>Ready to see both sides?</div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Jump into the feed and explore debates that challenge your perspective.</div>
            <a href="/feed" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: '#F5F5F0', background: '#0A0A0A', padding: '13px 30px', borderRadius: 999, textDecoration: 'none' }}>
              Start the feed &rarr;
            </a>
          </div>

          <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 24, paddingBottom: 32, fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 1.8 }}>
            bilateral.news — two sides, every debate<br />AI-powered. Editorially neutral. Intellectually honest.
          </div>
        </div>
      </section>
    </>
  )
}
