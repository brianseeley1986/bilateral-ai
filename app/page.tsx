'use client'
import { useState, useEffect } from 'react'
import { HeadlineInput } from '@/components/HeadlineInput'
import { EmailCapture } from '@/components/EmailCapture'
import { useLocation } from '@/components/LocationDetector'
import { cleanHeadline } from '@/lib/headline'

const clamp2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

interface DebateCard {
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
}

interface ZoneData {
  national: DebateCard[]
  international: DebateCard[]
  state: DebateCard[]
  local: DebateCard[]
  userSubmitted: DebateCard[]
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
    fontSize: '22px' as const,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    color: '#0A0A0A',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px' as const,
    color: '#6B6B6B',
    marginBottom: '18px',
    marginTop: '0',
    paddingBottom: '14px',
    borderBottom: '0.5px solid #e0e0e0',
  },
  card: {
    padding: '16px 0',
    borderBottom: '0.5px solid #ebebeb',
    cursor: 'pointer',
  },
  headline: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.4,
    marginBottom: '8px',
    color: '#0A0A0A',
  },
  preview: {
    fontSize: '13px',
    lineHeight: 1.6,
    marginBottom: '4px',
  },
  goDeeper: {
    fontSize: '12px',
    color: '#6B6B6B',
    textAlign: 'right' as const,
    marginTop: '8px',
  },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function geoBadge(d: DebateCard): { label: string; bg: string; color: string } | null {
  if (d.sourceType === 'library') return { label: 'LIBRARY', bg: '#f0f4ff', color: '#1e3a8a' }
  if (d.track === 'satire') return { label: 'SATIRE', bg: '#fef3c7', color: '#92400e' }
  if (d.geographicScope === 'local') return { label: 'LOCAL', bg: '#dbeafe', color: '#1e3a5f' }
  if (d.geographicScope === 'state') return { label: 'STATE', bg: '#e0f2fe', color: '#0c4a6e' }
  if (d.geographicScope === 'international') return { label: 'WORLD', bg: '#f3f4f6', color: '#374151' }
  return { label: 'NATIONAL', bg: '#f0fdf4', color: '#166534' }
}

function FeedCard({ debate, showScore, hideBadge }: { debate: DebateCard; showScore?: boolean; hideBadge?: boolean }) {
  const [copied, setCopied] = useState(false)
  const isSatire = debate.track === 'satire'

  // Prefer feed hooks, fall back to exchange preview lines
  const cLine = debate.conservativeFeedHook || debate.conservativeOneLine || ''
  const lLine = debate.liberalFeedHook || debate.liberalOneLine || ''

  const badge = hideBadge ? null : geoBadge(debate)
  const timestamp = showScore && debate.overallScore != null
    ? `${debate.overallScore.toFixed(1)} · ${timeAgo(debate.createdAt)}`
    : timeAgo(debate.createdAt)

  return (
    <div
      style={{
        ...ZONE_STYLES.card,
        background: isSatire ? '#fffdf5' : 'transparent',
        padding: isSatire ? '16px 12px' : '16px 0',
        borderRadius: isSatire ? '8px' : '0',
        marginBottom: isSatire ? '8px' : '0',
      }}
      onClick={() => (window.location.href = `/debate/${debate.id}`)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        {badge && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: badge.bg,
              color: badge.color,
              letterSpacing: '0.05em',
            }}
          >
            {badge.label}
          </span>
        )}
        <span style={{ fontSize: '11px', color: '#9B9B9B' }}>{timestamp}</span>
      </div>

      <div style={ZONE_STYLES.headline}>{cleanHeadline(debate.headline)}</div>

      {cLine && (
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
              background: isSatire ? '#f1f1ef' : '#fee2e2',
              color: isSatire ? '#444' : '#7f1d1d',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            {isSatire ? 'A' : 'C'}
          </span>
          <span style={clamp2}>{cLine}</span>
        </div>
      )}
      {lLine && (
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
              background: isSatire ? '#f1f1ef' : '#dbeafe',
              color: isSatire ? '#444' : '#1e3a5f',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            {isSatire ? 'B' : 'L'}
          </span>
          <span style={clamp2}>{lLine}</span>
        </div>
      )}

      <div
        style={{
          ...ZONE_STYLES.goDeeper,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigator.clipboard
              .writeText(
                `https://bilateral.news/debate/${debate.id}?h=${encodeURIComponent(debate.headline)}`,
              )
              .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              })
              .catch(() => {})
          }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            fontSize: '12px',
            color: '#9B9B9B',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {copied ? 'Copied!' : 'Share'}
        </button>
        <span>Read debate →</span>
      </div>
    </div>
  )
}

function ZoneSection({
  label,
  subtitle,
  debates,
  count,
  emptyState,
  showScore,
  hideBadge,
}: {
  label: string
  subtitle: string
  debates: DebateCard[]
  count: number
  emptyState?: string
  showScore?: boolean
  hideBadge?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  if (debates.length === 0 && !emptyState) return null
  const extra = count - 1
  const visible = expanded ? debates : debates.slice(0, 1)

  return (
    <div style={{ marginBottom: '56px' }}>
      <div style={ZONE_STYLES.label}>{label}</div>
      <div style={ZONE_STYLES.subtitle}>{subtitle}</div>
      {debates.length === 0 && emptyState ? (
        <div style={{ fontSize: '12px', color: '#9B9B9B', padding: '12px 0' }}>{emptyState}</div>
      ) : (
        visible.map((d) => <FeedCard key={d.id} debate={d} showScore={showScore} hideBadge={hideBadge} />)
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
    <main style={{ minHeight: '100vh', background: '#F5F5F0', fontFamily: 'system-ui, sans-serif' }}>
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
              style={{ width: 10, height: 10, borderRadius: '50%', background: '#C1121F', flexShrink: 0 }}
            />
            <span
              style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0A0A0A' }}
            >
              bilateral
            </span>
            <div
              style={{ width: 10, height: 10, borderRadius: '50%', background: '#1B4FBE', flexShrink: 0 }}
            />
          </div>
          <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '24px' }}>
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

        {/* NATIONAL */}
        <ZoneSection
          label="National"
          subtitle="The biggest fights in America today."
          debates={zones?.national ?? []}
          count={zones?.counts.national ?? 0}
          emptyState={!zones ? 'Loading…' : undefined}
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
            ? 'No local debates yet for your area. Check back soon.'
            : undefined}
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

        {/* GLOBAL */}
        <ZoneSection
          label="Global"
          subtitle="The world beyond America's borders."
          debates={zones?.international ?? []}
          count={zones?.counts.international ?? 0}
          hideBadge
        />

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
