'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { HeadlineInput } from '@/components/HeadlineInput'
import { SubscribeBlock } from '@/components/SubscribeBlock'
import { dark, colors } from '@/lib/design'
import type { ZoneData, LibraryFeatured } from '@/lib/zones'

/* ─── helpers ─── */

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

/* ─── single debate inside the hero container ─── */

function HeroDebate({ debate }: { debate: any }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activePanel, setActivePanel] = useState(1) // 0=liberal, 1=neutral, 2=conservative

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.offsetWidth
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const w = scrollRef.current.offsetWidth
    const p = Math.round(scrollRef.current.scrollLeft / w)
    if (p !== activePanel) setActivePanel(p)
  }, [activePanel])

  function scrollTo(p: number) {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ left: scrollRef.current.offsetWidth * p, behavior: 'smooth' })
  }

  const neutralContext = debate.whatHappened
    ? truncate(debate.whatHappened, 140)
    : debate.suggestedHook || ''
  const neutralDetail = debate.whyItMatters ? truncate(debate.whyItMatters, 100) : ''
  const conSummary = debate.conservativeOneLine || debate.conservativeFeedHook || ''
  const libSummary = debate.liberalOneLine || debate.liberalFeedHook || ''

  return (
    <div
      style={{
        height: '100%',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Horizontal panels */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="hero-hscroll"
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {/* LIBERAL (left) */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center' }}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 32px',
              boxSizing: 'border-box',
              background: dark.surface,
              boxShadow: `inset 0 0 70px ${dark.glowBlue}`,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: colors.liberal, background: 'rgba(27,79,190,0.15)', padding: '4px 14px', borderRadius: 999, marginBottom: 20, textTransform: 'uppercase' }}>
              Liberal
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', color: colors.liberal, textAlign: 'center', margin: 0, maxWidth: 460 }}>
              {libSummary}
            </h2>
          </div>
        </div>

        {/* NEUTRAL (center) */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center' }}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 32px',
              boxSizing: 'border-box',
              background: dark.bg,
              position: 'relative',
            }}
          >
            {/* Scope badge */}
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark.textMuted, background: dark.surfaceLight, padding: '4px 12px', borderRadius: 6, marginBottom: 16 }}>
              {(debate.geographicScope || 'national').toUpperCase()}
            </span>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.025em', color: '#FFFFFF', textAlign: 'center', margin: 0, marginBottom: 14, maxWidth: 480 }}>
              {debate.headline}
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: dark.textMuted, textAlign: 'center', margin: 0, maxWidth: 400 }}>
              {neutralContext}
            </p>
            {neutralDetail && (
              <p style={{ fontSize: 13, lineHeight: 1.5, color: dark.textDim, textAlign: 'center', margin: 0, marginTop: 6, maxWidth: 400 }}>
                {neutralDetail}
              </p>
            )}

            {/* Edge cues */}
            <div style={{ position: 'absolute', left: 0, top: '30%', bottom: '30%', width: 3, borderRadius: 2, background: `linear-gradient(to bottom, transparent, ${colors.liberal}, transparent)`, opacity: 0.5, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 0, top: '30%', bottom: '30%', width: 3, borderRadius: 2, background: `linear-gradient(to bottom, transparent, ${colors.conservative}, transparent)`, opacity: 0.5, pointerEvents: 'none' }} />
          </div>
        </div>

        {/* CONSERVATIVE (right) */}
        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center' }}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 32px',
              boxSizing: 'border-box',
              background: dark.surface,
              boxShadow: `inset 0 0 70px ${dark.glowRed}`,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: colors.conservative, background: 'rgba(193,18,31,0.15)', padding: '4px 14px', borderRadius: 999, marginBottom: 20, textTransform: 'uppercase' }}>
              Conservative
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', color: colors.conservative, textAlign: 'center', margin: 0, maxWidth: 460 }}>
              {conSummary}
            </h2>
          </div>
        </div>
      </div>

      {/* Swipe hint + time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px', background: dark.bg }}>
        <span style={{ fontSize: 10, color: dark.textDim }}>
          {timeAgo(debate.createdAt)}
        </span>
        <span style={{ fontSize: 10, color: dark.textDim, letterSpacing: '0.06em' }}>
          Swipe to explore both sides
        </span>
      </div>

      {/* Bottom tabs */}
      <div
        style={{
          display: 'flex',
          borderTop: `1px solid ${dark.border}`,
          background: dark.surface,
          flexShrink: 0,
        }}
      >
        <button onClick={() => scrollTo(2)} style={tabStyle(activePanel === 2, colors.conservative)}>
          Conservative
        </button>
        <button onClick={() => scrollTo(1)} style={tabStyle(activePanel === 1, '#FFFFFF')}>
          Neutral
        </button>
        <button onClick={() => scrollTo(0)} style={tabStyle(activePanel === 0, colors.liberal)}>
          Liberal
        </button>
      </div>
    </div>
  )
}

