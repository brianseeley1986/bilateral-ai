import Link from 'next/link'
import type { Metadata } from 'next'
import { initDb, getAllLibraryQuestions } from '@/lib/db'
import { LIBRARY_CATEGORIES } from '@/lib/library-questions'
import { DebatesTabs } from './Tabs'
import { ByTopicView } from './ByTopicView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Debates — Bilateral',
  description:
    'Browse the most contested questions in American life and the chronological archive of every Bilateral debate.',
  openGraph: {
    title: 'The Bilateral Debates',
    description: 'The argument behind every headline. Browse by topic or by date.',
    url: 'https://bilateral.news/debates',
    siteName: 'Bilateral',
    type: 'website',
  },
}

export default async function DebatesPage() {
  await initDb()
  const rows = await getAllLibraryQuestions()

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F5F0',
        padding: '24px 24px 96px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                fontSize: '17px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#0A0A0A',
              }}
            >
              bilateral
            </span>
            <span style={{ fontSize: '12px', color: '#6B6B6B' }}>bilateral.news</span>
          </Link>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
              Home
            </Link>
            <Link href="/about" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
              About
            </Link>
          </div>
        </header>

        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '44px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#0A0A0A',
              margin: '0 0 8px',
            }}
          >
            The Debates
          </h1>
          <p style={{ fontSize: '17px', color: '#6B6B6B', margin: 0, maxWidth: '680px' }}>
            The most contested questions in American life. Both sides argued at full depth.
          </p>
        </div>

        <DebatesTabs active="topic" />
        <ByTopicView
          questions={rows.map((r) => ({
            question: r.question,
            category: r.category,
            slug: r.slug,
            hook: r.hook,
            status: r.status,
            debateId: r.debate_id,
          }))}
          categories={LIBRARY_CATEGORIES}
        />
      </div>
    </main>
  )
}
