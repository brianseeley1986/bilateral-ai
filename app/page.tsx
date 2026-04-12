'use client'
import { useState, useEffect } from 'react'
import { HeadlineInput } from '@/components/HeadlineInput'
import { EmailCapture } from '@/components/EmailCapture'
import { useLocation } from '@/components/LocationDetector'

interface DebateCard {
  id: string
  headline: string
  track: string
  geographicScope: string
  createdAt: string
  publishStatus: string
  exchanges?: Array<{ c: string; l: string }>
  satireExchanges?: Array<{ a: string; b: string }>
}

const ZONE_STYLES = {
  label: {
    fontSize: '10px' as const,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#6B6B6B',
    marginBottom: '12px',
    paddingBottom: '8px',
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

function truncateSentence(text: string): string {
  if (!text) return ''
  const sentences = text.split('. ')
  return sentences[0] + (sentences.length > 1 ? '.' : '')
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function FeedCard({ debate }: { debate: DebateCard }) {
  const isSatire = debate.track === 'satire'
  const firstExchange = isSatire ? debate.satireExchanges?.[0] : debate.exchanges?.[0]
  const cLine = isSatire ? (firstExchange as any)?.a : (firstExchange as any)?.c
  const lLine = isSatire ? (firstExchange as any)?.b : (firstExchange as any)?.l

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
        {isSatire && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#fef3c7',
              color: '#92400e',
              letterSpacing: '0.05em',
            }}
          >
            SATIRE
          </span>
        )}
        {!isSatire && debate.geographicScope === 'local' && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#dbeafe',
              color: '#1e3a5f',
              letterSpacing: '0.05em',
            }}
          >
            LOCAL
          </span>
        )}
        {!isSatire && debate.geographicScope !== 'local' && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#fee2e2',
              color: '#7f1d1d',
              letterSpacing: '0.05em',
            }}
          >
            BREAKING
          </span>
        )}
        <span style={{ fontSize: '11px', color: '#9B9B9B' }}>{timeAgo(debate.createdAt)}</span>
      </div>

      <div style={ZONE_STYLES.headline}>{debate.headline}</div>

      {cLine && (
        <div style={{ ...ZONE_STYLES.preview, color: isSatire ? '#444' : '#C1121F' }}>
          {isSatire ? 'A' : 'C'} {truncateSentence(cLine)}
        </div>
      )}
      {lLine && (
        <div style={{ ...ZONE_STYLES.preview, color: isSatire ? '#444' : '#1B4FBE' }}>
          {isSatire ? 'B' : 'L'} {truncateSentence(lLine)}
        </div>
      )}

      <div style={ZONE_STYLES.goDeeper}>Go Deeper →</div>
    </div>
  )
}

export default function Home() {
  const [debates, setDebates] = useState<DebateCard[]>([])
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [urlMessage, setUrlMessage] = useState('')
  const location = useLocation()

  useEffect(() => {
    fetch('/api/debate?feed=true')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDebates(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('confirmed') === 'true') {
      setUrlMessage('Confirmed! Your first digest arrives tomorrow morning.')
    }
    if (params.get('unsubscribed') === 'true') {
      setUrlMessage("Unsubscribed. We'll miss you.")
    }
  }, [])

  const seriousNational = debates.filter(
    (d) =>
      d.track !== 'satire' &&
      d.publishStatus === 'published' &&
      d.geographicScope !== 'local' &&
      d.geographicScope !== 'international'
  )
  const localDebates = debates.filter(
    (d) => d.track !== 'satire' && d.publishStatus === 'published' && d.geographicScope === 'local'
  )
  const international = debates.filter(
    (d) =>
      d.track !== 'satire' && d.publishStatus === 'published' && d.geographicScope === 'international'
  )
  const satireDebates = debates.filter((d) => d.track === 'satire')

  return (
    <main style={{ minHeight: '100vh', background: '#F5F5F0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}
          >
            bilateral
          </div>
          <div
            style={{ fontSize: '13px', color: '#6B6B6B', letterSpacing: '0.02em', marginBottom: '28px' }}
          >
            Two minds. Every story. You decide.
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

        {seriousNational.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <div style={ZONE_STYLES.label}>Today&apos;s debates</div>
            {seriousNational.slice(0, 6).map((d) => (
              <FeedCard key={d.id} debate={d} />
            ))}
          </div>
        )}

        {localDebates.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <div style={ZONE_STYLES.label}>
              {location.detected ? 'Near you' : 'Local & community'}
            </div>
            {localDebates.slice(0, 3).map((d) => (
              <FeedCard key={d.id} debate={d} />
            ))}
          </div>
        )}

        {international.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <div style={ZONE_STYLES.label}>World</div>
            {international.slice(0, 3).map((d) => (
              <FeedCard key={d.id} debate={d} />
            ))}
          </div>
        )}

        {satireDebates.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <div style={{ ...ZONE_STYLES.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Also on bilateral</span>
              <span
                style={{
                  fontSize: '10px',
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '1px 6px',
                  borderRadius: '3px',
                }}
              >
                SATIRE
              </span>
            </div>
            {satireDebates.slice(0, 2).map((d) => (
              <FeedCard key={d.id} debate={d} />
            ))}
          </div>
        )}

        {debates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B6B6B', fontSize: '14px' }}>
            Drop a headline above to generate the first debate.
          </div>
        )}

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
