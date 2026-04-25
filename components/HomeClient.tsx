'use client'
import { useState, useEffect } from 'react'
import { HeadlineInput } from '@/components/HeadlineInput'
import { DebateHeroFeed } from '@/components/DebateHeroFeed'
import { DebateListSection } from '@/components/DebateListSection'
import { FaultLinesChips } from '@/components/FaultLinesChips'
import { SubscribeBlock } from '@/components/SubscribeBlock'
import { useLocation } from '@/components/LocationDetector'
import { dark, colors } from '@/lib/design'
import type { ZoneData, LibraryFeatured } from '@/lib/zones'

export function HomeClient({
  zones,
  library,
}: {
  zones: ZoneData
  library: LibraryFeatured[]
}) {
  const [urlMessage, setUrlMessage] = useState('')
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('confirmed') === 'true') {
      setUrlMessage('Confirmed! Your first digest arrives tomorrow morning.')
    }
    if (params.get('unsubscribed') === 'true') {
      setUrlMessage("Unsubscribed. We&apos;ll miss you.")
    }
  }, [])

  // Hero debates: national + international, most recent, up to 8
  const heroDebates = [...zones.national, ...zones.international]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  // Remaining debates for "Today's debates" section (anything not in hero)
  const heroIds = new Set(heroDebates.map(d => d.id))
  const todaysDebates = [...zones.national, ...zones.international]
    .filter(d => !heroIds.has(d.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const yourArea = [...zones.state, ...zones.local]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <>
      {/* ══════════ HERO SECTION — dark, full-width ══════════ */}
      <section
        style={{
          background: dark.bg,
          padding: '0 0 40px',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            maxWidth: 700,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.conservative }} />
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
              }}
            >
              bilateral
            </span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.liberal }} />
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/debates" style={{ fontSize: 12, color: dark.textMuted, textDecoration: 'none', fontWeight: 500 }}>
              Debates
            </a>
            <a href="/about" style={{ fontSize: 12, color: dark.textMuted, textDecoration: 'none', fontWeight: 500 }}>
              About
            </a>
            <a
              href="#submit"
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
              Submit
            </a>
          </nav>
        </header>

        {/* Tagline + subline */}
        <div
          style={{
            textAlign: 'center',
            padding: '24px 24px 8px',
            maxWidth: 700,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 15,
              color: dark.textDim,
              marginBottom: 6,
              letterSpacing: '0.01em',
            }}
          >
            The debate behind every headline.
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 28,
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              margin: 0,
              marginBottom: 32,
            }}
          >
            See both sides in 30 seconds.
          </h1>
        </div>

        {/* URL message */}
        {urlMessage && (
          <div
            style={{
              maxWidth: 600,
              margin: '0 auto 20px',
              background: '#166534',
              border: '1px solid #22c55e',
              borderRadius: 10,
              padding: '10px 16px',
              fontSize: 13,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            {urlMessage}
          </div>
        )}

        {/* Hero feed */}
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>
          <DebateHeroFeed debates={heroDebates} />
        </div>
      </section>

      {/* ══════════ BELOW HERO — light background ══════════ */}
      <section
        style={{
          background: '#F5F5F0',
          padding: '48px 20px',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Subscribe block */}
          <SubscribeBlock />

          {/* Submit a debate */}
          <div id="submit" style={{ marginBottom: 48 }}>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: '#0A0A0A',
                margin: 0,
                marginBottom: 4,
              }}
            >
              Start a debate
            </h3>
            <p
              style={{
                fontSize: 13,
                color: '#6B6B6B',
                margin: 0,
                marginBottom: 16,
                paddingBottom: 14,
                borderBottom: '0.5px solid #e0e0dc',
              }}
            >
              Drop any headline. We&apos;ll build both sides.
            </p>
            <HeadlineInput />
          </div>

          {/* Today's debates — compact list */}
          {todaysDebates.length > 0 && (
            <DebateListSection
              title="Today's debates"
              subtitle="The debates the country is having right now."
              debates={todaysDebates}
            />
          )}

          {/* Your area */}
          {yourArea.length > 0 && (
            <DebateListSection
              title={
                location.city
                  ? `Near ${location.city}`
                  : location.state
                    ? `In ${location.state}`
                    : 'Your area'
              }
              subtitle={
                location.state
                  ? 'State and local debates in your region.'
                  : 'State and local debates — subscribe to see your region.'
              }
              debates={yourArea}
            />
          )}

          {/* From readers */}
          {zones.userSubmitted.length > 0 && (
            <DebateListSection
              title="From readers"
              subtitle="Headlines readers submitted for debate."
              debates={zones.userSubmitted}
            />
          )}

          {/* Fault Lines */}
          <FaultLinesChips library={library} />

          {/* Footer */}
          <div
            style={{
              borderTop: '0.5px solid #e0e0e0',
              paddingTop: 24,
              fontSize: 12,
              color: '#757571',
              textAlign: 'center',
              lineHeight: 1.8,
            }}
          >
            bilateral.news — two sides, every debate
            <br />
            AI-powered. Editorially neutral. Intellectually honest.
          </div>
        </div>
      </section>
    </>
  )
}
