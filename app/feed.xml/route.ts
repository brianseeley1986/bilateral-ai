import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const base = 'https://bilateral.news'
  const sql = neon(process.env.DATABASE_URL!)
  const rows = (await sql`
    SELECT id, slug, headline, created_at, data
    FROM debates
    WHERE publish_status = 'published'
    ORDER BY created_at DESC
    LIMIT 50
  `) as Array<{ id: string; slug: string | null; headline: string; created_at: Date; data: any }>

  const items = rows
    .map((row) => {
      const url = `${base}/debate/${row.slug || row.id}`
      const description: string =
        row.data?.suggestedHook || row.data?.context?.whatHappened || row.headline
      const pubDate = new Date(row.created_at).toUTCString()
      return `    <item>
      <title>${escape(row.headline)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escape(description)}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Bilateral — The argument behind every headline.</title>
    <link>${base}</link>
    <description>Conservative and liberal analysts debate every major story at full depth.</description>
    <language>en-us</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  })
}
