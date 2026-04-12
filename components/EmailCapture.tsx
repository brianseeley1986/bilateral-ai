'use client'
import { useState } from 'react'

const TOPICS = [
  { id: 'economics', label: 'Economics & Markets' },
  { id: 'foreign_policy', label: 'Foreign Policy' },
  { id: 'education', label: 'Education' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'technology', label: 'Technology' },
  { id: 'immigration', label: 'Immigration' },
  { id: 'climate', label: 'Climate & Energy' },
  { id: 'legal', label: 'Legal & Supreme Court' },
  { id: 'local', label: 'Local & Community' },
  { id: 'politics', label: 'Politics & Elections' },
  { id: 'satire', label: 'Satire' },
]

type Step = 'email' | 'topics' | 'location' | 'done'

interface LocationData {
  city?: string
  region?: string
  zip?: string
  latitude?: number
  longitude?: number
}

export function EmailCapture() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [location, setLocation] = useState<LocationData>({})
  const [zipInput, setZipInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleTopic(id: string) {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function requestLocation() {
    if (!navigator.geolocation) {
      setStep('done')
      await submit({})
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        setLocation(loc)
        await submit(loc)
      },
      async () => {
        await submit({})
      }
    )
  }

  async function submitWithZip() {
    const loc = { zip: zipInput }
    setLocation(loc)
    await submit(loc)
  }

  async function submit(loc: LocationData) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, topics: selectedTopics, ...loc }),
      })
      if (!res.ok) throw new Error('Failed')
      setStep('done')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '24px',
          background: '#f8f8f6',
          borderRadius: '12px',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>Check your inbox</div>
        <div style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.6 }}>
          We sent a confirmation to {email}. Click the link to start receiving your personalized debate
          digest.
        </div>
      </div>
    )
  }

  if (step === 'location') {
    return (
      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          padding: '24px',
          background: '#f8f8f6',
          borderRadius: '12px',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>
          Want local debates too?
        </div>
        <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '20px', lineHeight: 1.6 }}>
          We can surface debates relevant to your community — school boards, city council votes, local
          referenda.
        </div>
        <button
          onClick={requestLocation}
          style={{
            width: '100%',
            padding: '11px',
            background: '#0A0A0A',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          Use my location
        </button>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Or enter zip code"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '0.5px solid #d0d0d0',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={submitWithZip}
            disabled={!zipInput || loading}
            style={{
              padding: '10px 16px',
              background: zipInput ? '#0A0A0A' : '#ccc',
              color: '#F5F5F0',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: zipInput ? 'pointer' : 'default',
            }}
          >
            Go
          </button>
        </div>
        <button
          onClick={() => submit({})}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            color: '#6B6B6B',
            border: '0.5px solid #d0d0d0',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Skip — national content only
        </button>
      </div>
    )
  }

  if (step === 'topics') {
    return (
      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          padding: '24px',
          background: '#f8f8f6',
          borderRadius: '12px',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>
          What topics matter to you?
        </div>
        <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '16px' }}>
          Pick as many as you want.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => toggleTopic(topic.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                border: selectedTopics.includes(topic.id) ? 'none' : '0.5px solid #d0d0d0',
                background: selectedTopics.includes(topic.id) ? '#0A0A0A' : 'transparent',
                color: selectedTopics.includes(topic.id) ? '#F5F5F0' : '#444',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {topic.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStep('location')}
          disabled={selectedTopics.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            background: selectedTopics.length > 0 ? '#0A0A0A' : '#ccc',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: selectedTopics.length > 0 ? 'pointer' : 'default',
          }}
        >
          Continue{selectedTopics.length > 0 && ` (${selectedTopics.length} selected)`}
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 0' }}>
      <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
        Get today&apos;s debates in your inbox.
      </div>
      <div style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '14px' }}>
        Personalized by topic. Delivered every morning.
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && email.includes('@')) setStep('topics')
          }}
          style={{
            flex: 1,
            padding: '11px 14px',
            border: '0.5px solid #d0d0d0',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={() => {
            if (email.includes('@')) setStep('topics')
          }}
          disabled={!email.includes('@')}
          style={{
            padding: '11px 20px',
            background: email.includes('@') ? '#0A0A0A' : '#ccc',
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: email.includes('@') ? 'pointer' : 'default',
            whiteSpace: 'nowrap',
          }}
        >
          Subscribe
        </button>
      </div>
      {error && <div style={{ fontSize: '13px', color: '#C1121F', marginTop: '8px' }}>{error}</div>}
      <div style={{ fontSize: '11px', color: '#9B9B9B', marginTop: '8px' }}>
        No spam. Unsubscribe anytime.
      </div>
    </div>
  )
}
