'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { LIBRARY_CATEGORIES } from '@/lib/library-questions'
import { cleanHeadline } from '@/lib/headline'

interface D {
  id: string
  headline: string
  track: string
  geographicScope: string
  createdAt: string
  sourceType?: string
  librarySlug?: string | null
  libraryCategory?: string | null
  state?: string | null
  city?: string | null
  hook?: string
}

export function LatestView({ debates }: { debates: D[] }) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [geo, setGeo] = useState<string>('all')
  const [track, setTrack] = useState<string>('all')

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return debates.filter((d) => {
      if (track !== 'all' && d.track !== track) return false
      if (geo !== 'all' && d.geographicScope !== geo) return false
      if (cat !== 'all' && d.libraryCategory !== cat) return false
      if (needle && !d.headline.toLowerCase().includes(needle)) return false
      return true
    })
  }, [debates, search, cat, geo, track])

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search headlines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 280px',
            padding: '10px 14px',
            fontSize: '14px',
            border: '1px solid #E5E5DD',
            borderRadius: '6px',
            background: '#FFF',
            color: '#0A0A0A',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Pill active={cat === 'all'} onClick={() => setCat('all')}>
          All topics
        </Pill>
        {LIBRARY_CATEGORIES.map((c) => (
          <Pill key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </Pill>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'national', 'international', 'state', 'local'].map((g) => (
          <Pill key={g} active={geo === g} onClick={() => setGeo(g)}>
            {g === 'all' ? 'All geography' : g.charAt(0).toUpperCase() + g.slice(1)}
          </Pill>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {['all', 'local', 'satire'].map((t) => (
          <Pill key={t} active={track === t} onClick={() => setTrack(t)}>
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </Pill>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {filtered.map((d) => {
          const href = d.librarySlug ? `/debates/${d.librarySlug}` : `/debate/${d.id}`
          const date = new Date(d.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          return (
            <Link
              key={d.id}
              href={href}
              style={{
                display: 'block',
                padding: '18px 20px',
                background: '#FFF',
                border: '1px solid #E5E5DD',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#6B6B6B',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span>{date}</span>
                {(() => {
                  const t = (d.track || '').toLowerCase()
                  const g = (d.geographicScope || '').toLowerCase()
                  const geoLabel = g && g !== 'serious' ? g : ''
                  return (
                    <>
                      {geoLabel && (
                        <>
                          <span>·</span>
                          <span>{geoLabel}</span>
                        </>
                      )}
                      {t === 'satire' && (
                        <>
                          <span>·</span>
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '10px',
                              fontWeight: 600,
                              letterSpacing: '0.08em',
                            }}
                          >
                            Satire
                          </span>
                        </>
                      )}
                    </>
                  )
                })()}
                {d.sourceType === 'library' && (
                  <>
                    <span>·</span>
                    <span style={{ color: '#0A0A0A', fontWeight: 600 }}>Evergreen</span>
                  </>
                )}
              </div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#0A0A0A',
                  lineHeight: 1.4,
                  marginBottom: d.hook ? '6px' : 0,
                }}
              >
                {cleanHeadline(d.headline)}
              </div>
              {d.hook && (
                <div style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.5 }}>{d.hook}</div>
              )}
            </Link>
          )
        })}
        {filtered.length === 0 && (
          <div
            style={{
              padding: '48px 0',
              textAlign: 'center',
              color: '#6B6B6B',
              fontSize: '14px',
            }}
          >
            No debates match that filter yet.
          </div>
        )}
      </div>
    </div>
  )
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        fontSize: '13px',
        fontWeight: 500,
        borderRadius: '999px',
        border: active ? '1px solid #0A0A0A' : '1px solid #E5E5DD',
        background: active ? '#0A0A0A' : '#FFF',
        color: active ? '#F5F5F0' : '#0A0A0A',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
