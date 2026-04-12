import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null
function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!)
  return _sql
}

export async function initDb() {
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

  await sql()`
    CREATE INDEX IF NOT EXISTS debates_created_at_idx
    ON debates (created_at DESC)
  `

  await sql()`
    CREATE INDEX IF NOT EXISTS debates_track_idx
    ON debates (track)
  `

  await sql()`
    CREATE INDEX IF NOT EXISTS debates_publish_status_idx
    ON debates (publish_status)
  `
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
      ${debate.track || 'serious'},
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
