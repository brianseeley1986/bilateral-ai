import type { Metadata } from 'next'
import { neon } from '@neondatabase/serverless'
import { DebatesTabs } from '../Tabs'
import { LatestView } from '../latest/LatestView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'From Readers — Bilateral',
  description: 'Debates generated from questions submitted by Bilateral readers.',
  alternates: { canonical: 'https://bilateral.news/debates/readers' },
}

export default async function ReadersPage() {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    SELECT data FROM debates
    WHERE publish_status = 'published'
      AND data->>'sourceType' = 'user_submitted'
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
      librarySlug: null,
      libraryCategory: null,
      state: d.state || null,
      city: d.city || null,
      hook: d.suggestedHook || d.conservative?.previewLine || '',
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
            marginBottom: '32px',
            paddingTop: '20px',
          }}
        >
          <a
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#C1121F', flexShrink: 0 }} />
            <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0A0A0A' }}>
              bilateral
            </span>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1B4FBE', flexShrink: 0 }} />
          </a>
          <a href="/about" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
            About
          </a>
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
            Questions submitted by Bilateral readers, argued at full depth.
          </p>
        </div>

        <DebatesTabs active="readers" />
        <LatestView debates={debates} />
      </div>
    </main>
  )
}
