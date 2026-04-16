'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const placeholders = [
  'Iran ceasefire…',
  'Costco hot dog…',
  'Your school board…',
  'Anything at all…',
]

const statuses = [
  'Analyzing the story…',
  'Researching context…',
  'Building the Conservative case…',
  'Building the Liberal case…',
  'Running the rebuttal round…',
  'Mapping where they agree and disagree…',
  'Finalizing the debate…',
]

export function HeadlineInput() {
  const [headline, setHeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [focused, setFocused] = useState(false)
  const [placeholder, setPlaceholder] = useState(placeholders[0])
  const router = useRouter()
  const pIdx = useRef(0)

  useEffect(() => {
    if (loading) return
    const t = setInterval(() => {
      pIdx.current = (pIdx.current + 1) % placeholders.length
      setPlaceholder(placeholders[pIdx.current])
    }, 2500)
    return () => clearInterval(t)
  }, [loading])

  async function handleSubmit() {
    if (!headline.trim() || loading) return
    setLoading(true)
    let i = 0
    setStatus(statuses[0])
    const interval = setInterval(() => {
      i = Math.min(i + 1, statuses.length - 1)
      setStatus(statuses[i])
    }, 5000)

    try {
      const res = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline }),
      })
      clearInterval(interval)
      const data = await res.json()
      if (!res.ok) {
        setStatus('Pipeline failed. Try again.')
        setLoading(false)
        return
      }
      const targetId = data.id || data.existingDebateId
      if (targetId) {
        router.push(`/debate/${targetId}`)
        return
      }
      setStatus('Something went wrong. Try again.')
      setLoading(false)
    } catch {
      clearInterval(interval)
      setStatus('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const enabled = !loading && headline.trim().length > 0

  return (
    <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#fff',
          border: `1px solid ${focused ? '#0A0A0A' : '#DCDCD6'}`,
          borderRadius: 999,
          padding: '14px 10px 14px 26px',
          transition: 'border-color 140ms ease, box-shadow 140ms ease',
          boxShadow: focused ? '0 6px 24px rgba(10,10,10,0.08)' : '0 1px 2px rgba(10,10,10,0.04)',
        }}
      >
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          placeholder={placeholder}
          disabled={loading}
          style={{
            flex: 1,
            fontSize: 19,
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontStyle: headline ? 'normal' : 'italic',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#0A0A0A',
            padding: '2px 0',
            letterSpacing: '-0.01em',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!enabled}
          aria-label="Generate debate"
          style={{
            background: enabled ? '#0A0A0A' : '#ECECE6',
            color: enabled ? '#F5F5F0' : '#9B9B96',
            border: 'none',
            borderRadius: 999,
            padding: '10px 22px',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: enabled ? 'pointer' : 'default',
            flexShrink: 0,
            transition: 'background 140ms ease',
          }}
        >
          {loading ? '…' : 'Debate'}
        </button>
      </label>
      <div
        style={{
          textAlign: 'center',
          marginTop: 14,
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 14,
          color: '#6B6B6B',
          minHeight: 18,
          letterSpacing: '0.005em',
        }}
      >
        {loading ? status : ''}
      </div>
    </div>
  )
}
