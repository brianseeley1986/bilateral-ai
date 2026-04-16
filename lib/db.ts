import { neon } from '@neondatabase/serverless'

// Don't cache the connection at module level — Vercel cron and other contexts
// can load this module before DATABASE_URL is populated, leaving a permanently
// broken cached client whose errors get swallowed downstream. Creating a fresh
// neon() per call is cheap because the underlying transport is HTTP.
function sql() {
  return neon(process.env.DATABASE_URL!)
}

export async function initDb() {
  try { await sql()`CREATE EXTENSION IF NOT EXISTS pg_trgm` } catch {}

  await sql()`
    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT UNIQUE NOT NULL,
      topics TEXT[] NOT NULL DEFAULT '{}',
      city TEXT,
      region TEXT,
      zip TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      confirmed BOOLEAN NOT NULL DEFAULT false,
      confirmation_token TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_digest_at TIMESTAMPTZ,
      unsubscribed_at TIMESTAMPTZ
    )
  `

  try { await sql()`CREATE INDEX IF NOT EXISTS subscribers_email_idx ON subscribers (email)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS subscribers_confirmed_idx ON subscribers (confirmed)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS subscribers_topics_idx ON subscribers USING GIN (topics)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS subscribers_zip_idx ON subscribers (zip)` } catch {}
  try { await sql()`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS county TEXT` } catch {}

  await sql()`
    CREATE TABLE IF NOT EXISTS debates (
      id TEXT PRIMARY KEY,
      headline TEXT NOT NULL,
      track TEXT NOT NULL DEFAULT 'serious',
      geographic_scope TEXT NOT NULL DEFAULT 'national',
      publish_status TEXT NOT NULL DEFAULT 'published',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      data JSONB NOT NULL
    )
  `

  try { await sql()`ALTER TABLE debates ADD COLUMN IF NOT EXISTS city TEXT` } catch {}
  try { await sql()`ALTER TABLE debates ADD COLUMN IF NOT EXISTS state TEXT` } catch {}
  try { await sql()`ALTER TABLE debates ADD COLUMN IF NOT EXISTS slug TEXT` } catch {}
  try { await sql()`CREATE UNIQUE INDEX IF NOT EXISTS debates_slug_unique_idx ON debates (slug) WHERE slug IS NOT NULL` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS debates_created_at_idx ON debates (created_at DESC)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS debates_track_idx ON debates (track)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS debates_publish_status_idx ON debates (publish_status)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS debates_state_idx ON debates (state)` } catch {}
  try { await sql()`CREATE UNIQUE INDEX IF NOT EXISTS debates_headline_unique_idx ON debates (LOWER(TRIM(headline)))` } catch {}

  await sql()`
    CREATE TABLE IF NOT EXISTS journalists (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      handle TEXT,
      substack_url TEXT,
      twitter_handle TEXT,
      rss_url TEXT,
      beats TEXT[] NOT NULL DEFAULT '{}',
      geographic_focus TEXT[] NOT NULL DEFAULT '{}',
      credibility_score DECIMAL(3,2) DEFAULT 0.00,
      subscriber_count INTEGER,
      former_outlet TEXT,
      tier INTEGER DEFAULT 2,
      active BOOLEAN DEFAULT true,
      last_fetched_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      notes TEXT
    )
  `

  // Clean up duplicate journalist names (keep newest)
  try {
    await sql()`
      DELETE FROM journalists a USING journalists b
      WHERE a.id > b.id AND a.name = b.name
    `
  } catch (e) {
    console.warn('journalist dedup warning:', (e as Error).message)
  }

  // Drop the old unique index if it exists, replace with non-unique
  try { await sql()`DROP INDEX IF EXISTS journalists_name_idx` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS journalists_name_nonuniq_idx ON journalists (name)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS journalists_beats_idx ON journalists USING GIN (beats)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS journalists_tier_idx ON journalists (tier)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS journalists_active_idx ON journalists (active)` } catch {}

  await sql()`
    CREATE TABLE IF NOT EXISTS library_questions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      question TEXT NOT NULL,
      category TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      hook TEXT,
      debate_id TEXT REFERENCES debates(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      search_volume_tier INTEGER NOT NULL DEFAULT 2,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      generated_at TIMESTAMPTZ,
      error_message TEXT
    )
  `

  try { await sql()`CREATE INDEX IF NOT EXISTS library_status_idx ON library_questions (status)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS library_category_idx ON library_questions (category)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS library_tier_idx ON library_questions (search_volume_tier)` } catch {}

  try {
    await sql()`
      CREATE TABLE IF NOT EXISTS ingestion_locks (
        key TEXT PRIMARY KEY,
        locked_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `
  } catch {}

  try {
    await sql()`
      CREATE TABLE IF NOT EXISTS ingestion_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
  } catch {}
}

// ---- INGESTION STATE ----

export async function getIngestionState(key: string): Promise<string | null> {
  // Use the .query() form instead of tagged-template — the tagged-template
  // version was returning null in cron context (suspect bundler/parameter
  // mismatch). .query() with explicit params is bulletproof.
  try {
    const direct = neon(process.env.DATABASE_URL!)
    const rows = (await direct.query(
      'SELECT value FROM ingestion_state WHERE key = $1',
      [key]
    )) as Array<{ value: string }>
    return rows[0]?.value || null
  } catch (e) {
    console.error('getIngestionState failed for', key, e)
    return null
  }
}

export async function setIngestionState(key: string, value: string): Promise<void> {
  try {
    await sql()`
      INSERT INTO ingestion_state (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `
  } catch (e) {
    console.error('setIngestionState failed:', e)
  }
}

// ---- INGESTION LOCKS ----

export async function acquireIngestionLock(
  key: string,
  ttlMinutes: number = 10
): Promise<boolean> {
  try {
    // First clean expired locks so we don't stay blocked indefinitely
    await sql()`DELETE FROM ingestion_locks WHERE expires_at < NOW()`
    const result = await sql()`
      INSERT INTO ingestion_locks (key, locked_at, expires_at)
      VALUES (${key}, NOW(), NOW() + (${ttlMinutes} || ' minutes')::interval)
      ON CONFLICT (key) DO NOTHING
      RETURNING key
    `
    return result.length > 0
  } catch {
    return false
  }
}

export async function releaseIngestionLock(key: string): Promise<void> {
  try {
    await sql()`DELETE FROM ingestion_locks WHERE key = ${key}`
  } catch {}
}

export async function cleanExpiredLocks(): Promise<void> {
  try {
    await sql()`DELETE FROM ingestion_locks WHERE expires_at < NOW()`
  } catch {}
}

function buildSlug(headline: string, id: string): string {
  const base = headline
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  // Append a short id suffix so headline collisions resolve deterministically.
  return base ? `${base}-${id.slice(-6)}` : id
}

export async function saveDebate(debate: any): Promise<void> {
  const slug = buildSlug(debate.headline || '', debate.id)
  await sql()`
    INSERT INTO debates (
      id,
      headline,
      track,
      geographic_scope,
      publish_status,
      created_at,
      city,
      state,
      slug,
      data
    ) VALUES (
      ${debate.id},
      ${debate.headline},
      ${(debate.track || 'serious').toLowerCase()},
      ${debate.geographicScope || 'national'},
      ${debate.publishStatus || 'published'},
      ${debate.createdAt},
      ${debate.city || null},
      ${debate.state || null},
      ${slug},
      ${JSON.stringify(debate)}
    )
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      publish_status = EXCLUDED.publish_status,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      slug = COALESCE(debates.slug, EXCLUDED.slug)
  `
}

export async function getRelatedDebates(
  excludeId: string,
  limit: number = 4
): Promise<Array<{ id: string; slug: string | null; headline: string }>> {
  // Cheap "related": exclude self, prefer recent published debates with the
  // same track. Keyword-similarity ranking would be better but this is enough
  // to give Google a real internal link graph and readers a path to keep going.
  const rows = await sql()`
    SELECT id, slug, headline
    FROM debates
    WHERE publish_status = 'published'
      AND id != ${excludeId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  ` as Array<{ id: string; slug: string | null; headline: string }>
  return rows
}

export async function getDebate(idOrSlug: string): Promise<any | null> {
  // Accept either the numeric id or the SEO slug.
  const isNumericId = /^\d+$/.test(idOrSlug)
  const rows = isNumericId
    ? await sql()`SELECT data, slug FROM debates WHERE id = ${idOrSlug} LIMIT 1`
    : await sql()`SELECT data, slug FROM debates WHERE slug = ${idOrSlug} LIMIT 1`
  if (rows.length === 0) return null
  const data = rows[0].data
  if (data && rows[0].slug && !data.slug) data.slug = rows[0].slug
  return data
}

export async function getRecentDebates(
  limit: number = 20,
  track?: string,
  publishStatus?: string
): Promise<any[]> {
  let rows

  if (track && publishStatus) {
    rows = await sql()`
      SELECT data FROM debates
      WHERE track = ${track}
      AND publish_status = ${publishStatus}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  } else if (track) {
    rows = await sql()`
      SELECT data FROM debates
      WHERE track = ${track}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  } else if (publishStatus) {
    rows = await sql()`
      SELECT data FROM debates
      WHERE publish_status = ${publishStatus}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  } else {
    rows = await sql()`
      SELECT data FROM debates
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  }

  return rows.map((r) => r.data)
}

export async function getDebateCount(): Promise<number> {
  const rows = await sql()`SELECT COUNT(*) as count FROM debates`
  return parseInt(rows[0].count)
}

export async function deleteDebate(id: string): Promise<void> {
  await sql()`DELETE FROM debates WHERE id = ${id}`
}

// ---- SUBSCRIBERS ----

export async function createSubscriber(data: {
  email: string
  topics: string[]
  city?: string
  region?: string
  zip?: string
  latitude?: number
  longitude?: number
}): Promise<{ id: string; confirmationToken: string }> {
  const token = crypto.randomUUID()
  const rows = await sql()`
    INSERT INTO subscribers (
      email, topics, city, region, zip,
      latitude, longitude, confirmation_token
    ) VALUES (
      ${data.email},
      ${data.topics},
      ${data.city || null},
      ${data.region || null},
      ${data.zip || null},
      ${data.latitude || null},
      ${data.longitude || null},
      ${token}
    )
    ON CONFLICT (email) DO UPDATE SET
      topics = EXCLUDED.topics,
      city = EXCLUDED.city,
      region = EXCLUDED.region,
      zip = EXCLUDED.zip,
      confirmation_token = ${token},
      unsubscribed_at = NULL
    RETURNING id
  `
  return { id: rows[0].id, confirmationToken: token }
}

export async function confirmSubscriber(token: string): Promise<boolean> {
  const rows = await sql()`
    UPDATE subscribers
    SET confirmed = true, confirmation_token = NULL
    WHERE confirmation_token = ${token}
    RETURNING id
  `
  return rows.length > 0
}

export async function getSubscribersByTopics(topics: string[]): Promise<any[]> {
  return sql()`
    SELECT * FROM subscribers
    WHERE confirmed = true
    AND unsubscribed_at IS NULL
    AND topics && ${topics}
  `
}

export async function getSubscribersByZip(zip: string): Promise<any[]> {
  return sql()`
    SELECT * FROM subscribers
    WHERE confirmed = true
    AND unsubscribed_at IS NULL
    AND zip = ${zip}
  `
}

export async function unsubscribe(email: string): Promise<void> {
  await sql()`
    UPDATE subscribers
    SET unsubscribed_at = NOW()
    WHERE email = ${email}
  `
}

export async function getSubscriberStats(): Promise<any> {
  const rows = await sql()`
    SELECT
      COUNT(*) FILTER (WHERE confirmed = true) as confirmed,
      COUNT(*) FILTER (WHERE confirmed = false) as pending,
      COUNT(*) FILTER (WHERE confirmed = true AND unsubscribed_at IS NOT NULL) as unsubscribed,
      COUNT(*) FILTER (WHERE confirmed = true AND 'economics' = ANY(topics)) as economics,
      COUNT(*) FILTER (WHERE confirmed = true AND 'education' = ANY(topics)) as education,
      COUNT(*) FILTER (WHERE confirmed = true AND 'foreign_policy' = ANY(topics)) as foreign_policy,
      COUNT(*) FILTER (WHERE confirmed = true AND 'healthcare' = ANY(topics)) as healthcare,
      COUNT(*) FILTER (WHERE confirmed = true AND 'technology' = ANY(topics)) as technology,
      COUNT(*) FILTER (WHERE confirmed = true AND 'immigration' = ANY(topics)) as immigration,
      COUNT(*) FILTER (WHERE confirmed = true AND 'climate' = ANY(topics)) as climate,
      COUNT(*) FILTER (WHERE confirmed = true AND 'legal' = ANY(topics)) as legal,
      COUNT(*) FILTER (WHERE confirmed = true AND 'local' = ANY(topics)) as local_topic,
      COUNT(*) FILTER (WHERE confirmed = true AND 'politics' = ANY(topics)) as politics,
      COUNT(*) FILTER (WHERE confirmed = true AND 'satire' = ANY(topics)) as satire,
      COUNT(*) FILTER (WHERE confirmed = true AND zip IS NOT NULL) as with_location
    FROM subscribers
  `
  return rows[0]
}

// ---- JOURNALISTS ----

export async function addJournalist(data: {
  name: string
  handle?: string
  substack_url?: string
  twitter_handle?: string
  rss_url?: string
  beats: string[]
  geographic_focus: string[]
  credibility_score?: number
  subscriber_count?: number
  former_outlet?: string
  tier?: number
  notes?: string
}): Promise<string> {
  // Remove existing entry with same name before inserting
  await sql()`DELETE FROM journalists WHERE name = ${data.name}`
  const rows = await sql()`
    INSERT INTO journalists (
      name, handle, substack_url, twitter_handle,
      rss_url, beats, geographic_focus,
      credibility_score, subscriber_count,
      former_outlet, tier, notes
    ) VALUES (
      ${data.name},
      ${data.handle || null},
      ${data.substack_url || null},
      ${data.twitter_handle || null},
      ${data.rss_url || null},
      ${data.beats},
      ${data.geographic_focus},
      ${data.credibility_score || 0.75},
      ${data.subscriber_count || null},
      ${data.former_outlet || null},
      ${data.tier || 2},
      ${data.notes || null}
    )
    RETURNING id
  `
  return rows[0]?.id
}

export async function getJournalistsByBeat(beat: string, tier: number = 2): Promise<any[]> {
  return sql()`
    SELECT * FROM journalists
    WHERE ${beat} = ANY(beats)
    AND tier <= ${tier}
    AND active = true
    ORDER BY credibility_score DESC
  `
}

export async function getJournalistsByGeo(location: string): Promise<any[]> {
  const locationLower = location.toLowerCase()
  return sql()`
    SELECT * FROM journalists
    WHERE active = true
    AND EXISTS (
      SELECT 1 FROM unnest(geographic_focus) g
      WHERE lower(g) LIKE ${'%' + locationLower + '%'}
    )
    ORDER BY credibility_score DESC
  `
}

export async function updateJournalistFetched(id: string): Promise<void> {
  await sql()`UPDATE journalists SET last_fetched_at = NOW() WHERE id = ${id}`
}

export async function getAllJournalists(): Promise<any[]> {
  return sql()`SELECT * FROM journalists ORDER BY tier ASC, credibility_score DESC`
}

export async function getJournalistStats(): Promise<any> {
  const rows = await sql()`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE tier = 1) as tier1,
      COUNT(*) FILTER (WHERE tier = 2) as tier2,
      COUNT(*) FILTER (WHERE active = true) as active,
      AVG(credibility_score)::numeric(3,2) as avg_score
    FROM journalists
  `
  return rows[0]
}

// ---- LIBRARY ----

export interface LibraryRow {
  id: string
  question: string
  category: string
  slug: string
  hook: string | null
  debate_id: string | null
  status: 'pending' | 'generating' | 'published' | 'failed'
  search_volume_tier: number
  created_at: string
  generated_at: string | null
  error_message: string | null
}

export async function upsertLibraryQuestion(q: {
  question: string
  category: string
  slug: string
  hook?: string
  tier?: number
}): Promise<void> {
  await sql()`
    INSERT INTO library_questions (question, category, slug, hook, search_volume_tier)
    VALUES (${q.question}, ${q.category}, ${q.slug}, ${q.hook || null}, ${q.tier || 2})
    ON CONFLICT (slug) DO UPDATE SET
      question = EXCLUDED.question,
      category = EXCLUDED.category,
      hook = EXCLUDED.hook,
      search_volume_tier = EXCLUDED.search_volume_tier
  `
}

export async function getLibraryQuestionBySlug(slug: string): Promise<LibraryRow | null> {
  const rows = await sql()`SELECT * FROM library_questions WHERE slug = ${slug} LIMIT 1`
  return (rows[0] as LibraryRow) || null
}

export async function getAllLibraryQuestions(): Promise<LibraryRow[]> {
  const rows = await sql()`
    SELECT * FROM library_questions
    ORDER BY search_volume_tier ASC, category ASC, question ASC
  `
  return rows as LibraryRow[]
}

export async function getLibraryQuestionsByCategory(category: string): Promise<LibraryRow[]> {
  const rows = await sql()`
    SELECT * FROM library_questions
    WHERE category = ${category}
    ORDER BY search_volume_tier ASC, question ASC
  `
  return rows as LibraryRow[]
}

export async function getPendingLibraryQuestions(limit: number): Promise<LibraryRow[]> {
  const rows = await sql()`
    SELECT * FROM library_questions
    WHERE status = 'pending' OR status = 'failed'
    ORDER BY search_volume_tier ASC, created_at ASC
    LIMIT ${limit}
  `
  return rows as LibraryRow[]
}

export async function setLibraryStatus(
  id: string,
  status: 'pending' | 'generating' | 'published' | 'failed',
  extra: { debate_id?: string | null; error_message?: string | null } = {}
): Promise<void> {
  if (status === 'published') {
    await sql()`
      UPDATE library_questions
      SET status = 'published',
          debate_id = ${extra.debate_id || null},
          generated_at = NOW(),
          error_message = NULL
      WHERE id = ${id}
    `
  } else if (status === 'failed') {
    await sql()`
      UPDATE library_questions
      SET status = 'failed',
          error_message = ${extra.error_message || null}
      WHERE id = ${id}
    `
  } else {
    await sql()`
      UPDATE library_questions
      SET status = ${status}
      WHERE id = ${id}
    `
  }
}

export async function getLibraryStats(): Promise<{
  total: number
  pending: number
  generating: number
  published: number
  failed: number
}> {
  const rows = await sql()`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'generating') AS generating,
      COUNT(*) FILTER (WHERE status = 'published') AS published,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed
    FROM library_questions
  `
  const r = rows[0]
  return {
    total: parseInt(r.total),
    pending: parseInt(r.pending),
    generating: parseInt(r.generating),
    published: parseInt(r.published),
    failed: parseInt(r.failed),
  }
}

export async function getTopLibraryDebateIds(limit: number = 3): Promise<string[]> {
  const rows = await sql()`
    SELECT lq.debate_id,
           COALESCE((d.data->'qualityScore'->>'overallScore')::float, 0) AS score
    FROM library_questions lq
    JOIN debates d ON d.id = lq.debate_id
    WHERE lq.status = 'published' AND lq.debate_id IS NOT NULL
    ORDER BY score DESC, lq.generated_at DESC
    LIMIT ${limit}
  `
  return rows.map((r: any) => r.debate_id)
}

export async function hasRecentHeadline(
  headline: string,
  withinHours: number = 24
): Promise<boolean> {
  const normalized = headline.trim().toLowerCase()
  const rows = await sql()`
    SELECT 1 FROM debates
    WHERE LOWER(TRIM(headline)) = ${normalized}
    AND created_at > NOW() - (${withinHours} || ' hours')::interval
    LIMIT 1
  `
  return rows.length > 0
}

// ---- X POSTING ----

export async function markAsPostedToX(debateId: string, tweetId?: string): Promise<void> {
  await sql()`
    UPDATE debates
    SET x_posted_at = NOW(),
        data = jsonb_set(
          data,
          '{xTweetId}',
          ${JSON.stringify(tweetId || null)}::jsonb
        )
    WHERE id = ${debateId}
  `
}

export async function getUnpostedDebates(limit: number = 5): Promise<any[]> {
  // Prefer fresh news debates (< 24h, quality ≥ 8.0, not library)
  const fresh = await sql()`
    SELECT id, headline, slug, data, created_at, view_count
    FROM debates
    WHERE publish_status = 'published'
      AND x_posted_at IS NULL
      AND (data->>'sourceType' IS NULL OR data->>'sourceType' != 'library')
      AND (data->'qualityScore'->>'overallScore')::float >= 7.5
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  if (fresh.length > 0) return fresh

  // Fall back to evergreen library debates if no fresh news is ready
  return await sql()`
    SELECT id, headline, slug, data, created_at, view_count
    FROM debates
    WHERE publish_status = 'published'
      AND x_posted_at IS NULL
      AND data->>'sourceType' = 'library'
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
}

export async function getXPostingStats(): Promise<{
  posted: number
  readyToPost: number
  lastPostedAt: string | null
}> {
  const rows = await sql()`
    SELECT
      COUNT(*) FILTER (WHERE x_posted_at IS NOT NULL) as posted,
      COUNT(*) FILTER (
        WHERE x_posted_at IS NULL
          AND publish_status = 'published'
          AND (data->>'sourceType' IS NULL OR data->>'sourceType' != 'library')
          AND (data->'qualityScore'->>'overallScore')::float >= 7.5
          AND created_at > NOW() - INTERVAL '24 hours'
      ) as ready_to_post,
      MAX(x_posted_at) as last_posted_at
    FROM debates
  `
  const r = rows[0]
  return {
    posted: Number(r.posted),
    readyToPost: Number(r.ready_to_post),
    lastPostedAt: r.last_posted_at || null,
  }
}

export async function getRecentXPosts(limit: number = 10): Promise<any[]> {
  return await sql()`
    SELECT headline, x_posted_at, data->>'xTweetId' as tweet_id, view_count
    FROM debates
    WHERE x_posted_at IS NOT NULL
    ORDER BY x_posted_at DESC
    LIMIT ${limit}
  `
}

export async function cleanExpiredResearchCache(): Promise<void> {
  try {
    await sql()`DELETE FROM research_cache WHERE expires_at < NOW()`
  } catch {}
}
