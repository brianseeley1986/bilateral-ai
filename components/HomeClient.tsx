'use client'
import { useState, useEffect } from 'react'
import { HeadlineInput } from '@/components/HeadlineInput'
import { EmailCapture } from '@/components/EmailCapture'
import { useLocation } from '@/components/LocationDetector'
import { DebateCard } from '@/components/DebateCard'
import { cleanHeadline } from '@/lib/headline'
import type { ZoneData, LibraryFeatured } from '@/lib/zones'

const ZONE_STYLES = {
  label: {
    fontFamily: 'var(--font-serif)',
    fontSize: '26px' as const,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    color: '#0A0A0A',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px' as const,
    color: '#6B6B6B',
    marginBottom: '20px',
    marginTop: '0',
    paddingBottom: '16px',
    borderBottom: '0.5px solid #e0e0dc',
  },
}

function ZoneSection({
  label,
  subtitle,
  debates,
  emptyState,
  showScore,
  hideBadge,
}: {
  label: string
  subtitle: string
  debates: any[]
  count?: number
  emptyState?: string
  showScore?: boolean
  hideBadge?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  if (debates.length === 0 && !emptyState) return null
  const extra = Math.max(0, debates.length - 1)
  const visible = expanded ? debates : debates.slice(0, 1)

  return (
    <div style={{ marginBottom: '56px' }}>
      <div style={ZONE_STYLES.label}>{label}</div>
      <div style={ZONE_STYLES.subtitle}>{subtitle}</div>
      {debates.length === 0 && emptyState ? (
        <div style={{ fontSize: '12px', color: '#757571', padding: '12px 0' }}>{emptyState}</div>
      ) : (
        visible.map((d) => <DebateCard key={d.id} debate={d} showScore={showScore} hideBadge={hideBadge} />)
      )}
      {!expanded && extra > 0 && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            marginTop: '12px',
            background: 'none',
            border: '0.5px solid #d0d0d0',
            borderRadius: '6px',
            padding: '7px 14px',
            fontSize: '12px',
            color: '#0A0A0A',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 500,
          }}
        >
          +{extra} more
        </button>
      )}
    </div>
  )
}

