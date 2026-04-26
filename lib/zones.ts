/**
 * Server-side data fetchers for the homepage zones.
 * Called directly from the page server component so debate content
 * appears in the initial HTML for crawlers and AI search engines.
 */
import { neon } from '@neondatabase/serverless'

function sql() {
  return neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } })
}

/** Trim text to the last complete sentence within max chars */
function trimToSentence(text: string, max: number): string {
  if (!text || text.length <= max) return text
  // Search for sentence-ending punctuation followed by space or end
  for (let i = max; i >= max * 0.4; i--) {
    if ((text[i] === '.' || text[i] === '?' || text[i] === '!') &&
        (i === text.length - 1 || text[i + 1] === ' ' || text[i + 1] === '\n')) {
      return text.slice(0, i + 1)
    }
  }
  return text.slice(0, max)
}

function formatCard(d: any, viewCount?: number) {
  return {
    id: d.id,
    headline: d.headline,
    track: d.track,
    sourceType: d.sourceType,
    geographicScope: d.geographicScope,
    createdAt: d.createdAt,
    publishStatus: d.publishStatus || 'published',
    conservativeOneLine: d.conservative?.previewLine || d.satireExchanges?.[0]?.a || '',
    liberalOneLine: d.liberal?.previewLine || d.satireExchanges?.[0]?.b || '',
    conservativeFeedHook: d.conservativeFeedHook || null,
    liberalFeedHook: d.liberalFeedHook || null,
    leadingSide: d.leadingSide || null,
    shortHeadline: d.shortHeadline || null,
    suggestedHook: d.suggestedHook,
    exchanges: d.exchanges?.slice(0, 1),
    satireExchanges: d.satireExchanges?.slice(0, 1),
    factionAlert: d.factionAlert?.detected
      ? {
          detected: true,
          dividedSide: d.factionAlert.dividedSide,
          summary: d.factionAlert.summary,
          dominantPosition: d.factionAlert.dominantPosition,
        }
      : null,
    viewCount: viewCount ?? d.viewCount ?? 0,
    overallScore: d.qualityScore?.overallScore ?? null,
    // Hero card fields
    whatHappened: d.context?.whatHappened || null,
    whyItMatters: d.context?.whyItMatters || null,
    conservativeArgument: d.conservative?.argument
      ? trimToSentence(d.conservative.argument, 500)
      : null,
    liberalArgument: d.liberal?.argument
      ? trimToSentence(d.liberal.argument, 500)
      : null,
    slug: d.slug || null,
    imageUrl: d.imageUrl || null,
    imageSource: d.imageSource || null,
  }
}

export interface ZoneData {
  national: any[]
  international: any[]
  state: any[]
  local: any[]
  userSubmitted: any[]
  counts: {
    national: number
    international: number
    state: number
    local: number
    userSubmitted: number
  }
}

