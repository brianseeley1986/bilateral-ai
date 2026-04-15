import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { neon } from '@neondatabase/serverless'
import { getTopic, topicMatchClause } from '@/lib/topics'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const topic = getTopic(params.slug)
  if (!topic) return {}
  const url = `https://bilateral.news/topics/${topic.slug}`
  return {
    title: `${topic.title} debates — Bilateral`,
    description: topic.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${topic.title} debates — Bilateral`,
      description: topic.description,
      url,
      siteName: 'Bilateral',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${topic.title} debates`,
      description: topic.description,
    },
  }
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const topic = getTopic(params.slug)
  if (!topic) notFound()

  const sql = neon(process.env.DATABASE_URL!)
  const clause = topicMatchClause(topic)
  const rows = (await sql.query(
    `SELECT id, slug, headline, created_at FROM debates
     WHERE publish_status = 'published' AND (${clause})
     ORDER BY created_at DESC LIMIT 200`
  )) as Array<{ id: string; slug: string | null; headline: string; created_at: Date }>

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
        <Link href="/topics" style={{ fontSize: 12, color: '#6B6B6B', textDecoration: 'none' }}>
          ← All topics
        </Link>
      </header>

      <section style={{ maxWidth: 800, margin: '0 auto' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#6B6B6B', textTransform: 'uppercase' }}>
          Topic
        </span>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.025em', margin: '6px 0 12px' }}>
          {topic.title}
        </h1>
        <p style={{ fontSize: 18, color: '#1a1a1a', margin: '0 0 16px', lineHeight: 1.55, fontWeight: 500 }}>{topic.description}</p>
        <p style={{ fontSize: 16, color: '#333', margin: '0 0 36px', lineHeight: 1.6 }}>{topic.intro}</p>

        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6B6B', margin: '0 0 18px' }}>
          {rows.length} {rows.length === 1 ? 'debate' : 'debates'}
        </h2>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rows.map((r) => (
            <li key={r.id} style={{ borderTop: '1px solid #E5E5DD', paddingTop: 16 }}>
              <Link
                href={`/debate/${r.slug || r.id}`}
                style={{ display: 'block', fontSize: 18, fontWeight: 600, color: '#0A0A0A', textDecoration: 'none', lineHeight: 1.35, letterSpacing: '-0.01em' }}
              >
                {r.headline}
              </Link>
              <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 4 }}>
                {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export function generateStaticParams() {
  return []
}
