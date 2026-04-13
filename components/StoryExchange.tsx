'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import type { DebateOutput, LineByLineExchange, SatireExchange } from '@/types/debate'
import { DebateViewer } from './DebateViewer'

// --- Text-to-speech ---

interface SpeechSegment {
  text: string
  side: 'c' | 'l' | 'narrator'
  key: string
}

function buildScript(debate: DebateOutput): SpeechSegment[] {
  const segs: SpeechSegment[] = []
  const hook = debate.suggestedHook || debate.context?.whatHappened
  if (hook) segs.push({ text: hook, side: 'narrator', key: 'hook' })
  debate.exchanges?.forEach((ex, i) => {
    if (debate.leadingSide === 'liberal') {
      if (ex.l) segs.push({ text: ex.l, side: 'l', key: `ex-${i}-l` })
      if (ex.c) segs.push({ text: ex.c, side: 'c', key: `ex-${i}-c` })
      if (ex.lClose) segs.push({ text: ex.lClose, side: 'l', key: `ex-${i}-lClose` })
      if (ex.cRebuttal) segs.push({ text: ex.cRebuttal, side: 'c', key: `ex-${i}-cRebuttal` })
    } else {
      if (ex.c) segs.push({ text: ex.c, side: 'c', key: `ex-${i}-c` })
      if (ex.l) segs.push({ text: ex.l, side: 'l', key: `ex-${i}-l` })
      if (ex.cRebuttal) segs.push({ text: ex.cRebuttal, side: 'c', key: `ex-${i}-cRebuttal` })
      if (ex.lClose) segs.push({ text: ex.lClose, side: 'l', key: `ex-${i}-lClose` })
    }
  })
  if (debate.verdict) {
    const parts: string[] = []
    if (debate.verdict.agreements?.[0]) parts.push('Both sides agree: ' + debate.verdict.agreements[0])
    if (debate.verdict.conflicts?.[0]) parts.push('The real conflict: ' + debate.verdict.conflicts[0])
    if (debate.verdict.openQuestions?.[0]) parts.push('What nobody has answered: ' + debate.verdict.openQuestions[0])
    if (parts.length) segs.push({ text: parts.join('. '), side: 'narrator', key: 'verdict' })
  }
  return segs
}

function useSpeech(segments: SpeechSegment[]) {
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [currentIdx, setCurrentIdx] = useState(-1)

  const statusRef = useRef<'idle' | 'playing' | 'paused'>('idle')
  const currentIdxRef = useRef(-1)
  const segmentsRef = useRef(segments)
  segmentsRef.current = segments

  // speakAt stored in ref so onend always calls the latest version (no stale closure)
  const speakAtRef = useRef<(idx: number) => void>(() => {})
  speakAtRef.current = (idx: number) => {
    if (idx >= segmentsRef.current.length) {
      setStatus('idle'); statusRef.current = 'idle'
      setCurrentIdx(-1); currentIdxRef.current = -1
      return
    }
    const seg = segmentsRef.current[idx]
    const utt = new SpeechSynthesisUtterance(seg.text)
    utt.rate = 0.93
    utt.onend = () => {
      if (statusRef.current === 'playing') {
        const next = currentIdxRef.current + 1
        currentIdxRef.current = next
        setCurrentIdx(next)
        speakAtRef.current(next)
      }
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utt)
    setCurrentIdx(idx); currentIdxRef.current = idx
    setStatus('playing'); statusRef.current = 'playing'
  }

  useEffect(() => () => { window.speechSynthesis?.cancel() }, [])

  function play() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    speakAtRef.current(0)
  }
  function pause() {
    window.speechSynthesis.pause()
    setStatus('paused'); statusRef.current = 'paused'
  }
  function resume() {
    window.speechSynthesis.resume()
    setStatus('playing'); statusRef.current = 'playing'
  }
  function stop() {
    window.speechSynthesis.cancel()
    setStatus('idle'); statusRef.current = 'idle'
    setCurrentIdx(-1); currentIdxRef.current = -1
  }

  const activeSegment = currentIdx >= 0 ? (segments[currentIdx] ?? null) : null
  return { status, activeSegment, play, pause, resume, stop }
}

function ListenBar({ speech }: { speech: ReturnType<typeof useSpeech> }) {
  const pill: React.CSSProperties = {
    fontSize: '11px',
    color: '#6B6B6B',
    border: '0.5px solid #e0e0e0',
    padding: '4px 10px',
    borderRadius: '20px',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
  if (speech.status === 'idle') {
    return <button onClick={speech.play} style={pill}>▶ Listen</button>
  }
  const side = speech.activeSegment?.side
  const sideColor = side === 'c' ? '#C1121F' : side === 'l' ? '#1B4FBE' : '#9B9B9B'
  const sideLabel = side === 'c' ? 'Conservative' : side === 'l' ? 'Liberal' : ''
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {sideLabel && (
        <span style={{ fontSize: '11px', color: sideColor, fontWeight: 600 }}>● {sideLabel}</span>
      )}
      {speech.status === 'playing'
        ? <button onClick={speech.pause} style={pill}>⏸ Pause</button>
        : <button onClick={speech.resume} style={pill}>▶ Resume</button>
      }
      <button onClick={speech.stop} style={pill}>✕</button>
    </div>
  )
}

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


