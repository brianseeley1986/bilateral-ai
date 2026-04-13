'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { LibraryCategory, LibraryCategoryMeta } from '@/lib/library-questions'

interface Q {
  question: string
  category: string
  slug: string
  hook: string | null
  status: string
  debateId: string | null
}

export function ByTopicView({
  questions,
  categories,
}: {
  questions: Q[]
  categories: LibraryCategoryMeta[]
}) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState<LibraryCategory | 'all'>('all')

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return questions.filter((q) => {
      if (cat !== 'all' && q.category !== cat) return false
      if (needle && !q.question.toLowerCase().includes(needle)) return false
      return true
    })
  }, [questions, search, cat])

  const grouped = useMemo(() => {
    const map: Record<string, Q[]> = {}
    for (const q of filtered) {
      map[q.category] = map[q.category] || []
      map[q.category].push(q)
    }
    return map
  }, [filtered])

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search questions..."
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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <Pill active={cat === 'all'} onClick={() => setCat('all')}>
          All
        </Pill>
        {categories.map((c) => (
          <Pill key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </Pill>
        ))}
      </div>

      {categories
        .filter((c) => cat === 'all' || cat === c.id)
        .map((c) => {
          const items = grouped[c.id] || []
          if (!items.length) return null
          return (
            <section key={c.id} style={{ marginBottom: '48px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#0A0A0A',
                    margin: '0 0 4px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {c.label}
                </h2>
                <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>{c.blurb}</p>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '14px',
                }}
              >
                {items.map((q) => (
                  <QuestionCard key={q.slug} q={q} />
                ))}
              </div>
            </section>
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
          No questions match that filter.
        </div>
      )}
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

function QuestionCard({ q }: { q: Q }) {
  const published = q.status === 'published' && q.debateId
  return (
    <Link
      href={`/debates/${q.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        padding: '18px 18px 16px',
        background: '#FFF',
        border: '1px solid #E5E5DD',
        borderRadius: '8px',
        transition: 'border-color 0.15s',
      }}
    >
      <div
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: '#0A0A0A',
          lineHeight: 1.4,
          marginBottom: '8px',
        }}
      >
        {q.question}
      </div>
      {q.hook && (
        <div style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.5, marginBottom: '12px' }}>
          {q.hook}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
        }}
      >
        <span
          style={{
            color: published ? '#0A0A0A' : '#6B6B6B',
            fontWeight: published ? 600 : 400,
          }}
        >
          {published ? 'Read the debate →' : 'Coming soon'}
        </span>
      </div>
    </Link>
  )
}
