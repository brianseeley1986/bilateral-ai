import type { MetadataRoute } from 'next'
import { neon } from '@neondatabase/serverless'
import { TOPICS } from '@/lib/topics'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://bilateral.news'

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'hourly', priority: 1.0 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/topics`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...TOPICS.map((t) => ({
      url: `${base}/topics/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ]

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`
      SELECT id, slug, created_at AS last_modified
      FROM debates
      WHERE publish_status = 'published'
      ORDER BY created_at DESC
      LIMIT 5000
    ` as Array<{ id: string; slug: string | null; last_modified: Date }>

    const debateEntries = rows.map((row) => ({
      url: `${base}/debate/${row.slug || row.id}`,
      lastModified: new Date(row.last_modified),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticEntries, ...debateEntries]
  } catch {
    return staticEntries
  }
}
