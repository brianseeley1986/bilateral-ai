'use client'
import { useState, useEffect } from 'react'
import { HeadlineInput } from '@/components/HeadlineInput'
import { EmailCapture } from '@/components/EmailCapture'
import { useLocation } from '@/components/LocationDetector'
import { DebateCard } from '@/components/DebateCard'
import { cleanHeadline } from '@/lib/headline'

interface DebateCardData {
  id: string
  headline: string
  track: string
  sourceType?: string
  geographicScope: string
  createdAt: string
  publishStatus: string
  conservativeOneLine?: string
  liberalOneLine?: string
  conservativeFeedHook?: string | null
  liberalFeedHook?: string | null
  leadingSide?: string | null
  suggestedHook?: string
  exchanges?: Array<{ c: string; l: string }>
  satireExchanges?: Array<{ a: string; b: string }>
  factionAlert?: { detected: boolean; dividedSide: string | null; summary?: string } | null
  viewCount?: number
  overallScore?: number | null
  imageUrl?: string | null
}

interface ZoneData {
  national: DebateCardData[]
  international: DebateCardData[]
  state: DebateCardData[]
  local: DebateCardData[]
  userSubmitted: DebateCardData[]
  counts: {
    national: number
    international: number
    state: number
    local: number
    userSubmitted: number
  }
}

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
  preview: {
    fontSize: '13px',
    lineHeight: 1.6,
    marginBottom: '4px',
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
  debates: DebateCardData[]
  count?: number
  emptyState?: string
  showScore?: boolean
  hideBadge?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  if (debates.length === 0 && !emptyState) return null
  // Label reflects what the dropdown will actually reveal, not archive totals.
  const extra = Math.max(0, debates.length - 1)
  const visible = expanded ? debates : debates.slice(0, 1)

  return (
    <div style={{ marginBottom: '56px' }}>
      <div style={ZONE_STYLES.label}>{label}</div>
      <div style={ZONE_STYLES.subtitle}>{subtitle}</div>
      {debates.length === 0 && emptyState ? (
        <div style={{ fontSize: '12px', color: '#9B9B9B', padding: '12px 0' }}>{emptyState}</div>
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

interface LibraryFeatured {
  id: string
  question: string
  category: string
  slug: string
  hook?: string
  conservativePreview?: string
  liberalPreview?: string
}

function LibraryFeaturedSection() {
  const [items, setItems] = useState<LibraryFeatured[]>([])

  useEffect(() => {
    fetch('/api/library?featured=true')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data)
      })
      .catch(() => {})
  }, [])

  if (items.length === 0) return null

  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={ZONE_STYLES.label}>The Fault Lines</div>
      <div style={ZONE_STYLES.subtitle}>The questions America keeps fighting about.</div>
      {items.map((item) => (
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
          {/* Cover — red/blue split with the question as hero serif */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1200 / 630',
              background:
                'linear-gradient(90deg, #C1121F 0%, #C1121F 50%, #1B4FBE 50%, #1B4FBE 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 36px 56px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 32,
                fontWeight: 500,
                color: '#F5F5F0',
                textAlign: 'center',
                lineHeight: 1.12,
                letterSpacing: '-0.025em',
                textShadow: '0 2px 18px rgba(0,0,0,0.22)',
                maxWidth: 560,
              }}
            >
              {cleanHeadline(item.question)}
            </div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 14,
                display: 'flex',
                justifyContent: 'center',
                gap: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: 18,
                fontWeight: 700,
                color: '#F5F5F0',
                letterSpacing: '-0.035em',
                lineHeight: 1,
              }}
            >
              <span>bi</span>
              <span>lateral</span>
            </div>
          </div>

          <div style={{ padding: '20px 24px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
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
                  color: '#9B9B96',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                {item.category?.replace(/_/g, ' ')}
              </span>
            </div>
            {(item.conservativePreview || item.liberalPreview) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  background: '#FFF0F0',
                  borderRadius: 10,
                  padding: '12px 14px',
                  minHeight: 72,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#C1121F',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                  }}
                >
                  Conservative
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: '#1F1F1F' }}>
                  {item.conservativePreview || '—'}
                </div>
              </div>
              <div
                style={{
                  background: '#F0F4FF',
                  borderRadius: 10,
                  padding: '12px 14px',
                  minHeight: 72,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#1B4FBE',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                  }}
                >
                  Liberal
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: '#1F1F1F' }}>
                  {item.liberalPreview || '—'}
                </div>
              </div>
            </div>
          )}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#0A0A0A',
                textAlign: 'right',
              }}
            >
              Read the debate →
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

