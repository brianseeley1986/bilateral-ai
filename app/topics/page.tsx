import Link from 'next/link'
import type { Metadata } from 'next'
import { neon } from '@neondatabase/serverless'
import { TOPICS, topicMatchClause } from '@/lib/topics'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Topics — Bilateral',
  description: 'Browse Bilateral debates by topic: economy, immigration, healthcare, foreign policy, and more.',
  alternates: { canonical: 'https://bilateral.news/topics' },
}

export default async function TopicsIndex() {
  const sql = neon(process.env.DATABASE_URL!)

  // Per-topic count using one query, indexed by topic slug
  const counts: Record<string, number> = {}
  for (const t of TOPICS) {
    try {
      const clause = topicMatchClause(t)
      const rows = (await sql.query(
        `SELECT COUNT(*)::int AS n FROM debates WHERE publish_status = 'published' AND (${clause})`
      )) as Array<{ n: number }>
      counts[t.slug] = rows[0]?.n ?? 0
    } catch {
      counts[t.slug] = 0
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F5F0',
        padding: '24px 24px 96px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1100px',
          margin: '0 auto 56px',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#C1121F' }} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: '#0A0A0A' }}>bilateral</span>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1B4FBE' }} />
        </Link>
        <Link href="/" style={{ fontSize: 12, color: '#6B6B6B', textDecoration: 'none' }}>
          ← Back to feed
        </Link>
      </header>

      <section style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Topics
        </h1>
        <p style={{ fontSize: 16, color: '#6B6B6B', margin: '0 0 32px', lineHeight: 1.5 }}>
          Browse every debate by theme.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {TOPICS.map((t) => (
            <li
              key={t.slug}
              style={{ borderTop: '1px solid #E5E5DD', paddingTop: 18 }}
            >
              <Link
                href={`/topics/${t.slug}`}
                style={{ textDecoration: 'none', color: '#0A0A0A', display: 'block' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.015em' }}>{t.title}</h2>
                  <span style={{ fontSize: 13, color: '#6B6B6B' }}>{counts[t.slug]} debates</span>
                </div>
                <p style={{ fontSize: 15, color: '#444', margin: '6px 0 0', lineHeight: 1.4 }}>{t.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
