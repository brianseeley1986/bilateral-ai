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
      AND track != 'satire'
    ORDER BY created_at DESC
    LIMIT 200
  `
  const rawDebates = rows.map((r: any) => {
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

  // Defensive dedupe: if the same headline appears more than once, keep
  // the oldest (most established) row and drop the rest.
  const seen = new Set<string>()
  const debates = rawDebates
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .filter((d) => {
      const key = (d.headline || '').trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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
        <div style={{ marginBottom: '24px', paddingTop: '20px' }}>
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