export default function Home() {
  const [zones, setZones] = useState<ZoneData | null>(null)
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [urlMessage, setUrlMessage] = useState('')
  const location = useLocation()

  useEffect(() => {
    const url = location.state
      ? `/api/debate?zoneView=true&state=${encodeURIComponent(location.state)}`
      : '/api/debate?zoneView=true'
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.national) setZones(data)
      })
      .catch(() => {})
  }, [location.state])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('confirmed') === 'true') {
      setUrlMessage('Confirmed! Your first digest arrives tomorrow morning.')
    }
    if (params.get('unsubscribed') === 'true') {
      setUrlMessage("Unsubscribed. We'll miss you.")
    }
  }, [])

  const hasContent = zones && (
    zones.national.length > 0 ||
    zones.local.length > 0 ||
    zones.state.length > 0 ||
    zones.international.length > 0 ||
    zones.userSubmitted.length > 0
  )

  return (
    <main style={{ minHeight: '100vh', background: '#F5F5F0', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Top nav */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <a href="/debates" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
            Debates
          </a>
          <a href="/about" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
            About
          </a>
        </div>

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
            <div
              style={{ width: 12, height: 12, borderRadius: '50%', background: '#C1121F', flexShrink: 0 }}
            />
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
            <div
              style={{ width: 12, height: 12, borderRadius: '50%', background: '#1B4FBE', flexShrink: 0 }}
            />
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
            The argument behind every headline.
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
                Today&apos;s debates, every morning.
              </div>
              <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.55 }}>
                One email. The stories worth arguing about. Unsubscribe anytime.
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

        {/* FROM READERS — user-submitted debates, hidden when empty */}
        {zones && zones.userSubmitted.length > 0 && (
          <ZoneSection
            label="From readers"
            subtitle="Headlines people asked bilateral to debate."
            debates={zones.userSubmitted}
            count={zones.counts.userSubmitted}
            showScore
          />
        )}

        {/* TODAY'S DEBATES — national + international merged */}
        <ZoneSection
          label="Today's debates"
          subtitle="What the country — and the world — is arguing about."
          debates={[...(zones?.national ?? []), ...(zones?.international ?? [])].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )}
          count={(zones?.counts.national ?? 0) + (zones?.counts.international ?? 0)}
          emptyState={!zones ? 'Loading…' : undefined}
          hideBadge
        />

        {/* YOUR AREA — state + local merged, with local CTA beneath */}
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
              ? 'State and local stories in your region.'
              : 'State and local stories — subscribe to see debates from your region.'
          }
          debates={[...(zones?.state ?? []), ...(zones?.local ?? [])].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )}
          count={(zones?.counts.state ?? 0) + (zones?.counts.local ?? 0)}
          emptyState={
            location.detected && (zones?.state.length ?? 0) === 0 && (zones?.local.length ?? 0) === 0
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
              Subscribe and pick “Local.” Bilateral will generate debates on city-council, school-board, and regional stories near you.
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

        {!hasContent && zones && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B6B6B', fontSize: '14px' }}>
            Drop a headline above to generate the first debate.
          </div>
        )}

        {/* THE FAULT LINES — library questions */}
        <LibraryFeaturedSection />

        <div
          style={{
            borderTop: '0.5px solid #e0e0e0',
            paddingTop: '24px',
            marginTop: '24px',
            fontSize: '12px',
            color: '#9B9B9B',
            textAlign: 'center',
            lineHeight: 1.8,
          }}
        >
          bilateral.news — two minds, every story
          <br />
          AI-powered. Editorially neutral. Intellectually honest.
        </div>
      </div>
    </main>
  )
}