function tabStyle(active: boolean, color: string): React.CSSProperties {
  return {
    flex: 1,
    padding: '12px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: active ? color : dark.textDim,
    borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
    transition: 'all 150ms ease',
  }
}

/* ─── editorial debate row ─── */

function EditorialRow({ debate }: { debate: any }) {
  const con = truncate(debate.conservativeOneLine || debate.conservativeFeedHook || '', 70)
  const lib = truncate(debate.liberalOneLine || debate.liberalFeedHook || '', 70)

  return (
    <a
      href={`/debate/${debate.slug || debate.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr',
        gap: 16,
        textDecoration: 'none',
        color: 'inherit',
        padding: '18px 0',
        borderBottom: '1px solid #EBEBEB',
      }}
    >
      {/* Thumbnail placeholder */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: 3, background: colors.liberal, opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: 3, background: colors.conservative, opacity: 0.6 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, color: '#999', fontWeight: 500 }}>
          {timeAgo(debate.createdAt)}
        </span>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em', color: '#0A0A0A' }}>
          {debate.headline}
        </div>
        {(con || lib) && (
          <div style={{ display: 'flex', gap: 12 }}>
            {con && (
              <div style={{ flex: 1, fontSize: 11, lineHeight: 1.4, color: '#666', borderLeft: `2px solid ${colors.conservative}`, paddingLeft: 7 }}>
                {con}
              </div>
            )}
            {lib && (
              <div style={{ flex: 1, fontSize: 11, lineHeight: 1.4, color: '#666', borderLeft: `2px solid ${colors.liberal}`, paddingLeft: 7 }}>
                {lib}
              </div>
            )}
          </div>
        )}
      </div>
    </a>
  )
}

/* ─── topic chips ─── */

const FAULT_LINES = [
  'Immigration', 'Climate', 'Gun Rights', 'Education',
  'Healthcare', 'Taxes', 'Free Speech', 'Abortion',
  'National Security', 'Economics', 'Crime', 'Rights & Society',
]

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */

export function HomeClient({
  zones,
}: {
  zones: ZoneData
  library?: LibraryFeatured[]
}) {
  const [urlMessage, setUrlMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('confirmed') === 'true') {
      setUrlMessage('Confirmed! Your first digest arrives tomorrow morning.')
    }
    if (params.get('unsubscribed') === 'true') {
      setUrlMessage("Unsubscribed. We\u2019ll miss you.")
    }
  }, [])

  const allDebates = [...zones.national, ...zones.international]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Hero container gets 3-5 debates
  const heroDebates = allDebates.slice(0, Math.min(5, allDebates.length))
  const todaysDebates = allDebates.slice(heroDebates.length)

  return (
    <>
      {/* ═══════ DARK HERO ═══════ */}
      <section style={{ background: dark.bg }}>

        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            maxWidth: 880,
            margin: '0 auto',
          }}
        >
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.conservative }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
              bilateral
            </span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.liberal }} />
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/debates" style={{ fontSize: 12, color: dark.textMuted, textDecoration: 'none', fontWeight: 500 }}>
              Debates
            </a>
            <a href="/about" style={{ fontSize: 12, color: dark.textMuted, textDecoration: 'none', fontWeight: 500 }}>
              About
            </a>
            <a
              href="/feed"
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '6px 14px',
                borderRadius: 999,
                textDecoration: 'none',
              }}
            >
              Start the feed &rarr;
            </a>
          </nav>
        </header>

        {/* URL message */}
        {urlMessage && (
          <div style={{ maxWidth: 600, margin: '0 auto 12px', background: '#166534', border: '1px solid #22c55e', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#FFFFFF', textAlign: 'center' }}>
            {urlMessage}
          </div>
        )}

        {/* ─── HERO SCROLL CONTAINER ─── */}
        {heroDebates.length > 0 && (
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>
            {/* Progress dots */}
            <HeroContainer debates={heroDebates} />
          </div>
        )}

        {/* CTA → Feed */}
        <div style={{ textAlign: 'center', padding: '28px 20px 40px' }}>
          <a
            href="/feed"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: '#FFFFFF',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '14px 32px',
              borderRadius: 999,
              textDecoration: 'none',
              transition: 'all 150ms ease',
            }}
          >
            Start the full feed &rarr;
          </a>
        </div>
      </section>

      {/* ═══════ LIGHT SECTIONS ═══════ */}
      <section style={{ background: '#FFFFFF', padding: '48px 20px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <SubscribeBlock />

          {/* Today's debates — editorial */}
          {todaysDebates.length > 0 && (
            <div style={{ marginBottom: 56 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0 }}>
                  Today&apos;s debates
                </h2>
                <a href="/debates" style={{ fontSize: 12, fontWeight: 600, color: '#999', textDecoration: 'none' }}>
                  View all
                </a>
              </div>
              <p style={{ fontSize: 13, color: '#999', margin: 0, marginBottom: 8 }}>
                The debates the country is having right now.
              </p>
              <div>
                {todaysDebates.slice(0, 5).map((d) => (
                  <EditorialRow key={d.id} debate={d} />
                ))}
              </div>
            </div>
          )}

          {/* Two columns: readers + fault lines */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 40,
              marginBottom: 56,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0 }}>
                  From readers
                </h2>
                <a href="/debates/readers" style={{ fontSize: 12, fontWeight: 600, color: '#999', textDecoration: 'none' }}>
                  View all
                </a>
              </div>
              {zones.userSubmitted.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {zones.userSubmitted.slice(0, 5).map((d) => (
                    <a
                      key={d.id}
                      href={`/debate/${d.slug || d.id}`}
                      style={{
                        display: 'block',
                        textDecoration: 'none',
                        color: '#0A0A0A',
                        fontSize: 14,
                        lineHeight: 1.4,
                        padding: '12px 0',
                        borderBottom: '1px solid #F0F0F0',
                      }}
                    >
                      {d.headline}
                    </a>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#999' }}>No reader submissions yet.</p>
              )}
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0, marginBottom: 16 }}>
                The Fault Lines
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {FAULT_LINES.map((topic) => (
                  <a
                    key={topic}
                    href={`/debates?topic=${encodeURIComponent(topic.toLowerCase())}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#0A0A0A',
                      background: '#F5F5F0',
                      border: '1px solid #E8E8E4',
                      borderRadius: 999,
                      padding: '8px 16px',
                      textDecoration: 'none',
                    }}
                  >
                    {topic}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div id="submit" style={{ marginBottom: 48 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0, marginBottom: 4 }}>
              Start a debate
            </h3>
            <p style={{ fontSize: 13, color: '#999', margin: 0, marginBottom: 16 }}>
              Drop any headline. We&apos;ll build both sides.
            </p>
            <HeadlineInput />
          </div>

          {/* Final CTA */}
          <div
            style={{
              textAlign: 'center',
              padding: '36px 24px',
              marginBottom: 48,
              background: '#F5F5F0',
              borderRadius: 16,
            }}
          >
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, color: '#0A0A0A', letterSpacing: '-0.015em', marginBottom: 6 }}>
              Ready to see both sides?
            </div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>
              Jump into the feed and explore debates that challenge your perspective.
            </div>
            <a
              href="/feed"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#F5F5F0',
                background: '#0A0A0A',
                padding: '13px 30px',
                borderRadius: 999,
                textDecoration: 'none',
              }}
            >
              Start the feed &rarr;
            </a>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 24, paddingBottom: 32, fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 1.8 }}>
            bilateral.news — two sides, every debate
            <br />
            AI-powered. Editorially neutral. Intellectually honest.
          </div>
        </div>
      </section>
    </>
  )
}

/* ─── HERO CONTAINER — self-contained vertical scroll with 3-5 debates ─── */

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
    <div>
      {/* Progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: dark.textDim, fontWeight: 600, letterSpacing: '0.05em' }}>
          {activeIndex + 1} / {debates.length}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {debates.map((_, i) => (
            <div
              key={i}
              style={{
                width: activeIndex === i ? 16 : 6,
                height: 4,
                borderRadius: 2,
                background: activeIndex === i ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                transition: 'all 200ms ease',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 10, color: dark.textDim, letterSpacing: '0.06em' }}>
          ↓ scroll
        </span>
      </div>

      {/* Scroll container — 85vh window into the feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="hero-vscroll"
        style={{
          height: '75vh',
          maxHeight: 600,
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          background: dark.bg,
          overscrollBehavior: 'contain',
        }}
      >
        <style>{`
          .hero-vscroll::-webkit-scrollbar { display: none; }
          .hero-hscroll::-webkit-scrollbar { display: none; }
        `}</style>
        {debates.map((d) => (
          <div key={d.id} style={{ height: '100%', scrollSnapAlign: 'start' }}>
            <HeroDebate debate={d} />
          </div>
        ))}
      </div>
    </div>
  )
}
