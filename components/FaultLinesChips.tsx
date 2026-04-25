'use client'
import { cleanHeadline } from '@/lib/headline'
import type { LibraryFeatured } from '@/lib/zones'

const TOPIC_CHIPS = [
  'Immigration', 'Abortion', 'Free Speech', 'Crime',
  'Climate Change', 'Gun Rights', 'Education', 'Healthcare',
  'Taxes', 'National Security', 'Economics', 'Rights & Society',
]

interface FaultLinesChipsProps {
  library: LibraryFeatured[]
}

export function FaultLinesChips({ library }: FaultLinesChipsProps) {
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
        The Fault Lines
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
        The questions America keeps fighting about.
      </p>

      {/* Topic chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {TOPIC_CHIPS.map((topic) => (
          <a
            key={topic}
            href={`/debates?topic=${encodeURIComponent(topic.toLowerCase())}`}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#0A0A0A',
              background: '#FFFFFF',
              border: '1px solid #E0E0DC',
              borderRadius: 999,
              padding: '7px 14px',
              textDecoration: 'none',
              transition: 'all 150ms ease',
              cursor: 'pointer',
            }}
          >
            {topic}
          </a>
        ))}
      </div>

      {/* Featured library debates */}
      {library.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {library.map((item) => (
            <a
              key={item.id}
              href={`/debates/${item.slug}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                background: '#FFFFFF',
                borderRadius: 12,
                padding: '16px 18px',
                boxShadow: '0 1px 2px rgba(10,10,10,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#1E3A8A',
                    background: '#F0F4FF',
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}
                >
                  LIBRARY
                </span>
                {item.category && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#999',
                    }}
                  >
                    {item.category.replace(/_/g, ' ')}
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
                }}
              >
                {cleanHeadline(item.question)}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
