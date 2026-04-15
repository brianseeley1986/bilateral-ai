import Link from 'next/link'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'
export const revalidate = 600

async function getRecent() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = (await sql`
      SELECT id, slug, headline FROM debates
      WHERE publish_status = 'published'
      ORDER BY created_at DESC
      LIMIT 6
    `) as Array<{ id: string; slug: string | null; headline: string }>
    return rows
  } catch {
    return []
  }
}

export default async function NotFound() {
  const recent = await getRecent()
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
      </header>

      <section style={{ maxWidth: 720, margin: '0 auto' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#6B6B6B', textTransform: 'uppercase' }}>
          404 — Page not found
        </span>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 12px' }}>
          That debate has slipped its leash.
        </h1>
        <p style={{ fontSize: 17, color: '#444', lineHeight: 1.55, margin: '0 0 36px' }}>
          The link you followed doesn&apos;t match a debate we&apos;re running. Try a recent one below, or browse by topic.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
          <Link
            href="/"
            style={{
              padding: '10px 18px',
              background: '#0A0A0A',
              color: '#F5F5F0',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            All debates
          </Link>
          <Link
            href="/topics"
            style={{
              padding: '10px 18px',
              background: '#F5F5F0',
              color: '#0A0A0A',
              border: '1px solid #0A0A0A',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Browse topics
          </Link>
        </div>

        {recent.length > 0 && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6B6B', margin: '0 0 14px' }}>
              Recent debates
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recent.map((r) => (
                <li key={r.id} style={{ borderTop: '1px solid #E5E5DD', paddingTop: 12 }}>
                  <Link
                    href={`/debate/${r.slug || r.id}`}
                    style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', textDecoration: 'none', lineHeight: 1.4 }}
                  >
                    {r.headline}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  )
}
