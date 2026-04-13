'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { CampaignPackage, QualityScore, PublishStatus } from '@/types/debate'

// ---- ADMIN STATS DASHBOARD ----

function statCard(label: string, value: string | number, sub?: string, color?: string) {
  return (
    <div key={label} style={{ minWidth: '90px' }}>
      <div style={{ fontSize: '26px', fontWeight: 600, color: color || '#0A0A0A', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '3px' }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: '#9B9B9B', marginTop: '1px' }}>{sub}</div>}
    </div>
  )
}

function AdminDashboard({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [showSubs, setShowSubs] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(adminKey)}`, { cache: 'no-store' })
      if (res.status === 401) { setError('Invalid admin key'); return }
      const d = await res.json()
      setData(d)
      setLastRefresh(new Date())
    } catch {
      setError('Failed to load stats')
    }
  }, [adminKey])

  useEffect(() => {
    if (!adminKey) return
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [adminKey, load])

  if (!adminKey) return null
  if (error) return (
    <div style={{ maxWidth: '900px', margin: '0 auto 28px', padding: '20px', background: '#fef2f2', border: '0.5px solid #fca5a5', borderRadius: '12px', color: '#b91c1c', fontSize: '13px' }}>
      {error}
    </div>
  )
  if (!data) return (
    <div style={{ maxWidth: '900px', margin: '0 auto 28px', padding: '20px', color: '#6B6B6B', fontSize: '13px', textAlign: 'center' }}>
      Loading dashboard…
    </div>
  )

  const { topLine, bySource, mostViewed, recentUserSubmitted, qualityDist, subscribers, byGeo, dailyVolume, factionStats, needsReview } = data

  const panel = (title: string, children: React.ReactNode) => (
    <div style={{ maxWidth: '900px', margin: '0 auto 24px', background: '#fff', border: '0.5px solid #d0d0d0', borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>{title}</div>
      {children}
    </div>
  )

  // Sparkline-style bar chart for daily volume
  const maxVol = Math.max(...dailyVolume.map((d: any) => d.count), 1)
  const dayLabels = ['S','M','T','W','T','F','S']

  return (
    <>
      {/* 1. Top-line metrics */}
      {panel('Overview', (
        <div>
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {statCard('Total debates', topLine.total.toLocaleString())}
            {statCard('Published', topLine.published.toLocaleString(), undefined, '#15803d')}
            {statCard('Today', topLine.today)}
            {statCard('This week', topLine.thisWeek)}
            {statCard('Total views', topLine.totalViews.toLocaleString())}
            <div style={{ width: '1px', background: '#e5e5e5', alignSelf: 'stretch', margin: '0 4px' }} />
            {statCard('Active subs', topLine.activeSubscribers, undefined, '#1B4FBE')}
            {statCard('Pending', topLine.pendingSubscribers)}
            {statCard('Unsubscribed', topLine.unsubscribed)}
          </div>
          {lastRefresh && (
            <div style={{ fontSize: '10px', color: '#9B9B9B' }}>
              Last refreshed {lastRefresh.toLocaleTimeString()} · auto-refreshes every 60s
            </div>
          )}
        </div>
      ))}

      {/* 8. Daily volume */}
      {panel('Daily volume — last 14 days', (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '64px' }}>
          {dailyVolume.map((d: any, i: number) => {
            const date = new Date(d.day)
            const pct = Math.max(4, Math.round((d.count / maxVol) * 100))
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '9px', color: '#9B9B9B' }}>{d.count}</div>
                <div style={{ width: '100%', background: '#0A0A0A', borderRadius: '2px', height: `${pct}%`, minHeight: '4px' }} title={`${date.toLocaleDateString()}: ${d.count}`} />
                <div style={{ fontSize: '9px', color: '#9B9B9B' }}>{dayLabels[date.getDay()]}</div>
              </div>
            )
          })}
          {dailyVolume.length === 0 && <div style={{ fontSize: '13px', color: '#9B9B9B' }}>No data yet</div>}
        </div>
      ))}

      {/* 2 & 7. By source and by geography side by side */}
      <div style={{ maxWidth: '900px', margin: '0 auto 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: '#fff', border: '0.5px solid #d0d0d0', borderRadius: '12px', padding: '20px 24px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>By source</div>
          {bySource.map((r: any) => (
            <div key={r.source_type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '5px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <span style={{ color: '#444' }}>{r.source_type || 'unknown'}</span>
              <span style={{ fontWeight: 600, color: '#0A0A0A' }}>{r.count}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', border: '0.5px solid #d0d0d0', borderRadius: '12px', padding: '20px 24px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>By geography</div>
          {byGeo.map((r: any) => (
            <div key={r.geographic_scope} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '5px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <span style={{ color: '#444', textTransform: 'capitalize' }}>{r.geographic_scope}</span>
              <span style={{ fontWeight: 600, color: '#0A0A0A' }}>{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Quality distribution */}
      {panel('Quality distribution', (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {qualityDist.map((r: any) => {
            const colors: Record<string, { bg: string; text: string }> = {
              PUBLISH: { bg: '#dcfce7', text: '#15803d' },
              REVIEW: { bg: '#fef3c7', text: '#a16207' },
              HOLD: { bg: '#fee2e2', text: '#b91c1c' },
            }
            const c = colors[r.classification] || { bg: '#f1f1ef', text: '#444' }
            return (
              <div key={r.classification} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 600, color: c.text }}>{r.count}</div>
                <div style={{ background: c.bg, color: c.text, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.08em', marginTop: '4px' }}>
                  {r.classification}
                </div>
                <div style={{ fontSize: '11px', color: '#9B9B9B', marginTop: '4px' }}>avg {r.avg_score}</div>
              </div>
            )
          })}
        </div>
      ))}

      {/* 9. Faction detection */}
      {panel('Faction detection', (
        <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
          {statCard('Detected', factionStats.detected, `of ${factionStats.totalChecked} checked`, '#a16207')}
          {statCard('Right divided', factionStats.conservativeDivided)}
          {statCard('Left divided', factionStats.liberalDivided)}
          {statCard('Both divided', factionStats.bothDivided)}
          {factionStats.totalChecked > 0 && (
            <div style={{ alignSelf: 'flex-end', fontSize: '12px', color: '#9B9B9B', marginLeft: 'auto' }}>
              {Math.round((factionStats.detected / factionStats.totalChecked) * 100)}% detection rate
            </div>
          )}
        </div>
      ))}

      {/* 3. Most viewed */}
      {panel('Most viewed debates', (
        <div>
          {mostViewed.filter((d: any) => d.view_count > 0).slice(0, 8).map((d: any, i: number) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#9B9B9B', minWidth: '20px' }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: '13px', color: '#0A0A0A', lineHeight: 1.4 }}>
                <a href={`/debate/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{d.headline}</a>
              </div>
              <div style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {parseInt(d.view_count).toLocaleString()} views
              </div>
            </div>
          ))}
          {mostViewed.filter((d: any) => d.view_count > 0).length === 0 && (
            <div style={{ fontSize: '13px', color: '#9B9B9B' }}>No views yet</div>
          )}
        </div>
      ))}

      {/* 4. Recent user-submitted */}
      {recentUserSubmitted.length > 0 && panel('Recent user-submitted', (
        <div>
          {recentUserSubmitted.map((d: any) => {
            const statusColors: Record<string, string> = { published: '#15803d', review: '#a16207', held: '#b91c1c' }
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                <div style={{ flex: 1, fontSize: '13px', color: '#0A0A0A' }}>
                  <a href={`/debate/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{d.headline}</a>
                </div>
                {d.score && <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B6B6B' }}>{parseFloat(d.score).toFixed(1)}</div>}
                <div style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#f1f1ef', color: statusColors[d.publish_status] || '#6B6B6B' }}>
                  {(d.publish_status || 'published').toUpperCase()}
                </div>
                <div style={{ fontSize: '11px', color: '#9B9B9B', minWidth: '52px', textAlign: 'right' }}>
                  {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* 10. Needs review */}
      {needsReview.length > 0 && panel(`Needs review / held (${needsReview.length})`, (
        <div>
          {needsReview.map((d: any) => (
            <div key={d.id} style={{ padding: '10px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: d.publish_status === 'held' ? '#fee2e2' : '#fef3c7', color: d.publish_status === 'held' ? '#b91c1c' : '#a16207' }}>
                  {d.publish_status?.toUpperCase()}
                </span>
                {d.classification && (
                  <span style={{ fontSize: '10px', color: '#9B9B9B' }}>{d.classification}</span>
                )}
                {d.score && <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B' }}>{parseFloat(d.score).toFixed(1)}</span>}
                <span style={{ fontSize: '11px', color: '#9B9B9B', marginLeft: 'auto' }}>
                  {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#0A0A0A', lineHeight: 1.4, marginBottom: d.notes ? '4px' : 0 }}>
                <a href={`/debate/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{d.headline}</a>
              </div>
              {d.notes && <div style={{ fontSize: '12px', color: '#6B6B6B', fontStyle: 'italic' }}>{d.notes}</div>}
            </div>
          ))}
        </div>
      ))}

      {/* 6. Subscribers table */}
      {panel(`Subscribers (${topLine.activeSubscribers} active)`, (
        <div>
          <button onClick={() => setShowSubs(s => !s)} style={{ fontSize: '12px', color: '#1B4FBE', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
            {showSubs ? 'Hide list ↑' : 'Show full list ↓'}
          </button>
          {showSubs && (
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: '8px', fontSize: '10px', fontWeight: 700, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', paddingBottom: '6px', borderBottom: '0.5px solid #e5e5e5' }}>
                <span>Email</span><span>Location</span><span>Topics</span><span>Digests</span><span>Status</span>
              </div>
              {subscribers.map((s: any) => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: '8px', fontSize: '12px', padding: '6px 0', borderBottom: '0.5px solid #f5f5f5', alignItems: 'center' }}>
                  <span style={{ color: s.unsubscribed_at ? '#9B9B9B' : '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</span>
                  <span style={{ color: '#6B6B6B', fontSize: '11px' }}>{[s.city, s.region].filter(Boolean).join(', ') || '—'}</span>
                  <span style={{ color: '#6B6B6B', fontSize: '11px' }}>{(s.topics || []).slice(0, 2).join(', ') || '—'}</span>
                  <span style={{ color: '#6B6B6B', fontSize: '11px' }}>{s.last_digest_at ? new Date(s.last_digest_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: s.unsubscribed_at ? '#b91c1c' : s.confirmed ? '#15803d' : '#a16207' }}>
                    {s.unsubscribed_at ? 'UNSUB' : s.confirmed ? 'ACTIVE' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ maxWidth: '900px', margin: '0 auto 32px', borderBottom: '0.5px solid #e0e0e0' }} />
    </>
  )
}

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

function LoginGate({ onLogin }: { onLogin: (key: string) => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input.trim() }),
      })
      if (res.status === 401) {
        setError('Invalid password')
        setChecking(false)
        return
      }
      if (!res.ok) {
        setError('Server error — check ADMIN_SECRET is set in Vercel')
        setChecking(false)
        return
      }
      sessionStorage.setItem('bilateral_admin_key', input.trim())
      onLogin(input.trim())
    } catch {
      setError('Could not reach server')
      setChecking(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', border: '0.5px solid #d0d0d0', borderRadius: '16px', padding: '40px 48px', width: '100%', maxWidth: '360px' }}>
        <div style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '24px', color: '#0A0A0A' }}>bilateral — admin</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Admin key"
            autoFocus
            style={{ padding: '10px 14px', fontSize: '14px', border: '0.5px solid #d0d0d0', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
          />
          {error && <div style={{ fontSize: '12px', color: '#b91c1c' }}>{error}</div>}
          <button
            type="submit"
            disabled={checking || !input.trim()}
            style={{ padding: '10px', background: checking || !input.trim() ? '#e5e5e5' : '#0A0A0A', color: checking || !input.trim() ? '#9B9B9B' : '#F5F5F0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: checking || !input.trim() ? 'default' : 'pointer' }}
          >
            {checking ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function AdminPage() {
  const [items, setItems] = useState<CampaignItem[]>([])
  const [autoPost, setAutoPost] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [adminKey, setAdminKey] = useState('')
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('bilateral_admin_key')
    if (stored) setAdminKey(stored)
    setAuthReady(true)
    if (window.location.search.includes('key=')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

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

  if (!authReady) return null
  if (!adminKey) return <LoginGate onLogin={key => setAdminKey(key)} />

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
        <button
          onClick={() => { sessionStorage.removeItem('bilateral_admin_key'); setAdminKey('') }}
          style={{ background: 'none', border: 'none', fontSize: '12px', color: '#9B9B9B', cursor: 'pointer', padding: '4px 0' }}
        >
          Sign out
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

      {adminKey && <AdminDashboard adminKey={adminKey} />}
      <IngestionPanel />
      <JournalistPanel />
      <LibraryPanel />
      <XPanel />
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

function JournalistPanel() {
  const [stats, setStats] = useState<any>(null)
  const [journalists, setJournalists] = useState<any[]>([])
  const [running, setRunning] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_INGEST_TOKEN || ''
    fetch(`/api/ingest/journalists?token=${token}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.registry) setStats(d.registry)
        if (d.journalists) setJournalists(d.journalists)
      })
      .catch(() => {})
  }, [])

  async function seed() {
    setSeeding(true)
    try {
      const token = process.env.NEXT_PUBLIC_INGEST_TOKEN || ''
      const res = await fetch('/api/ingest/journalists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ingest-token': token },
        body: JSON.stringify({ seed: true }),
      })
      const data = await res.json()
      setResult({ type: 'seed', ...data })
      // Refresh list
      const list = await fetch(`/api/ingest/journalists?token=${token}`).then((r) => r.json())
      if (list.registry) setStats(list.registry)
      if (list.journalists) setJournalists(list.journalists)
    } catch {
      setResult({ error: 'Seed failed' })
    } finally {
      setSeeding(false)
    }
  }

  async function runIngestion() {
    setRunning(true)
    setResult(null)
    try {
      const token = process.env.NEXT_PUBLIC_INGEST_TOKEN || ''
      const res = await fetch('/api/ingest/journalists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ingest-token': token },
        body: JSON.stringify({ maxDebates: 3 }),
      })
      setResult(await res.json())
    } catch {
      setResult({ error: 'Ingestion failed' })
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
        Journalist Registry
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {stats && (
          <div style={{ display: 'flex', gap: '16px', marginRight: '12px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#0A0A0A' }}>{stats.total}</div>
              <div style={{ fontSize: '10px', color: '#9B9B9B' }}>total</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#15803d' }}>{stats.tier1}</div>
              <div style={{ fontSize: '10px', color: '#9B9B9B' }}>tier 1</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#6B6B6B' }}>{stats.active}</div>
              <div style={{ fontSize: '10px', color: '#9B9B9B' }}>active</div>
            </div>
          </div>
        )}
        <button
          onClick={seed}
          disabled={seeding}
          style={{
            padding: '8px 16px',
            background: seeding ? '#e5e5e5' : '#fff',
            color: '#0A0A0A',
            border: '0.5px solid #d0d0d0',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: seeding ? 'default' : 'pointer',
          }}
        >
          {seeding ? 'Seeding...' : 'Seed Registry'}
        </button>
        <button
          onClick={runIngestion}
          disabled={running}
          style={{
            padding: '8px 16px',
            background: running ? '#e5e5e5' : '#0A0A0A',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: running ? 'default' : 'pointer',
          }}
        >
          {running ? 'Ingesting...' : 'Run Journalist Ingestion'}
        </button>
      </div>

      {result && (
        <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#f8f8f6', borderRadius: '8px', fontSize: '13px' }}>
          {result.error ? (
            <span style={{ color: '#C1121F' }}>{result.error}</span>
          ) : result.seeded !== undefined ? (
            <span style={{ color: '#15803d' }}>Seeded {result.seeded} journalists</span>
          ) : result.stats ? (
            <div>
              <span style={{ color: '#0A0A0A' }}>
                {result.stats.journalists} checked, {result.stats.stories} stories found, {result.stats.debated} debated, {result.stats.skipped} skipped
              </span>
              {result.stats.debatedTitles?.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {result.stats.debatedTitles.map((t: string, i: number) => (
                    <div key={i} style={{ fontSize: '12px', color: '#6B6B6B', padding: '2px 0' }}>{t}</div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {journalists.length > 0 && (
        <div style={{ maxHeight: '240px', overflowY: 'auto', borderTop: '0.5px solid #e5e5e5', paddingTop: '10px' }}>
          {journalists.map((j: any) => (
            <div
              key={j.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 0',
                borderBottom: '0.5px solid #f0f0f0',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 500, color: '#0A0A0A', minWidth: '130px' }}>{j.name}</div>
              <div style={{ color: '#6B6B6B', flex: 1 }}>{j.beats?.slice(0, 3).join(', ')}</div>
              <div style={{ color: j.tier === 1 ? '#15803d' : '#6B6B6B', fontWeight: 600, fontSize: '10px' }}>T{j.tier}</div>
              <div style={{ color: '#6B6B6B', fontSize: '11px', minWidth: '32px', textAlign: 'right' }}>{j.credibility_score}</div>
              <div style={{ color: '#9B9B9B', fontSize: '10px', minWidth: '60px', textAlign: 'right' }}>
                {j.last_fetched_at ? new Date(j.last_fetched_at).toLocaleDateString() : 'never'}
              </div>
            </div>
          ))}
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

function LibraryPanel() {
  const [stats, setStats] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [running, setRunning] = useState(false)
  const [msg, setMsg] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  async function load() {
    try {
      const [s, q] = await Promise.all([
        fetch('/api/library?stats=true').then((r) => r.json()),
        fetch('/api/library').then((r) => r.json()),
      ])
      setStats(s)
      setQuestions(Array.isArray(q) ? q : [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function runBatch(count: number) {
    if (running) return
    setRunning(true)
    setMsg(`Generating ${count}...`)
    try {
      const token = process.env.NEXT_PUBLIC_INGEST_TOKEN || ''
      const r = await fetch('/api/library/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ingest-token': token },
        body: JSON.stringify({ count }),
      })
      const d = await r.json()
      if (!r.ok) {
        setMsg(`Error: ${d.error || r.status}`)
      } else {
        setMsg(`Processed ${d.processed}. Published: ${d.stats?.published || 0}`)
        await load()
      }
    } catch (e: any) {
      setMsg(`Error: ${e.message}`)
    } finally {
      setRunning(false)
    }
  }

  async function runAll() {
    if (running) return
    if (!confirm('Kick off generation across all pending questions? This will run until every pending question is generated.')) return
    setRunning(true)
    setMsg('Kicking off full generation...')
    try {
      const token = process.env.NEXT_PUBLIC_INGEST_TOKEN || ''
      const r = await fetch('/api/library/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ingest-token': token },
        body: JSON.stringify({ batchSize: 3, maxBatches: 100 }),
      })
      const d = await r.json()
      if (!r.ok) setMsg(`Error: ${d.error || r.status}`)
      else setMsg('Generation started in background. Refresh stats to watch progress.')
      await load()
    } catch (e: any) {
      setMsg(`Error: ${e.message}`)
    } finally {
      setRunning(false)
    }
  }

  const filtered = categoryFilter === 'all'
    ? questions
    : questions.filter((q) => q.category === categoryFilter)
  const total = stats?.total || 0
  const published = stats?.published || 0
  const pct = total > 0 ? Math.round((published / total) * 100) : 0
  const categories = Array.from(new Set(questions.map((q) => q.category))).sort()

  return (
    <section
      style={{
        maxWidth: '900px',
        margin: '0 auto 24px',
        padding: '20px',
        background: '#FFF',
        border: '1px solid #E5E5DD',
        borderRadius: '10px',
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#0A0A0A',
          margin: '0 0 16px',
          letterSpacing: '-0.01em',
        }}
      >
        Library
      </h3>

      {stats ? (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
            <span><strong>Total:</strong> {total}</span>
            <span><strong>Published:</strong> {published}</span>
            <span><strong>Pending:</strong> {stats.pending}</span>
            <span><strong>Generating:</strong> {stats.generating}</span>
            <span style={{ color: stats.failed > 0 ? '#C1121F' : '#6B6B6B' }}>
              <strong>Failed:</strong> {stats.failed}
            </span>
          </div>

          <div
            style={{
              height: '8px',
              background: '#F5F5F0',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: '#1B4FBE',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </>
      ) : (
        <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '12px' }}>Loading...</div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => runBatch(3)}
          disabled={running}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#0A0A0A',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '6px',
            cursor: running ? 'not-allowed' : 'pointer',
            opacity: running ? 0.6 : 1,
          }}
        >
          Generate Next 3
        </button>
        <button
          onClick={() => runBatch(5)}
          disabled={running}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#FFF',
            color: '#0A0A0A',
            border: '1px solid #0A0A0A',
            borderRadius: '6px',
            cursor: running ? 'not-allowed' : 'pointer',
            opacity: running ? 0.6 : 1,
          }}
        >
          Generate Next 5
        </button>
        <button
          onClick={runAll}
          disabled={running}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#C1121F',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '6px',
            cursor: running ? 'not-allowed' : 'pointer',
            opacity: running ? 0.6 : 1,
          }}
        >
          Generate All
        </button>
        <button
          onClick={load}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            background: '#FFF',
            color: '#6B6B6B',
            border: '1px solid #E5E5DD',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {msg && (
        <div style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '12px' }}>{msg}</div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setCategoryFilter('all')}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            borderRadius: '999px',
            border: categoryFilter === 'all' ? '1px solid #0A0A0A' : '1px solid #E5E5DD',
            background: categoryFilter === 'all' ? '#0A0A0A' : '#FFF',
            color: categoryFilter === 'all' ? '#F5F5F0' : '#0A0A0A',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              borderRadius: '999px',
              border: categoryFilter === c ? '1px solid #0A0A0A' : '1px solid #E5E5DD',
              background: categoryFilter === c ? '#0A0A0A' : '#FFF',
              color: categoryFilter === c ? '#F5F5F0' : '#0A0A0A',
              cursor: 'pointer',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid #E5E5DD', borderRadius: '6px' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F5F5F0', position: 'sticky', top: 0 }}>
              <th style={thStyle}>Question</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Tier</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Generated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <tr key={q.slug} style={{ borderTop: '1px solid #E5E5DD' }}>
                <td style={tdStyle}>
                  {q.debateId ? (
                    <a href={`/debates/${q.slug}`} style={{ color: '#0A0A0A' }}>{q.question}</a>
                  ) : (
                    q.question
                  )}
                </td>
                <td style={tdStyle}>{q.category}</td>
                <td style={tdStyle}>{q.tier}</td>
                <td style={{ ...tdStyle, color: libraryStatusColor(q.status), fontWeight: 600 }}>
                  {q.status}
                </td>
                <td style={tdStyle}>
                  {q.generatedAt ? new Date(q.generatedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function XPanel() {
  const [stats, setStats] = useState<{ posted: number; readyToPost: number; lastPostedAt: string | null } | null>(null)
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [posting, setPosting] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  async function load() {
    try {
      const res = await fetch('/api/x-post/stats', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentPosts(data.recent || [])
      }
    } catch {}
  }

  useEffect(() => { load() }, [])

  async function triggerPost(mock: boolean) {
    setPosting(true)
    setLastResult(null)
    try {
      const token = process.env.NEXT_PUBLIC_INGEST_TOKEN || ''
      const res = await fetch('/api/x-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ingest-token': token },
        body: JSON.stringify({ mock }),
      })
      const data = await res.json()
      setLastResult(data)
      await load()
    } catch (e) {
      setLastResult({ error: String(e) })
    } finally {
      setPosting(false)
    }
  }

  return (
    <section style={{ marginBottom: '40px', padding: '24px', background: '#FFF', borderRadius: '10px', border: '1px solid #E5E5DD' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
        X / Twitter Posting
      </h2>

      {stats && (
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Posted (all time)</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0A0A0A' }}>{stats.posted}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ready to post</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: stats.readyToPost > 0 ? '#1B4FBE' : '#6B6B6B' }}>{stats.readyToPost}</div>
          </div>
          {stats.lastPostedAt && (
            <div>
              <div style={{ fontSize: '11px', color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last posted</div>
              <div style={{ fontSize: '13px', color: '#0A0A0A', marginTop: '4px' }}>
                {new Date(stats.lastPostedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => triggerPost(true)}
          disabled={posting}
          style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: '1px solid #E5E5DD', background: '#FFF', cursor: posting ? 'not-allowed' : 'pointer', color: '#0A0A0A' }}
        >
          {posting ? 'Working…' : 'Test (mock)'}
        </button>
        <button
          onClick={() => triggerPost(false)}
          disabled={posting}
          style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', background: '#0A0A0A', cursor: posting ? 'not-allowed' : 'pointer', color: '#F5F5F0' }}
        >
          {posting ? 'Working…' : 'Post now'}
        </button>
      </div>

      {lastResult && (
        <div style={{ padding: '12px 14px', borderRadius: '6px', background: lastResult.error ? '#fee2e2' : '#f0fdf4', marginBottom: '16px', fontSize: '13px' }}>
          {lastResult.error ? (
            <span style={{ color: '#b91c1c' }}>Error: {lastResult.error}</span>
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: lastResult.mock ? '#92400e' : '#15803d' }}>
                {lastResult.mock ? 'Mock result' : `Posted — tweet ID: ${lastResult.tweetId}`}
              </div>
              {lastResult.tweetText && (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#0A0A0A' }}>{lastResult.tweetText}</pre>
              )}
            </>
          )}
        </div>
      )}

      {recentPosts.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Recent posts
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Headline</th>
                <th style={thStyle}>Posted at</th>
                <th style={thStyle}>Tweet ID</th>
              </tr>
            </thead>
            <tbody>
              {recentPosts.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E5E5DD' }}>
                  <td style={tdStyle}>{p.headline}</td>
                  <td style={tdStyle}>{p.x_posted_at ? new Date(p.x_posted_at).toLocaleString() : '—'}</td>
                  <td style={tdStyle}>
                    {p.tweet_id ? (
                      <a href={`https://x.com/bilateralnews/status/${p.tweet_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1B4FBE' }}>
                        {p.tweet_id}
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#6B6B6B',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  color: '#0A0A0A',
  verticalAlign: 'top',
}

function libraryStatusColor(s: string): string {
  if (s === 'published') return '#1B4FBE'
  if (s === 'failed') return '#C1121F'
  if (s === 'generating') return '#B8860B'
  return '#6B6B6B'
}

