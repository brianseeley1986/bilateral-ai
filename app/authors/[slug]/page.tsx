import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { neon } from '@neondatabase/serverless'
import { getPersonaBySlug, PERSONA_LIST } from '@/lib/personas'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = getPersonaBySlug(params.slug)
  if (!p) return {}
  const url = `https://bilateral.news/authors/${p.slug}`
  return {
    title: `${p.name} — ${p.title} at Bilateral`,
    description: p.bio,
    alternates: { canonical: url },
    openGraph: {
      title: `${p.name} — ${p.title}`,
      description: p.bio,
      url,
      siteName: 'Bilateral',
      type: 'profile',
    },
    twitter: { card: 'summary', title: p.name, description: p.bio },
  }
}

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const p = getPersonaBySlug(params.slug)
  if (!p) notFound()

  const sql = neon(process.env.DATABASE_URL!)
  const recent = (await sql`
    SELECT id, slug, headline, created_at
    FROM debates
    WHERE publish_status = 'published'
    ORDER BY created_at DESC
    LIMIT 12
  `) as Array<{ id: string; slug: string | null; headline: string; created_at: Date }>

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    jobTitle: p.title,
    description: p.bio,
    url: `https://bilateral.news/authors/${p.slug}`,
    worksFor: { '@type': 'Organization', name: 'Bilateral', url: 'https://bilateral.news' },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

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

      <section style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: p.color,
              color: '#F5F5F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            {p.initials}
          </div>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{p.name}</h1>
            <div style={{ fontSize: 14, color: '#6B6B6B', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
              {p.title}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 17, lineHeight: 1.55, color: '#1a1a1a', margin: '0 0 28px' }}>{p.bio}</p>

        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6B6B', margin: '32px 0 14px' }}>
          Methodology
        </h2>
        <ol style={{ paddingLeft: 22, margin: 0, lineHeight: 1.55, color: '#1a1a1a' }}>
          {p.methodology.map((step, i) => (
            <li key={i} style={{ marginBottom: 8 }}>{step}</li>
          ))}
        </ol>

        <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6B6B', margin: '40px 0 14px' }}>
          Recent debates
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recent.map((r) => (
            <li key={r.id}>
              <Link
                href={`/debate/${r.slug || r.id}`}
                style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', textDecoration: 'none', lineHeight: 1.4 }}
              >
                {r.headline}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export function generateStaticParams() {
  return PERSONA_LIST.map((p) => ({ slug: p.slug }))
}
