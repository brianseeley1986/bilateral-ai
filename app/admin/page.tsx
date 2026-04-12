'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CampaignPackage, QualityScore, PublishStatus } from '@/types/debate'

interface CampaignItem {
  debateId: string
  headline: string
  track: 'serious' | 'local' | 'satire'
  geographicScope: string
  createdAt: string
  campaign?: CampaignPackage
  publishStatus?: PublishStatus
  qualityScore?: QualityScore
}

type FilterValue = 'all' | 'published' | 'review' | 'held'

const classBadge: Record<'PUBLISH' | 'REVIEW' | 'HOLD', { bg: string; text: string }> = {
  PUBLISH: { bg: '#dcfce7', text: '#15803d' },
  REVIEW: { bg: '#fef3c7', text: '#a16207' },
  HOLD: { bg: '#fee2e2', text: '#b91c1c' },
}

const trackBadges: Record<CampaignItem['track'], { label: string; bg: string; text: string }> = {
  serious: { label: 'BREAKING', bg: '#fee2e2', text: '#C1121F' },
  local: { label: 'LOCAL', bg: '#dbeafe', text: '#1B4FBE' },
  satire: { label: 'SATIRE', bg: '#fef3c7', text: '#b45309' },
}

const platformTabs = ['X A', 'X B', 'Thread', 'LinkedIn', 'Facebook', 'Reddit', 'Instagram'] as const
type Tab = (typeof platformTabs)[number]

const statusColor: Record<CampaignPackage['status'], string> = {
  pending: '#6B6B6B',
  approved: '#16a34a',
  posted: '#1B4FBE',
  skipped: '#9ca3af',
}

