'use client'
import { useState } from 'react'
import { colors } from '@/lib/design'

interface CompactDebate {
  id: string
  headline: string
  createdAt: string
  conservativeOneLine: string
  liberalOneLine: string
  slug?: string | null
  geographicScope?: string
}

interface DebateListSectionProps {
  title: string
  subtitle: string
  debates: CompactDebate[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export function DebateListSection({ title, subtitle, debates }: DebateListSectionProps) {
  const [showAll, setShowAll] = useState(false)
  if (debates.length === 0) return null

  const visible = showAll ? debates : debates.slice(0, 4)
  const extra = debates.length - 4

  return (
    <div style={{ marginBottom: 48 }}>
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
        {title}
      </h3>
      <p
        style={{
          fontSize: 13,
          color: '#6B6B6B',
          margin: 0,
          marginBottom: 20,
          paddingBottom: 14,
          borderBottom: '0.5px solid #e0e0dc',
        }}
      >
        {subtitle}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.map((d) => (
          <a
            key={d.id}
            href={`/debate/${d.slug || d.id}`}
            style={{
              display: 'block',
              textDecoration: 'none',
              color: 'inherit',
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 18px',
              boxShadow: '0 1px 2px rgba(10,10,10,0.04)',
              transition: 'box-shadow 150ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: '#999', fontWeight: 500 }}>
                {timeAgo(d.createdAt)}
              </span>
              {d.geographicScope && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#999',
                    background: '#F5F5F0',
                    padding: '2px 7px',
                    borderRadius: 4,
                  }}
                >
                  {d.geographicScope}
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: '-0.015em',
                color: '#0A0A0A',
                marginBottom: 10,
              }}
            >
              {d.headline}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {d.conservativeOneLine && (
                <div
                  style={{
                    flex: 1,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: '#555',
                    borderLeft: `2px solid ${colors.conservative}`,
                    paddingLeft: 8,
                  }}
                >
                  {d.conservativeOneLine.length > 80
                    ? d.conservativeOneLine.slice(0, 80) + '...'
                    : d.conservativeOneLine}
                </div>
              )}
              {d.liberalOneLine && (
                <div
                  style={{
                    flex: 1,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: '#555',
                    borderLeft: `2px solid ${colors.liberal}`,
                    paddingLeft: 8,
                  }}
                >
                  {d.liberalOneLine.length > 80
                    ? d.liberalOneLine.slice(0, 80) + '...'
                    : d.liberalOneLine}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>

      {!showAll && extra > 0 && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            marginTop: 12,
            background: 'none',
            border: '0.5px solid #d0d0d0',
            borderRadius: 6,
            padding: '7px 14px',
            fontSize: 12,
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
