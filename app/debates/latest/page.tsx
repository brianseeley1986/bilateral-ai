import Link from 'next/link'
import type { Metadata } from 'next'
import { neon } from '@neondatabase/serverless'
import { initDb } from '@/lib/db'
import { DebatesTabs } from '../Tabs'
import { LatestView } from './LatestView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Latest debates — Bilateral',
  description:
    'Every Bilateral debate in chronological order. Conservative and liberal arguments at full depth on today\u2019s headlines.',
  openGraph: {
    title: 'Latest debates — Bilateral',
    description: 'Every Bilateral debate in chronological order.',
    url: 'https://bilateral.news/debates/latest',
    siteName: 'Bilateral',
    type: 'website',
  },
}

export default async function LatestDebatesPage() {
  await initDb()
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    SELECT data FROM debates
    WHERE publish_status = 'published'
    ORDER BY created_at DESC
    LIMIT 200
  `
  const debates = rows.map((r: any) => {
    const d = r.data
    return {
      id: d.id,
      headline: d.headline,
      track: d.track,
      geographicScope: d.geographicScope,
      createdAt: d.createdAt,
      sourceType: d.sourceType,
      librarySlug: d.librarySlug || null,
      libraryCategory: d.libraryCategory || null,
      state: d.state || null,
      city: d.city || null,
      hook: d.suggestedHook || d.conservative?.previewLine || d.satireExchanges?.[0]?.a || '',
    }
  })

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
            Every debate on Bilateral, most recent first.
          </p>
        </div>

        <DebatesTabs active="latest" />
        <LatestView debates={debates} />
      </div>
    </main>
  )
}