function FactionBlock({
  faction,
  color,
}: {
  faction?: { label: string; position: string; quote?: string | null; speaker?: string | null } | null
  color: string
}) {
  if (!faction) return null
  return (
    <div style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: `2px solid ${color}30` }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          color,
          marginBottom: '4px',
          textTransform: 'uppercase',
        }}
      >
        {faction.label}
      </div>
      <div style={{ fontSize: '14px', color: '#0A0A0A', marginBottom: '4px', lineHeight: 1.5 }}>
        {faction.position}
      </div>
      {faction.quote && (
        <div style={{ fontSize: '13px', color: '#6B6B6B', fontStyle: 'italic', lineHeight: 1.5 }}>
          &ldquo;{faction.quote}&rdquo;
          {faction.speaker && ` — ${faction.speaker}`}
        </div>
      )}
    </div>
  )
}

function ShareRow({ id, headline }: { id: string; headline: string }) {
  const [copied, setCopied] = useState(false)
  const url = `https://bilateral.news/debate/${id}?h=${encodeURIComponent(headline)}`
  const cleanUrl = `https://bilateral.news/debate/${id}`
  const pillStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#6B6B6B',
    border: '0.5px solid #e0e0e0',
    padding: '4px 10px',
    borderRadius: '20px',
    textDecoration: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 120ms',
  }
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(headline)}&url=${encodeURIComponent(cleanUrl)}&via=bilateralnews`}
        target="_blank"
        rel="noopener noreferrer"
        style={pillStyle}
      >
        Share on X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={pillStyle}
      >
        LinkedIn
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={pillStyle}
      >
        Facebook
      </a>
      <a
        href={`https://www.threads.net/intent/post?text=${encodeURIComponent(headline + ' ' + url)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={pillStyle}
      >
        Threads
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(headline + ' ' + url)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={pillStyle}
      >
        WhatsApp
      </a>
      <a
        href={`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(headline)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={pillStyle}
      >
        Reddit
      </a>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {}
        }}
        style={pillStyle}
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}

export function StoryExchange({
  debate,
  showHeadline = true,
}: {
  debate: DebateOutput
  showHeadline?: boolean
}) {
  const [deep, setDeep] = useState(false)
  const badge = resolveBadge(debate.track, debate.sourceType, debate.geographicScope)
  const isSatire = debate.track === 'satire'
  const script = useMemo(() => buildScript(debate), [debate.id])
  const speech = useSpeech(script)

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
        {showHeadline && (
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
        )}
        <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#6B6B6B', margin: '0 0 20px' }}>
          {debate.context?.whatHappened}
        </p>
        <ShareRow id={debate.id} headline={debate.headline} />
        {!isSatire && (
          <div style={{ marginTop: '-12px', marginBottom: '24px' }}>
            <ListenBar speech={speech} />
          </div>
        )}
      </div>

      {/* Faction notice — shown when a significant internal split exists */}
      {!isSatire && debate.factionAlert?.detected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 14px',
            background:
              debate.factionAlert.dividedSide === 'conservative'
                ? '#fefce8'
                : debate.factionAlert.dividedSide === 'liberal'
                ? '#f5f3ff'
                : '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#6B6B6B',
            lineHeight: 1.6,
            borderLeft: `3px solid ${
              debate.factionAlert.dividedSide === 'conservative'
                ? '#d97706'
                : debate.factionAlert.dividedSide === 'liberal'
                ? '#7c3aed'
                : '#9ca3af'
            }`,
          }}
        >
          <span style={{ fontSize: '14px' }}>⚡</span>
          <span>
            {debate.factionAlert.dividedSide === 'conservative'
              ? `The conservative argument in this debate represents the dominant ${
                  debate.factionAlert.dominantPosition?.conservative || 'MAGA'
                } position. A significant conservative faction disagrees — see The Divide below.`
              : debate.factionAlert.dividedSide === 'liberal'
              ? `The liberal argument in this debate represents the dominant ${
                  debate.factionAlert.dominantPosition?.liberal || 'mainstream'
                } position. A significant liberal faction disagrees — see The Divide below.`
              : `Both sides have significant internal splits on this story. Arguments below represent the dominant positions on each side — see The Divide below for the full picture.`}
          </span>
        </div>
      )}

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
              fontSize: '16px',
              lineHeight: 1.7,
              color: '#6B6B6B',
              margin: '0 0 16px',
              fontWeight: 400,
              fontStyle: 'italic',
            }}
          >
            {debate.suggestedHook || debate.context?.whatHappened}
          </p>
          <div style={{ fontSize: '12px', color: '#9B9B9B', marginTop: '-4px' }}>
            Not familiar with this story?{' '}
            <a
              href="#context"
              onClick={(e) => {
                e.preventDefault()
                setDeep(true)
                setTimeout(() => {
                  document.getElementById('context')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 80)
              }}
              style={{ color: '#6B6B6B', textDecoration: 'underline', textUnderlineOffset: '2px' }}
            >
              Get context →
            </a>
          </div>
        </div>
      )}

      {/* Line-by-line exchange */}
      {isSatire && debate.satireExchanges ? (
        <SatireExchanges exchanges={debate.satireExchanges} closer={debate.satireCloser || ''} />
      ) : debate.exchanges ? (
        <SeriousExchanges exchanges={debate.exchanges} leadingSide={debate.leadingSide} activeKey={speech.activeSegment?.key} />
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

      {/* THE DIVIDE card — shown when faction split detected */}
      {!isSatire && debate.factionAlert?.detected && debate.divideCard && (
        <div
          style={{
            margin: '32px 0',
            padding: '20px 24px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#9B9B9B',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            The Divide
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#6B6B6B',
              fontStyle: 'italic',
              marginBottom: '20px',
              lineHeight: 1.6,
            }}
          >
            {debate.divideCard.introLine}
          </div>
          {debate.divideCard.conservativeDivide?.show && (
            <div style={{ marginBottom: '20px' }}>
              <FactionBlock faction={debate.divideCard.conservativeDivide.faction1} color="#C1121F" />
              <FactionBlock faction={debate.divideCard.conservativeDivide.faction2} color="#C1121F" />
            </div>
          )}
          {debate.divideCard.liberalDivide?.show && (
            <div>
              <FactionBlock faction={debate.divideCard.liberalDivide.faction1} color="#1B4FBE" />
              <FactionBlock faction={debate.divideCard.liberalDivide.faction2} color="#1B4FBE" />
            </div>
          )}
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

      {/* Sources — hidden for satire */}
      {!isSatire && Array.isArray(debate.sources) && debate.sources.length > 0 && (
        <div
          style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid #E5E5DD',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#9A9A92',
              marginBottom: '14px',
            }}
          >
            Sources
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(debate.sources as any[]).map((s, i) => {
              if (s && typeof s === 'object' && typeof s.url === 'string') {
                const title = s.title || s.url
                const outlet = s.outlet || s.source || ''
                return (
                  <li
                    key={i}
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: '#3A3A3A',
                      marginBottom: '6px',
                    }}
                  >
                    {outlet && (
                      <span style={{ fontWeight: 500, marginRight: '6px' }}>{outlet}</span>
                    )}
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1B4FBE', textDecoration: 'underline' }}
                    >
                      {title}
                    </a>
                  </li>
                )
              }
              const text = typeof s === 'string' ? s : JSON.stringify(s)
              return (
                <li
                  key={i}
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: '#3A3A3A',
                    marginBottom: '6px',
                  }}
                >
                  {text}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Go Deeper — hidden for satire */}
      {!isSatire && debate.conservative && (
        <>
          <div id="context" style={{ marginTop: '40px', textAlign: 'center' }}>
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
              {deep ? 'Collapse ↑' : 'Go deeper →'}
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

function SeriousExchanges({ exchanges, leadingSide, activeKey }: { exchanges: LineByLineExchange[]; leadingSide?: 'conservative' | 'liberal' | null; activeKey?: string | null }) {
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
            {leadingSide === 'liberal' ? (
              <>
                <Turn side="l" text={ex.l} isActive={activeKey === `ex-${i}-l`} />
                <Turn side="c" text={ex.c} isActive={activeKey === `ex-${i}-c`} />
                <Turn side="l" text={ex.lClose} isActive={activeKey === `ex-${i}-lClose`} />
                <Turn side="c" text={ex.cRebuttal} isActive={activeKey === `ex-${i}-cRebuttal`} />
              </>
            ) : (
              <>
                <Turn side="c" text={ex.c} isActive={activeKey === `ex-${i}-c`} />
                <Turn side="l" text={ex.l} isActive={activeKey === `ex-${i}-l`} />
                <Turn side="c" text={ex.cRebuttal} isActive={activeKey === `ex-${i}-cRebuttal`} />
                <Turn side="l" text={ex.lClose} isActive={activeKey === `ex-${i}-lClose`} />
              </>
            )}
          </div>
          <div style={{ borderBottom: '0.5px solid #d0d0d0' }} />
        </div>
      ))}
    </div>
  )
}

function Turn({ side, text, isActive }: { side: 'c' | 'l'; text: string; isActive?: boolean }) {
  const color = side === 'c' ? '#C1121F' : '#1B4FBE'
  const label = side === 'c' ? 'C' : 'L'
  return (
    <div style={{
      display: 'flex', gap: '14px', padding: '12px 0',
      background: isActive ? (side === 'c' ? '#fff5f5' : '#f0f4ff') : 'transparent',
      borderRadius: isActive ? '6px' : undefined,
      transition: 'background 0.3s',
    }}>
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
        {text}
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
