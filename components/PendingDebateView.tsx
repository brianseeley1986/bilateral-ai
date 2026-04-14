'use client'
import { useEffect, useState } from 'react'
import { StoryExchange } from '@/components/StoryExchange'

function stageStatus(debate: any): string {
  if (!debate?.context?.whatHappened) return 'Researching the story…'
  if (!debate?.conservative?.argument || !debate?.liberal?.argument) return 'Mapping conservative and liberal positions…'
  return 'Building the line-by-line exchange…'
}

const FINAL = new Set(['published', 'review', 'held'])

export function PendingDebateView({ id, headline }: { id: string; headline: string }) {
  const [debate, setDebate] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let attempts = 0

    async function poll() {
      if (cancelled) return
      attempts++
      try {
        const res = await fetch(`/api/debate?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setDebate(data)
            if (FINAL.has(data.publishStatus) || data.publishStatus === 'failed') return
          }
        }
      } catch {}
      if (attempts > 90) {
        setError('Generation is taking unusually long. Try refreshing.')
        return
      }
      setTimeout(poll, 3000)
    }

    poll()
    return () => { cancelled = true }
  }, [id])


  if (debate && debate.publishStatus === 'failed') {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Generation failed</h1>
        <p style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 16 }}>Something broke while writing this debate. Try submitting it again.</p>
        {debate.errorMessage && (
          <pre style={{
            fontSize: 11, color: '#7f1d1d', background: '#fff0f0',
            padding: 12, borderRadius: 6, whiteSpace: 'pre-wrap',
            wordBreak: 'break-word', maxHeight: 300, overflow: 'auto',
          }}>{debate.errorMessage}</pre>
        )}
      </div>
    )
  }

  // Fully done — hand off to StoryExchange
  if (debate && FINAL.has(debate.publishStatus)) {
    return <StoryExchange debate={debate} />
  }

  // Streaming mode — render what we have so far
  const hasContext = !!debate?.context?.whatHappened
  const hasPositions = !!(debate?.conservative?.argument && debate?.liberal?.argument)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{
            background: '#f1f1ef', color: '#6B6B6B',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            padding: '3px 8px', borderRadius: 3,
          }}>
            WRITING
          </span>
          <span style={{ fontSize: 11, color: '#6B6B6B' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <h1 style={{
          fontSize: 30, fontWeight: 600, lineHeight: 1.2, margin: 0,
          letterSpacing: '-0.015em', color: '#0A0A0A',
        }}>
          {debate?.headline || headline}
        </h1>
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid #E5E5DD', borderTopColor: '#0A0A0A',
            animation: 'bilateralSpin 0.9s linear infinite',
          }} />
          <span style={{ fontSize: 14, color: '#6B6B6B' }}>
            {error || stageStatus(debate)}
          </span>
        </div>
      </div>

      {/* Context — fills in after stage 1 (~15-25s) */}
      {hasContext ? (
        <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: '0.5px solid #d0d0d0' }}>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: '#3A3A3A', margin: 0 }}>
            {debate.context.whatHappened}
          </p>
          {debate.context.whyItMatters && (
            <p style={{ fontSize: 14, lineHeight: 1.65, color: '#6B6B6B', margin: '12px 0 0' }}>
              {debate.context.whyItMatters}
            </p>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 28 }}>
          <div style={{ height: 12, background: '#ECECE6', borderRadius: 2, marginBottom: 8 }} />
          <div style={{ height: 12, width: '85%', background: '#ECECE6', borderRadius: 2, marginBottom: 8 }} />
          <div style={{ height: 12, width: '60%', background: '#ECECE6', borderRadius: 2 }} />
        </div>
      )}

      {/* Position cards — fill in after stage 2 (~45-55s) */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
        <div style={{
          flex: '1 1 280px', background: '#fff0f0', borderRadius: 12, padding: '18px 20px',
          minHeight: 140,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#C1121F',
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
          }}>
            Conservative
          </div>
          {hasPositions ? (
            <div style={{ fontSize: 13, lineHeight: 1.6, color: '#1a1a1a' }}>
              {debate.conservative.previewLine || debate.conservative.argument?.slice(0, 280) + '…'}
            </div>
          ) : (
            <>
              <div style={{ height: 10, background: '#f4d4d4', borderRadius: 2, marginBottom: 6 }} />
              <div style={{ height: 10, background: '#f4d4d4', borderRadius: 2, marginBottom: 6 }} />
              <div style={{ height: 10, width: '70%', background: '#f4d4d4', borderRadius: 2 }} />
            </>
          )}
        </div>
        <div style={{
          flex: '1 1 280px', background: '#f0f4ff', borderRadius: 12, padding: '18px 20px',
          minHeight: 140,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#1B4FBE',
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
          }}>
            Liberal
          </div>
          {hasPositions ? (
            <div style={{ fontSize: 13, lineHeight: 1.6, color: '#1a1a1a' }}>
              {debate.liberal.previewLine || debate.liberal.argument?.slice(0, 280) + '…'}
            </div>
          ) : (
            <>
              <div style={{ height: 10, background: '#d4dcf4', borderRadius: 2, marginBottom: 6 }} />
              <div style={{ height: 10, background: '#d4dcf4', borderRadius: 2, marginBottom: 6 }} />
              <div style={{ height: 10, width: '70%', background: '#d4dcf4', borderRadius: 2 }} />
            </>
          )}
        </div>
      </div>

      {/* Exchange skeleton — fills in at final save */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div style={{ height: 10, width: '40%', background: '#ECECE6', borderRadius: 2, marginBottom: 12 }} />
            <div style={{ height: 1, background: '#d0d0d0', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f4d4d4' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, background: '#ECECE6', borderRadius: 2, marginBottom: 6 }} />
                <div style={{ height: 10, width: '85%', background: '#ECECE6', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#d4dcf4' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, background: '#ECECE6', borderRadius: 2, marginBottom: 6 }} />
                <div style={{ height: 10, width: '75%', background: '#ECECE6', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes bilateralSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
