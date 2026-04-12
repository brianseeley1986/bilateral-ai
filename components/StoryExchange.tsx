'use client'
import { useState } from 'react'
import type { DebateOutput, LineByLineExchange, SatireExchange } from '@/types/debate'
import { DebateViewer } from './DebateViewer'

function resolveBadge(
  track: string,
  sourceType?: string,
  geoScope?: string,
): { label: string; bg: string; text: string } {
  if (track === 'satire') return { label: 'SATIRE', bg: '#fef3c7', text: '#b45309' }
  if (track === 'local' || geoScope === 'local') return { label: 'LOCAL', bg: '#dbeafe', text: '#1B4FBE' }
  if (sourceType === 'trending' || sourceType === 'rss') return { label: 'BREAKING', bg: '#fee2e2', text: '#C1121F' }
  return { label: 'ANALYSIS', bg: '#f1f1ef', text: '#444444' }
}

function compressToTwoSentences(text: string): { display: string; truncated: boolean } {
  if (!text) return { display: '', truncated: false }
  const parts = text.split('. ')
  if (parts.length <= 2) return { display: text, truncated: false }
  const joined = parts.slice(0, 2).join('. ')
  const display = joined.endsWith('.') ? joined : joined + '.'
  return { display, truncated: true }
}

export function StoryExchange({ debate }: { debate: DebateOutput }) {
  const [deep, setDeep] = useState(false)
  const badge = resolveBadge(debate.track, debate.sourceType, debate.geographicScope)
  const isSatire = debate.track === 'satire'

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span
            style={{
              background: badge.bg,
              color: badge.text,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '3px 8px',
              borderRadius: '3px',
            }}
          >
            {badge.label}
          </span>
          <span style={{ fontSize: '11px', color: '#6B6B6B', letterSpacing: '0.06em' }}>
            {new Date(debate.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <h1
          style={{
            fontSize: '30px',
            fontWeight: 600,
            lineHeight: 1.2,
            margin: '0 0 16px',
            letterSpacing: '-0.015em',
            color: '#0A0A0A',
          }}
        >
          {debate.headline}
        </h1>
        <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#6B6B6B', margin: 0 }}>
          {debate.context?.whatHappened}
        </p>
      </div>

      {/* Hook block */}
      {!isSatire && (
        <div
          style={{
            marginBottom: '44px',
            paddingBottom: '32px',
            borderBottom: '0.5px solid #d0d0d0',
          }}
        >
          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.65,
              color: '#4a4a4a',
              margin: 0,
              fontWeight: 400,
            }}
          >
            {debate.suggestedHook || debate.context?.whatHappened}
          </p>
        </div>
      )}

      {/* Line-by-line exchange */}
      {isSatire && debate.satireExchanges ? (
        <SatireExchanges exchanges={debate.satireExchanges} closer={debate.satireCloser || ''} />
      ) : debate.exchanges ? (
        <SeriousExchanges exchanges={debate.exchanges} />
      ) : (
        <div style={{ fontSize: '13px', color: '#6B6B6B' }}>No exchange available.</div>
      )}

      {/* Weak point cards + arbiter summary — hidden for satire */}
      {!isSatire && debate.conservative && debate.liberal && (
        <div
          style={{
            marginTop: '44px',
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: '1 1 260px',
              background: '#fff0f0',
              borderRadius: '12px',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#C1121F',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '10px',
              }}
            >
              Conservative&apos;s hardest question
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#1a1a1a' }}>
              {debate.conservative.weakestPoint}
            </div>
          </div>
          <div
            style={{
              flex: '1 1 260px',
              background: '#f0f4ff',
              borderRadius: '12px',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#1B4FBE',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '10px',
              }}
            >
              Liberal&apos;s hardest question
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#1a1a1a' }}>
              {debate.liberal.weakestPoint}
            </div>
          </div>
        </div>
      )}

      {!isSatire && debate.verdict && (
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            textAlign: 'center',
          }}
        >
          {debate.verdict.agreements?.[0] && (
            <div style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6 }}>
              Both sides agree: {debate.verdict.agreements[0]}
            </div>
          )}
          {debate.verdict.conflicts?.[0] && (
            <div style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6 }}>
              The real conflict: {debate.verdict.conflicts[0]}
            </div>
          )}
          {debate.verdict.openQuestions?.[0] && (
            <div style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.6 }}>
              What nobody has answered: {debate.verdict.openQuestions[0]}
            </div>
          )}
        </div>
      )}

      {/* Go Deeper — hidden for satire */}
      {!isSatire && debate.conservative && (
        <>
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <button
              onClick={() => setDeep(!deep)}
              style={{
                background: deep ? 'transparent' : '#0A0A0A',
                color: deep ? '#6B6B6B' : '#F5F5F0',
                border: deep ? '0.5px solid #d0d0d0' : 'none',
                borderRadius: '24px',
                padding: '12px 28px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'all 0.2s',
              }}
            >
              {deep ? 'Collapse depth ↑' : 'Go Deeper →'}
            </button>
          </div>

          {deep && (
            <div
              style={{
                marginTop: '40px',
                paddingTop: '32px',
                borderTop: '0.5px solid #d0d0d0',
              }}
            >
              <DebateViewer debate={debate} showHeader={false} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SeriousExchanges({ exchanges }: { exchanges: LineByLineExchange[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {exchanges.map((ex, i) => (
        <div key={i}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#6B6B6B',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '12px',
            }}
          >
            {ex.claim}
          </div>
          <div style={{ borderTop: '0.5px solid #d0d0d0' }} />
          <div style={{ padding: '6px 0' }}>
            <Turn side="c" text={ex.c} />
            <Turn side="l" text={ex.l} />
            <Turn side="c" text={ex.cRebuttal} />
            <Turn side="l" text={ex.lClose} />
          </div>
          <div style={{ borderBottom: '0.5px solid #d0d0d0' }} />
        </div>
      ))}
    </div>
  )
}

function Turn({ side, text }: { side: 'c' | 'l'; text: string }) {
  const color = side === 'c' ? '#C1121F' : '#1B4FBE'
  const label = side === 'c' ? 'C' : 'L'
  const { display, truncated } = compressToTwoSentences(text)
  return (
    <div style={{ display: 'flex', gap: '14px', padding: '12px 0' }}>
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: color,
          color: '#F5F5F0',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          borderLeft: `2px solid ${color}`,
          paddingLeft: '16px',
          fontSize: '14.5px',
          lineHeight: 1.7,
          color: '#0A0A0A',
          flex: 1,
        }}
      >
        {display}
        {truncated && <span style={{ color: '#b0b0b0', marginLeft: '3px' }}>…</span>}
      </div>
    </div>
  )
}

function SatireExchanges({
  exchanges,
  closer,
}: {
  exchanges: SatireExchange[]
  closer: string
}) {
  return (
    <div>
      <div
        style={{
          background: '#fffbeb',
          border: '0.5px solid #fde68a',
          borderRadius: '12px',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        {exchanges.map((ex, i) => (
          <div key={i}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#92400e',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '12px',
              }}
            >
              {ex.claim}
            </div>
            <SatireTurn label="ANALYST A" text={ex.a} />
            <SatireTurn label="ANALYST B" text={ex.b} />
            <SatireTurn label="ANALYST A" text={ex.aRebuttal} />
            <SatireTurn label="ANALYST B" text={ex.bRebuttal} />
          </div>
        ))}
      </div>
      {closer && (
        <div
          style={{
            marginTop: '24px',
            padding: '18px 22px',
            background: '#0A0A0A',
            color: '#F5F5F0',
            borderRadius: '12px',
            fontSize: '14.5px',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '8px',
              fontStyle: 'normal',
            }}
          >
            Arbiter closer
          </div>
          {closer}
        </div>
      )}
    </div>
  )
}

function SatireTurn({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <div
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: '#92400e',
          letterSpacing: '0.12em',
          marginBottom: '5px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '13.5px', lineHeight: 1.65, color: '#1a1a1a' }}>{text}</div>
    </div>
  )
}
