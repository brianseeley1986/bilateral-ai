'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const placeholders = [
  'Iran ceasefire...',
  'Costco hot dog...',
  'Your school board...',
  'Anything at all...',
]

const statuses = [
  'Classifying the story...',
  'Briefing the researcher...',
  'Pulling historical context...',
  'Building the Conservative case...',
  'Building the Liberal case...',
  'Running the rebuttal round...',
  'Mapping the fault lines...',
  'Structuring the exchange...',
  'Drafting the social package...',
]

export function HeadlineInput() {
  const [headline, setHeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
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
      if (!res.ok) {
        setStatus('Pipeline failed. Check server logs and try again.')
        setLoading(false)
        return
      }
      const { id } = await res.json()
      router.push(`/debate/${id}`)
    } catch {
      clearInterval(interval)
      setStatus('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#fff',
          border: '0.5px solid #d0d0d0',
          borderRadius: '32px',
          padding: '14px 22px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        }}
      >
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
          placeholder={placeholder}
          disabled={loading}
          style={{
            flex: 1,
            fontSize: '17px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#0A0A0A',
            fontFamily: 'inherit',
            padding: '4px 0',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !headline.trim()}
          style={{
            background: loading || !headline.trim() ? '#e5e5e5' : '#0A0A0A',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: loading || !headline.trim() ? 'default' : 'pointer',
            flexShrink: 0,
          }}
        >
          {loading ? '...' : 'Run'}
        </button>
      </div>
      <div
        style={{
          textAlign: 'center',
          marginTop: '14px',
          fontSize: '13px',
          color: '#6B6B6B',
          minHeight: '18px',
        }}
      >
        {loading ? status : 'Two minds. Every story. You decide.'}
      </div>
    </div>
  )
}
