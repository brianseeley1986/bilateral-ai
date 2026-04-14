import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

function aggressiveNormalize(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') || req.headers.get('x-admin-key') || ''
  const secret = process.env.ADMIN_SECRET || ''
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const headline = searchParams.get('headline')
  if (!headline) {
    return NextResponse.json({ error: 'headline query param required' }, { status: 400 })
  }

  const sql = neon(process.env.DATABASE_URL!)
  const result: any = { input: headline, inputNormalized: aggressiveNormalize(headline) }

  // 1. pg_trgm availability
  try {
    const ext = await sql`SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'`
    result.pgTrgmInstalled = ext.length > 0
  } catch (e) {
    result.pgTrgmInstalled = false
    result.pgTrgmCheckError = (e as Error).message
  }

  // 2. Exact-match check (what hasRecentDebateInDB does)
  try {
    const normalized = headline.toLowerCase().trim()
    const exact = await sql`
      SELECT id, headline, created_at FROM debates
      WHERE created_at > NOW() - INTERVAL '48 hours'
      AND LOWER(TRIM(headline)) = ${normalized}
      ORDER BY created_at DESC
    `
    result.exactMatch = { count: exact.length, rows: exact }
  } catch (e) {
    result.exactMatchError = (e as Error).message
  }

  // 3. All rows with similar headline (byte-by-byte display)
  try {
    const all = await sql`
      SELECT id, headline, created_at, LENGTH(headline) AS len, ENCODE(CONVERT_TO(headline, 'UTF8'), 'hex') AS hex
      FROM debates
      WHERE created_at > NOW() - INTERVAL '7 days'
      AND LOWER(headline) LIKE ${'%' + headline.toLowerCase().slice(0, 40) + '%'}
      ORDER BY created_at DESC
      LIMIT 20
    `
    result.fuzzyLike = all.map((r: any) => ({
      id: r.id,
      headline: r.headline,
      createdAt: r.created_at,
      length: r.len,
      hexFirst80: (r.hex as string).slice(0, 160),
      aggressiveNormalized: aggressiveNormalize(r.headline),
      matchesAggressive: aggressiveNormalize(r.headline) === aggressiveNormalize(headline),
    }))
  } catch (e) {
    result.fuzzyLikeError = (e as Error).message
  }

  return NextResponse.json(result)
}
