'use client'
import { useState, useEffect } from 'react'
import { HeadlineInput } from '@/components/HeadlineInput'
import { EmailCapture } from '@/components/EmailCapture'
import { useLocation } from '@/components/LocationDetector'
import { DebateCard } from '@/components/DebateCard'
import { cleanHeadline } from '@/lib/headline'

const clamp2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

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
    <div style={{ marginBottom: '36px' }}>
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
            padding: '16px 0',
            borderBottom: '0.5px solid #ebebeb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#f0f4ff',
                color: '#1e3a8a',
                letterSpacing: '0.05em',
              }}
            >
              LIBRARY
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#6B6B6B',
                textTransform: 'capitalize',
              }}
            >
              {item.category?.replace(/_/g, ' ')}
            </span>
          </div>
          <div
            style={{ fontSize: '16px', fontWeight: 500, lineHeight: 1.4, color: '#0A0A0A', marginBottom: '8px' }}
          >
            {cleanHeadline(item.question)}
          </div>
          {item.conservativePreview && (
            <div
              style={{
                ...ZONE_STYLES.preview,
                color: '#444',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#fee2e2',
                  color: '#7f1d1d',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                C
              </span>
              <span style={clamp2}>{item.conservativePreview}</span>
            </div>
          )}
          {item.liberalPreview && (
            <div
              style={{
                ...ZONE_STYLES.preview,
                color: '#444',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#dbeafe',
                  color: '#1e3a5f',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                L
              </span>
              <span style={clamp2}>{item.liberalPreview}</span>
            </div>
          )}
          <div
            style={{ fontSize: '12px', color: '#6B6B6B', textAlign: 'right', marginTop: '8px' }}
          >
            Read the debate →
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
            style={{
              background: '#f8f8f6',
              borderRadius: '10px',
              padding: '16px 18px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>
                Get today&apos;s debates in your inbox.
              </div>
              <div style={{ fontSize: '12px', color: '#6B6B6B' }}>
                Personalized by topic. Every morning.
              </div>
            </div>
            <button
              onClick={() => setShowSubscribe(true)}
              style={{
                padding: '9px 18px',
                background: '#0A0A0A',
                color: '#F5F5F0',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Subscribe
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '32px' }}>
            <EmailCapture />
          </div>
        )}

        {/* BEING DEBATED — user submitted, hidden when empty */}
        {zones && zones.userSubmitted.length > 0 && (
          <ZoneSection
            label="Being Debated"
            subtitle="What people are asking bilateral."
            debates={zones.userSubmitted}
            count={zones.counts.userSubmitted}
            showScore
          />
        )}

        {/* GLOBAL */}
        <ZoneSection
          label="Global"
          subtitle="The arguments shaping the world."
          debates={zones?.international ?? []}
          count={zones?.counts.international ?? 0}
          emptyState={!zones ? 'Loading…' : undefined}
          hideBadge
        />

        {/* NATIONAL */}
        <ZoneSection
          label="National"
          subtitle="The biggest fights in America today."
          debates={zones?.national ?? []}
          count={zones?.counts.national ?? 0}
          hideBadge
        />

        {/* STATE & REGIONAL */}
        <ZoneSection
          label="State & Regional"
          subtitle="Your state in the national debate."
          debates={zones?.state ?? []}
          count={zones?.counts.state ?? 0}
          hideBadge
        />

        {/* LOCAL & COMMUNITY */}
        <ZoneSection
          label={
            location.city
              ? `Near ${location.city}`
              : location.state
              ? `In ${location.state}`
              : 'Local & Community'
          }
          subtitle="What's happening near you."
          debates={zones?.local ?? []}
          count={zones?.counts.local ?? 0}
          emptyState={location.detected && zones?.local.length === 0
            ? 'No local debates yet for your area.'
            : undefined}
          hideBadge
        />

        <div
          style={{
            marginTop: '-24px',
            marginBottom: '56px',
            padding: '18px 20px',
            border: '0.5px solid #d0d0d0',
            borderRadius: '10px',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.01em' }}>
            Get local debates for {location.city || location.state || 'your area'}
          </div>
          <div style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.5 }}>
            Subscribe and pick &quot;Local&quot; — Bilateral will generate debates on city-council, school-board, and county-level stories in your area, delivered in your daily digest.
          </div>
          <a
            href="#subscribe"
            style={{
              marginTop: 4,
              alignSelf: 'flex-start',
              fontSize: 13,
              fontWeight: 600,
              color: '#F5F5F0',
              background: '#0A0A0A',
              padding: '8px 14px',
              borderRadius: 6,
              textDecoration: 'none',
            }}
          >
            Subscribe for local →
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