export async function fetchZoneData(): Promise<ZoneData> {
  const db = sql()

  const [natRows, natCount, intlRows, intlCount, stateRows, stateCount,
         localRows, localCount, userRows, userCount] = await Promise.all([
    db`SELECT data, view_count, slug, image_url FROM debates
       WHERE publish_status='published' AND track!='satire'
       AND geographic_scope NOT IN ('local','state','international')
       AND data->>'sourceType' IS DISTINCT FROM 'library'
       AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
       ORDER BY created_at DESC LIMIT 8`,
    db`SELECT COUNT(*)::int AS n FROM debates
       WHERE publish_status='published' AND track!='satire'
       AND geographic_scope NOT IN ('local','state','international')
       AND data->>'sourceType' IS DISTINCT FROM 'library'
       AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'`,
    db`SELECT data, view_count, slug, image_url FROM debates
       WHERE publish_status='published' AND track!='satire'
       AND geographic_scope='international'
       AND data->>'sourceType' IS DISTINCT FROM 'library'
       AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
       ORDER BY created_at DESC LIMIT 5`,
    db`SELECT COUNT(*)::int AS n FROM debates
       WHERE publish_status='published' AND track!='satire'
       AND geographic_scope='international'
       AND data->>'sourceType' IS DISTINCT FROM 'library'
       AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'`,
    db`SELECT data, view_count, slug, image_url FROM debates
       WHERE publish_status='published' AND track!='satire'
       AND geographic_scope='state'
       AND data->>'sourceType' IS DISTINCT FROM 'library'
       AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
       ORDER BY created_at DESC LIMIT 5`,
    db`SELECT COUNT(*)::int AS n FROM debates
       WHERE publish_status='published' AND track!='satire'
       AND geographic_scope='state'
       AND data->>'sourceType' IS DISTINCT FROM 'library'
       AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'`,
    db`SELECT data, view_count, slug, image_url FROM debates
       WHERE publish_status='published' AND track!='satire'
       AND geographic_scope='local'
       AND data->>'sourceType' IS DISTINCT FROM 'library'
       AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
       ORDER BY created_at DESC LIMIT 5`,
    db`SELECT COUNT(*)::int AS n FROM debates
       WHERE publish_status='published' AND track!='satire'
       AND geographic_scope='local'
       AND data->>'sourceType' IS DISTINCT FROM 'library'
       AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'`,
    db`SELECT data, view_count FROM debates
       WHERE publish_status='published'
       AND data->>'sourceType'='user_submitted'
       ORDER BY created_at DESC LIMIT 5`,
    db`SELECT COUNT(*)::int AS n FROM debates
       WHERE publish_status='published'
       AND data->>'sourceType'='user_submitted'`,
  ])

  return {
    national:      natRows.map((r: any) => formatCard({ ...r.data, slug: r.slug || r.data.slug, imageUrl: r.image_url || r.data.imageUrl }, r.view_count)),
    international: intlRows.map((r: any) => formatCard({ ...r.data, slug: r.slug || r.data.slug, imageUrl: r.image_url || r.data.imageUrl }, r.view_count)),
    state:         stateRows.map((r: any) => formatCard({ ...r.data, slug: r.slug || r.data.slug, imageUrl: r.image_url || r.data.imageUrl }, r.view_count)),
    local:         localRows.map((r: any) => formatCard({ ...r.data, slug: r.slug || r.data.slug, imageUrl: r.image_url || r.data.imageUrl }, r.view_count)),
    userSubmitted: userRows.map((r: any) => formatCard({ ...r.data, slug: r.slug || r.data.slug, imageUrl: r.image_url || r.data.imageUrl }, r.view_count)),
    counts: {
      national:      natCount[0]?.n ?? 0,
      international: intlCount[0]?.n ?? 0,
      state:         stateCount[0]?.n ?? 0,
      local:         localCount[0]?.n ?? 0,
      userSubmitted: userCount[0]?.n ?? 0,
    },
  }
}

export interface LibraryFeatured {
  id: string
  question: string
  category: string
  slug: string
  hook?: string
  conservativePreview?: string
  liberalPreview?: string
}

export async function fetchLibraryFeatured(): Promise<LibraryFeatured[]> {
  const db = sql()
  const rows = await db`
    SELECT lq.id, lq.question, lq.category, lq.slug, lq.hook, lq.debate_id,
           COALESCE((d.data->'qualityScore'->>'overallScore')::float, 0) AS score,
           d.data->'conservative'->>'previewLine' AS c_preview,
           d.data->'liberal'->>'previewLine' AS l_preview
    FROM library_questions lq
    JOIN debates d ON d.id = lq.debate_id
    WHERE lq.status = 'published'
    ORDER BY score DESC NULLS LAST
    LIMIT 3
  `
  return rows.map((r: any) => ({
    id: r.id,
    question: r.question,
    category: r.category,
    slug: r.slug,
    hook: r.hook,
    conservativePreview: r.c_preview,
    liberalPreview: r.l_preview,
  }))
}
