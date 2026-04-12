import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null
function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!)
  return _sql
}

export async function initDb() {
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

  try { await sql()`CREATE INDEX IF NOT EXISTS debates_created_at_idx ON debates (created_at DESC)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS debates_track_idx ON debates (track)` } catch {}
  try { await sql()`CREATE INDEX IF NOT EXISTS debates_publish_status_idx ON debates (publish_status)` } catch {}

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
}

export async function saveDebate(debate: any): Promise<void> {
  await sql()`
    INSERT INTO debates (
      id,
      headline,
      track,
      geographic_scope,
      publish_status,
      created_at,
      data
    ) VALUES (
      ${debate.id},
      ${debate.headline},
      ${(debate.track || 'serious').toLowerCase()},
      ${debate.geographicScope || 'national'},
      ${debate.publishStatus || 'published'},
      ${debate.createdAt},
      ${JSON.stringify(debate)}
    )
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      publish_status = EXCLUDED.publish_status
  `
}

export async function getDebate(id: string): Promise<any | null> {
  const rows = await sql()`
    SELECT data FROM debates
    WHERE id = ${id}
  `
  if (rows.length === 0) return null
  return rows[0].data
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
