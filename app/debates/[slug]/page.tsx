import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { neon } from '@neondatabase/serverless'
import { StoryExchange } from '@/components/StoryExchange'
import { LIBRARY_CATEGORIES } from '@/lib/library-questions'

export const dynamic = 'force-dynamic'

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'should', 'would', 'could', 'will', 'shall', 'to', 'of', 'in', 'on',
  'for', 'with', 'at', 'by', 'from', 'as', 'this', 'that', 'these', 'those',
  'have', 'has', 'had', 'do', 'does', 'did', 'not', 'it', 'its', 'than', 'too',
  'us', 'we', 'our', 'their', 'they', 'you', 'your', 'up', 'out', 'so', 'if',
  'what', 'how', 'any', 'all', 'more', 'most', 'some', 'many',
])

function extractKeywords(question: string): string[] {
  return Array.from(
    new Set(
      question
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
    )
  ).slice(0, 6)
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`SELECT id, slug, question, category, hook, status, debate_id, search_volume_tier FROM library_questions WHERE slug = ${params.slug} LIMIT 1`
  const row = rows[0] ?? null
  if (!row) return {}
  const title = `${row.question} — Bilateral`
  const description =
    row.hook ||
    `The conservative and liberal case on ${row.question.toLowerCase().replace(/\?$/, '')}, both argued at full depth.`
  return {
    title,
    description,
    openGraph: {
      title: row.question,
      description: 'Two minds. Full depth. You decide.',
      url: `https://bilateral.news/debates/${row.slug}`,
      siteName: 'Bilateral',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: row.question,
      description: 'Two minds. Full depth. You decide.',
      site: '@bilateralnews',
    },
  }
}

export default async function LibraryQuestionPage({
  params,
}: {
  params: { slug: string }
}) {
  const sql = neon(process.env.DATABASE_URL!)
  const lqRows = await sql`SELECT id, slug, question, category, hook, status, debate_id, search_volume_tier FROM library_questions WHERE slug = ${params.slug} LIMIT 1`
  const row = lqRows[0] ?? null
  if (!row) notFound()

  const debate = row.debate_id
    ? await sql`SELECT data FROM debates WHERE id = ${row.debate_id}`.then(r => r[0]?.data ?? null)
    : null
  const categoryMeta = LIBRARY_CATEGORIES.find((c) => c.id === row.category)

  // "In the news" — recent non-library debates whose headlines share keywords
  let inTheNews: Array<{ id: string; headline: string; createdAt: string }> = []
  if (row.status === 'published') {
    const keywords = extractKeywords(row.question)
    if (keywords.length) {
      const pattern = keywords.map((k) => `%${k}%`)
      const rows = await sql`
        SELECT id, headline, created_at, data
        FROM debates
        WHERE publish_status = 'published'
          AND (data->>'sourceType') IS DISTINCT FROM 'library'
          AND id <> ${row.debate_id || ''}
          AND EXISTS (
            SELECT 1 FROM unnest(${pattern}::text[]) kw
            WHERE headline ILIKE kw
          )
        ORDER BY created_at DESC
        LIMIT 5
      `
      inTheNews = rows.map((r: any) => ({
        id: r.id,
        headline: r.headline,
        createdAt: r.created_at,
      }))
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
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#C1121F', flexShrink: 0 }} />
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
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1B4FBE', flexShrink: 0 }} />
          </Link>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a href="/about" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
              About
            </a>
            <Link href="/debates" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
              ← The Debates
            </Link>
          </div>
        </header>

        <div style={{ marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#6B6B6B',
            }}
          >
            {categoryMeta?.label || row.category}
          </span>
        </div>
        <h1
          style={{
            fontSize: '40px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#0A0A0A',
            margin: '0 0 12px',
            lineHeight: 1.2,
          }}
        >
          {row.question}
        </h1>
        {row.hook && (
          <p
            style={{
              fontSize: '18px',
              color: '#6B6B6B',
              margin: '0 0 40px',
              maxWidth: '720px',
              lineHeight: 1.5,
            }}
          >
            {row.hook}
          </p>
        )}

        {row.status === 'published' && debate ? (
          <>
            <StoryExchange debate={debate} showHeadline={false} />

            {inTheNews.length > 0 && (
              <section
                style={{
                  marginTop: '72px',
                  paddingTop: '40px',
                  borderTop: '1px solid #E5E5DD',
                }}
              >
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#0A0A0A',
                    margin: '0 0 20px',
                  }}
                >
                  In the news
                </h2>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {inTheNews.map((n) => (
                    <Link
                      key={n.id}
                      href={`/debate/${n.id}`}
                      style={{
                        display: 'block',
                        padding: '14px 18px',
                        background: '#FFF',
                        border: '1px solid #E5E5DD',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#0A0A0A',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#6B6B6B',
                          marginBottom: '4px',
                        }}
                      >
                        {new Date(n.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.4 }}>
                        {n.headline}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <ComingSoon status={row.status} />
        )}
      </div>
    </main>
  )
}

function ComingSoon({ status }: { status: string }) {
  const generating = status === 'generating'
  return (
    <div
      style={{
        background: '#FFF',
        border: '1px solid #E5E5DD',
        borderRadius: '10px',
        padding: '48px 32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '22px',
          fontWeight: 600,
          color: '#0A0A0A',
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}
      >
        {generating ? 'Generating this debate now...' : 'This debate is coming soon.'}
      </div>
      <p style={{ fontSize: '15px', color: '#6B6B6B', maxWidth: '520px', margin: '0 auto 24px' }}>
        {generating
          ? 'Four agents are working through this question. Refresh in about 90 seconds.'
          : 'We\u2019re generating the most contested questions in American life. This one will be live shortly.'}
      </p>
      <Link
        href="/debates"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#F5F5F0',
          background: '#0A0A0A',
          borderRadius: '6px',
          textDecoration: 'none',
        }}
      >
        Browse other questions
      </Link>
    </div>
  )
}