export function HomeClient({
  zones,
  library,
}: {
  zones: ZoneData
  library: LibraryFeatured[]
}) {
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [urlMessage, setUrlMessage] = useState('')
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('confirmed') === 'true') {
      setUrlMessage('Confirmed! Your first digest arrives tomorrow morning.')
    }
    if (params.get('unsubscribed') === 'true') {
      setUrlMessage("Unsubscribed. We'll miss you.")
    }
  }, [])

  const todaysDebates = [...zones.national, ...zones.international].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const yourArea = [...zones.state, ...zones.local].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const hasContent =
    zones.national.length > 0 ||
    zones.local.length > 0 ||
    zones.state.length > 0 ||
    zones.international.length > 0 ||
    zones.userSubmitted.length > 0

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '6px',
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#C1121F', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '34px',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              color: '#0A0A0A',
              lineHeight: 1,
            }}
          >
            bilateral
          </span>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#1B4FBE', flexShrink: 0 }} />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '15px',
            color: '#6B6B6B',
            marginTop: '10px',
            marginBottom: '28px',
            letterSpacing: '0.01em',
          }}
        >
          The debate behind every headline.
        </div>
        <HeadlineInput />
      </div>

      {urlMessage && (
        <div
          style={{
            background: '#f0fdf4',
            border: '0.5px solid #86efac',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            color: '#166534',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          {urlMessage}
        </div>
      )}

      {!showSubscribe ? (
        <div
          id="subscribe"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            boxShadow: '0 1px 2px rgba(10,10,10,0.04)',
            padding: '22px 24px',
            marginBottom: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 260px', minWidth: 220 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 500,
                color: '#0A0A0A',
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              Fresh debates, every morning.
            </div>
            <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.55 }}>
              One email. The debates worth reading. Unsubscribe anytime.
            </div>
          </div>
          <button
            onClick={() => setShowSubscribe(true)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#F5F5F0',
              background: '#0A0A0A',
              border: 'none',
              padding: '11px 20px',
              borderRadius: 999,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Subscribe
          </button>
        </div>
      ) : (
        <div id="subscribe" style={{ marginBottom: 40 }}>
          <EmailCapture />
        </div>
      )}

      {zones.userSubmitted.length > 0 && (
        <ZoneSection
          label="From readers"
          subtitle="Headlines readers submitted for debate."
          debates={zones.userSubmitted}
          count={zones.counts.userSubmitted}
          showScore
        />
      )}

      <ZoneSection
        label="Today's debates"
        subtitle="The debates the country is having right now."
        debates={todaysDebates}
        count={(zones.counts.national) + (zones.counts.international)}
        hideBadge
      />

      <ZoneSection
        label={
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
        count={(zones.counts.state) + (zones.counts.local)}
        emptyState={
          location.detected && yourArea.length === 0
            ? 'No debates yet for your area.'
            : undefined
        }
        hideBadge
      />

      <div
        style={{
          marginTop: '-28px',
          marginBottom: '64px',
          padding: '22px 24px',
          borderRadius: 14,
          background: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(10,10,10,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 260px', minWidth: 220 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              fontWeight: 500,
              color: '#0A0A0A',
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            Get debates for {location.city || location.state || 'your area'}
          </div>
          <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.55 }}>
            Subscribe and pick &quot;Local.&quot; Bilateral will generate debates on city-council, school-board, and regional issues near you.
          </div>
        </div>
        <a
          href="#subscribe"
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#F5F5F0',
            background: '#0A0A0A',
            padding: '11px 20px',
            borderRadius: 999,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Subscribe
        </a>
      </div>

      {!hasContent && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B6B6B', fontSize: '14px' }}>
          Drop a headline above to generate the first debate.
        </div>
      )}

      {/* THE FAULT LINES — library questions */}
      {library.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <div style={ZONE_STYLES.label}>The Fault Lines</div>
          <div style={ZONE_STYLES.subtitle}>The questions America keeps fighting about.</div>
          {library.map((item) => (
            <a
              key={item.id}
              href={`/debates/${item.slug}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                background: '#FFFFFF',
                borderRadius: 14,
                boxShadow: '0 1px 2px rgba(10,10,10,0.04)',
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <div style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: 6,
                      background: '#F0F4FF',
                      color: '#1E3A8A',
                      letterSpacing: '0.05em',
                    }}
                  >
                    LIBRARY
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#757571',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 600,
                    }}
                  >
                    {item.category?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: 1.25,
                    letterSpacing: '-0.02em',
                    color: '#0A0A0A',
                    marginBottom: 14,
                  }}
                >
                  {cleanHeadline(item.question)}
                </div>
                {(item.conservativePreview || item.liberalPreview) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 14 }}>
                    <div style={{ background: '#FFF0F0', borderRadius: 10, padding: '12px 14px', minHeight: 72 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#C1121F', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                        Conservative
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#1F1F1F' }}>
                        {item.conservativePreview || '—'}
                      </div>
                    </div>
                    <div style={{ background: '#F0F4FF', borderRadius: 10, padding: '12px 14px', minHeight: 72 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#1B4FBE', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                        Liberal
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#1F1F1F' }}>
                        {item.liberalPreview || '—'}
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0A0A0A', textAlign: 'right' }}>
                  Read the debate →
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <div
        style={{
          borderTop: '0.5px solid #e0e0e0',
          paddingTop: '24px',
          marginTop: '24px',
          fontSize: '12px',
          color: '#757571',
          textAlign: 'center',
          lineHeight: 1.8,
        }}
      >
        bilateral.news — two sides, every debate
        <br />
        AI-powered. Editorially neutral. Intellectually honest.
      </div>
    </>
  )
}