export default function AdminPage() {
  const [items, setItems] = useState<CampaignItem[]>([])
  const [autoPost, setAutoPost] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<FilterValue>('all')

  async function load() {
    try {
      const [c, a] = await Promise.all([
        fetch('/api/campaigns', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/autopost', { cache: 'no-store' }).then((r) => r.json()),
      ])
      setItems(Array.isArray(c) ? c : [])
      setAutoPost(!!a.enabled)
      setLoaded(true)
    } catch {}
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  async function toggleAutoPost() {
    const next = !autoPost
    setAutoPost(next)
    await fetch('/api/autopost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    })
  }

  async function patchCampaign(debateId: string, status: CampaignPackage['status']) {
    await fetch('/api/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debateId, status }),
    })
    load()
  }

  async function postNow(debateId: string, platform: string) {
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debateId, platform }),
    })
    load()
  }

  async function generateCampaign(debateId: string) {
    await fetch('/api/campaigns/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debateId }),
    })
    load()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F5F0',
        padding: '24px 24px 96px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '900px',
          margin: '0 auto 36px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <Link
            href="/"
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: '#0A0A0A',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            bilateral
          </Link>
          <span style={{ fontSize: '12px', color: '#6B6B6B' }}>— campaign queue</span>
        </div>
        <button
          onClick={toggleAutoPost}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: autoPost ? '#16a34a' : '#fff',
            color: autoPost ? '#fff' : '#0A0A0A',
            border: autoPost ? 'none' : '0.5px solid #d0d0d0',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          {autoPost && (
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#fff',
                animation: 'bilateralPulse 1.4s infinite',
              }}
            />
          )}
          {autoPost ? 'Auto-posting active' : 'Auto-post: OFF'}
        </button>
      </header>

      {autoPost && (
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto 24px',
            padding: '12px 18px',
            background: '#ecfdf5',
            border: '0.5px solid #86efac',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#065f46',
          }}
        >
          Auto-posting is active — all new debates will post automatically
        </div>
      )}

      <IngestionPanel />
      <SubscriberStatsBlock />

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {!loaded ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B6B6B', fontSize: '13px' }}>
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#6B6B6B',
              fontSize: '13px',
              border: '0.5px dashed #d0d0d0',
              borderRadius: '12px',
            }}
          >
            No debates yet. Run a debate from the homepage to get started.
          </div>
        ) : (
          (() => {
            const counts = {
              all: items.length,
              published: items.filter((i) => (i.publishStatus || 'published') === 'published').length,
              review: items.filter((i) => i.publishStatus === 'review').length,
              held: items.filter((i) => i.publishStatus === 'held').length,
            }
            const filtered =
              filter === 'all'
                ? items
                : items.filter((i) => (i.publishStatus || 'published') === filter)
            return (
              <>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  {(['all', 'published', 'review', 'held'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        fontSize: '12px',
                        padding: '7px 14px',
                        borderRadius: '16px',
                        border: filter === f ? 'none' : '0.5px solid #d0d0d0',
                        background: filter === f ? '#0A0A0A' : 'transparent',
                        color: filter === f ? '#F5F5F0' : '#6B6B6B',
                        cursor: 'pointer',
                        fontWeight: filter === f ? 500 : 400,
                        textTransform: 'capitalize',
                      }}
                    >
                      {f} <span style={{ opacity: 0.6, marginLeft: '4px' }}>{counts[f]}</span>
                    </button>
                  ))}
                </div>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B6B6B', fontSize: '13px' }}>
                    No campaigns match this filter.
                  </div>
                ) : (
                  filtered.map((item) => (
                    <CampaignCard
                      key={item.debateId}
                      item={item}
                      onApprove={() => patchCampaign(item.debateId, 'approved')}
                      onSkip={() => patchCampaign(item.debateId, 'skipped')}
                      onPostNow={(platform) => postNow(item.debateId, platform)}
                      onGenerate={() => generateCampaign(item.debateId)}
                    />
                  ))
                )}
              </>
            )
          })()
        )}
      </div>

      <style>{`
        @keyframes bilateralPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </main>
  )
}

function IngestionPanel() {
  const [maxStories, setMaxStories] = useState(5)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [localRunning, setLocalRunning] = useState(false)
  const [localResult, setLocalResult] = useState<any>(null)

  async function runIngestion() {
    setRunning(true)
    setResult(null)
    try {
      const token = process.env.NEXT_PUBLIC_INGEST_TOKEN || ''
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ingest-token': token,
        },
        body: JSON.stringify({ maxStories }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Request failed' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto 28px',
        background: '#fff',
        border: '0.5px solid #d0d0d0',
        borderRadius: '12px',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: '#6B6B6B',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '16px',
        }}
      >
        Feed Ingestion
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#6B6B6B' }}>Max stories:</span>
          <input
            type="number"
            min={1}
            max={10}
            value={maxStories}
            onChange={(e) => setMaxStories(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            style={{
              width: '48px',
              padding: '6px 8px',
              border: '0.5px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: '13px',
              textAlign: 'center',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <button
          onClick={runIngestion}
          disabled={running}
          style={{
            padding: '8px 18px',
            background: running ? '#e5e5e5' : '#0A0A0A',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: running ? 'default' : 'pointer',
          }}
        >
          {running ? 'Ingesting...' : 'Run Ingestion Now'}
        </button>
        <button
          onClick={async () => {
            setLocalRunning(true)
            setLocalResult(null)
            try {
              const token = process.env.NEXT_PUBLIC_INGEST_TOKEN || ''
              const res = await fetch('/api/ingest/local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-ingest-token': token },
                body: JSON.stringify({ maxPerLocation: 2 }),
              })
              setLocalResult(await res.json())
            } catch {
              setLocalResult({ error: 'Request failed' })
            } finally {
              setLocalRunning(false)
            }
          }}
          disabled={localRunning}
          style={{
            padding: '8px 18px',
            background: localRunning ? '#e5e5e5' : '#1B4FBE',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: localRunning ? 'default' : 'pointer',
          }}
        >
          {localRunning ? 'Ingesting local...' : 'Run Local Ingestion'}
        </button>
        <div style={{ fontSize: '11px', color: '#9B9B9B' }}>
          Sources: Google Trends, Reuters, BBC, NPR, AP + local feeds
        </div>
      </div>

      {localResult && (
        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f0f4ff', borderRadius: '8px', fontSize: '13px' }}>
          {localResult.error ? (
            <span style={{ color: '#C1121F' }}>{localResult.error}</span>
          ) : localResult.stats ? (
            <span style={{ color: '#1B4FBE' }}>
              Local: {localResult.stats.locations ?? localResult.stats.found ?? 0} locations, {localResult.stats.totalDebated ?? localResult.stats.debated ?? 0} debated
            </span>
          ) : null}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '16px', borderTop: '0.5px solid #e5e5e5', paddingTop: '14px' }}>
          {result.error ? (
            <div style={{ fontSize: '13px', color: '#C1121F' }}>{result.error}</div>
          ) : result.stats ? (
            <div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[
                  { label: 'Processed', value: result.stats.processed, color: '#6B6B6B' },
                  { label: 'Debated', value: result.stats.debated, color: '#15803d' },
                  { label: 'Skipped', value: result.stats.skipped, color: '#a16207' },
                  { label: 'Duplicates', value: result.stats.duplicates, color: '#6B6B6B' },
                  { label: 'Errors', value: result.stats.errors, color: result.stats.errors > 0 ? '#b91c1c' : '#6B6B6B' },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              {result.stats.stories?.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#6B6B6B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: '8px',
                    }}
                  >
                    Stories debated
                  </div>
                  {result.stats.stories.map((s: string, i: number) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '13px',
                        color: '#0A0A0A',
                        lineHeight: 1.5,
                        padding: '4px 0',
                        borderBottom: i < result.stats.stories.length - 1 ? '0.5px solid #ebebeb' : 'none',
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function SubscriberStatsBlock() {
  const [stats, setStats] = useState<any>(null)
  useEffect(() => {
    fetch('/api/subscribers/stats', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])
  if (!stats || stats.error) return null

  const topTopics = [
    { name: 'Economics', count: parseInt(stats.economics) || 0 },
    { name: 'Politics', count: parseInt(stats.politics) || 0 },
    { name: 'Technology', count: parseInt(stats.technology) || 0 },
    { name: 'Foreign Policy', count: parseInt(stats.foreign_policy) || 0 },
    { name: 'Healthcare', count: parseInt(stats.healthcare) || 0 },
    { name: 'Education', count: parseInt(stats.education) || 0 },
    { name: 'Climate', count: parseInt(stats.climate) || 0 },
    { name: 'Immigration', count: parseInt(stats.immigration) || 0 },
    { name: 'Legal', count: parseInt(stats.legal) || 0 },
    { name: 'Local', count: parseInt(stats.local_topic) || 0 },
    { name: 'Satire', count: parseInt(stats.satire) || 0 },
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const confirmed = parseInt(stats.confirmed) || 0
  const pending = parseInt(stats.pending) || 0
  const withLocation = parseInt(stats.with_location) || 0

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto 28px',
        background: '#fff',
        border: '0.5px solid #d0d0d0',
        borderRadius: '12px',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: '#6B6B6B',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '16px',
        }}
      >
        Subscribers
      </div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '36px', fontWeight: 600, color: '#0A0A0A', lineHeight: 1 }}>
            {confirmed}
          </div>
          <div style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '4px' }}>confirmed</div>
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 500, color: '#6B6B6B', lineHeight: 1 }}>
            {pending}
          </div>
          <div style={{ fontSize: '11px', color: '#9B9B9B', marginTop: '4px' }}>pending</div>
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 500, color: '#6B6B6B', lineHeight: 1 }}>
            {withLocation}
          </div>
          <div style={{ fontSize: '11px', color: '#9B9B9B', marginTop: '4px' }}>with location</div>
        </div>
        {topTopics.some((t) => t.count > 0) && (
          <div style={{ marginLeft: 'auto' }}>
            <div style={{ fontSize: '11px', color: '#9B9B9B', marginBottom: '6px' }}>Top topics</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {topTopics
                .filter((t) => t.count > 0)
                .map((t) => (
                  <span
                    key={t.name}
                    style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: '#f1f1ef',
                      color: '#444',
                    }}
                  >
                    {t.name} ({t.count})
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QualityBlock({ quality }: { quality: QualityScore }) {
  const badge = classBadge[quality.classification]
  const dims: Array<{ key: keyof QualityScore['scores']; label: string }> = [
    { key: 'argumentSpecificity', label: 'Spec' },
    { key: 'evidenceQuality', label: 'Evd' },
    { key: 'genuineTension', label: 'Ten' },
    { key: 'intellectualHonesty', label: 'Hon' },
    { key: 'depthBeyondHeadlines', label: 'Dep' },
  ]
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px 18px',
        background: '#fafafa',
        border: '0.5px solid #e5e5e5',
        borderRadius: '10px',
        marginBottom: '22px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#0A0A0A',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {quality.overallScore.toFixed(1)}
        </div>
        <span
          style={{
            background: badge.bg,
            color: badge.text,
            fontSize: '10px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '4px',
            letterSpacing: '0.1em',
          }}
        >
          {quality.classification}
        </span>
        <div
          style={{
            fontSize: '10px',
            color: '#6B6B6B',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginLeft: 'auto',
          }}
        >
          weakest: {quality.weakestDimension}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {dims.map((d) => {
          const v = quality.scores[d.key]
          return (
            <div
              key={d.key}
              style={{
                flex: 1,
                background: '#fff',
                border: '0.5px solid #e5e5e5',
                borderRadius: '6px',
                padding: '8px 6px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  color: '#6B6B6B',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '3px',
                }}
              >
                {d.label}
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: v >= 8 ? '#15803d' : v >= 6 ? '#a16207' : '#b91c1c',
                }}
              >
                {v}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: '12px', lineHeight: 1.55, color: '#6B6B6B', fontStyle: 'italic' }}>
        {quality.scoringNotes}
      </div>
      {quality.classification === 'HOLD' && quality.regenerationSuggestion && (
        <div
          style={{
            background: '#fef2f2',
            border: '0.5px solid #fecaca',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#7f1d1d',
          }}
        >
          <span style={{ fontWeight: 700 }}>Regenerate: </span>
          {quality.regenerationSuggestion}
        </div>
      )}
    </div>
  )
}

function CampaignCard({
  item,
  onApprove,
  onSkip,
  onPostNow,
  onGenerate,
}: {
  item: CampaignItem
  onApprove: () => void
  onSkip: () => void
  onPostNow: (platform: string) => void
  onGenerate: () => void
}) {
  const [tab, setTab] = useState<Tab>('X A')
  const [variant, setVariant] = useState<'A' | 'B'>('A')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const badge = trackBadges[item.track?.toLowerCase() as CampaignItem['track']] || trackBadges.serious
  const { campaign } = item

  const empty = { text: '', platformKey: '' }
  const tabContent: Record<Tab, { text: string; platformKey: string }> = campaign
    ? {
        'X A': { text: campaign.posts.xA, platformKey: 'xA' },
        'X B': { text: campaign.posts.xB, platformKey: 'xB' },
        Thread: { text: (campaign.posts.xThread || []).join('\n\n'), platformKey: 'xThread' },
        LinkedIn: { text: campaign.posts.linkedin, platformKey: 'linkedin' },
        Facebook: { text: campaign.posts.facebook, platformKey: 'facebook' },
        Reddit: { text: campaign.posts.reddit, platformKey: 'reddit' },
        Instagram: { text: campaign.posts.instagram, platformKey: 'instagram' },
      }
    : {
        'X A': empty, 'X B': empty, Thread: empty, LinkedIn: empty,
        Facebook: empty, Reddit: empty, Instagram: empty,
      }

  function copy(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const isHeld = item.publishStatus === 'held'
  return (
    <div
      style={{
        background: isHeld ? '#fafafa' : '#fff',
        border: '0.5px solid #d0d0d0',
        borderLeft: isHeld ? '3px solid #C1121F' : '0.5px solid #d0d0d0',
        borderRadius: '12px',
        padding: '24px 26px',
        marginBottom: '20px',
        opacity: isHeld ? 0.92 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            background: badge.bg,
            color: badge.text,
            fontSize: '10px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '3px',
            letterSpacing: '0.1em',
          }}
        >
          {badge.label}
        </span>
        <span style={{ fontSize: '11px', color: '#6B6B6B' }}>{item.geographicScope}</span>
        {campaign && <span style={{ fontSize: '11px', color: '#6B6B6B' }}>· {campaign.timing}</span>}
        <Link
          href={`/debate/${item.debateId}`}
          style={{
            fontSize: '11px',
            color: '#6B6B6B',
            textDecoration: 'none',
            marginLeft: '4px',
          }}
        >
          · view story →
        </Link>
        {campaign && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '10px',
              fontWeight: 700,
              color: statusColor[campaign.status],
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {campaign.status}
          </span>
        )}
      </div>

      <h3
        style={{
          fontSize: '17px',
          fontWeight: 500,
          color: '#0A0A0A',
          margin: '0 0 18px',
          lineHeight: 1.35,
        }}
      >
        {item.headline}
      </h3>

      {item.qualityScore && <QualityBlock quality={item.qualityScore} />}

      {!campaign ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 0',
            border: '0.5px dashed #d0d0d0',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '14px' }}>
            No campaign generated yet
          </div>
          <button
            onClick={async () => {
              setGenerating(true)
              await onGenerate()
              setGenerating(false)
            }}
            disabled={generating}
            style={{
              background: generating ? '#e5e5e5' : '#0A0A0A',
              color: '#F5F5F0',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: generating ? 'default' : 'pointer',
            }}
          >
            {generating ? 'Generating...' : 'Generate Campaign'}
          </button>
        </div>
      ) : (
      <>
      <div
        style={{
          background: '#f8f8f6',
          borderLeft: '3px solid #0A0A0A',
          padding: '16px 20px',
          marginBottom: '22px',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#6B6B6B',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '8px',
          }}
        >
          Hook
        </div>
        <div
          style={{
            fontSize: '18px',
            lineHeight: 1.4,
            color: '#0A0A0A',
            fontWeight: 500,
          }}
        >
          {campaign.hook}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          marginBottom: '12px',
          borderBottom: '0.5px solid #e0e0e0',
          paddingBottom: '10px',
        }}
      >
        {platformTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontSize: '11px',
              padding: '5px 12px',
              borderRadius: '14px',
              border: tab === t ? 'none' : '0.5px solid #d0d0d0',
              background: tab === t ? '#0A0A0A' : 'transparent',
              color: tab === t ? '#F5F5F0' : '#6B6B6B',
              cursor: 'pointer',
              fontWeight: tab === t ? 500 : 400,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        style={{
          background: '#f8f8f6',
          borderRadius: '8px',
          padding: '16px 18px',
          marginBottom: '18px',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            lineHeight: 1.65,
            color: '#0A0A0A',
            whiteSpace: 'pre-wrap',
            paddingRight: '64px',
          }}
        >
          {tabContent[tab].text}
        </div>
        <button
          onClick={() => copy(tabContent[tab].text)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#fff',
            border: '0.5px solid #d0d0d0',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#6B6B6B',
            letterSpacing: '0.06em',
          }}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {campaign.targeting.subreddits.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#6B6B6B',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '8px',
            }}
          >
            Subreddit targets
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {campaign.targeting.subreddits.map((s, i) => (
              <span
                key={i}
                style={{
                  background: '#eef2ff',
                  color: '#3730a3',
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 500,
                }}
              >
                r/{s.replace(/^r\//i, '')}
              </span>
            ))}
          </div>
        </div>
      )}

      {campaign.influencerNote && (
        <div
          style={{
            background: '#fffbeb',
            border: '0.5px solid #fde68a',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#92400e',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '6px',
            }}
          >
            Influencer outreach
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.55, color: '#451a03' }}>
            {campaign.influencerNote}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#6B6B6B',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '8px',
          }}
        >
          A/B hook variants
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button
            onClick={() => setVariant('A')}
            style={{
              fontSize: '11px',
              padding: '4px 12px',
              borderRadius: '12px',
              border: variant === 'A' ? 'none' : '0.5px solid #d0d0d0',
              background: variant === 'A' ? '#0A0A0A' : 'transparent',
              color: variant === 'A' ? '#F5F5F0' : '#6B6B6B',
              cursor: 'pointer',
            }}
          >
            Hook A
          </button>
          <button
            onClick={() => setVariant('B')}
            style={{
              fontSize: '11px',
              padding: '4px 12px',
              borderRadius: '12px',
              border: variant === 'B' ? 'none' : '0.5px solid #d0d0d0',
              background: variant === 'B' ? '#0A0A0A' : 'transparent',
              color: variant === 'B' ? '#F5F5F0' : '#6B6B6B',
              cursor: 'pointer',
            }}
          >
            Hook B
          </button>
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#0A0A0A',
            lineHeight: 1.55,
            padding: '12px 14px',
            background: '#f8f8f6',
            borderRadius: '6px',
          }}
        >
          {variant === 'A' ? campaign.abVariants.hookA : campaign.abVariants.hookB}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          paddingTop: '14px',
          borderTop: '0.5px solid #e0e0e0',
        }}
      >
        <button
          onClick={onApprove}
          disabled={campaign.status === 'approved'}
          style={{
            flex: 1,
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '11px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: campaign.status === 'approved' ? 'default' : 'pointer',
            opacity: campaign.status === 'approved' ? 0.5 : 1,
          }}
        >
          Approve & Queue
        </button>
        <button
          onClick={onSkip}
          disabled={campaign.status === 'skipped'}
          style={{
            flex: 1,
            background: '#f1f1f1',
            color: '#6B6B6B',
            border: 'none',
            borderRadius: '8px',
            padding: '11px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: campaign.status === 'skipped' ? 'default' : 'pointer',
            opacity: campaign.status === 'skipped' ? 0.5 : 1,
          }}
        >
          Skip
        </button>
        <button
          onClick={() => onPostNow(tabContent[tab].platformKey)}
          style={{
            flex: 1,
            background: '#0A0A0A',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '8px',
            padding: '11px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Post Now
        </button>
      </div>
      </>
      )}
    </div>
  )
}
