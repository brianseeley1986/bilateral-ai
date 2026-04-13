import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { runDebatePipeline } from '@/lib/pipeline'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authOK(req: NextRequest): boolean {
  const token =
    req.headers.get('x-ingest-token') ||
    new URL(req.url).searchParams.get('token')
  return token === process.env.INGEST_SECRET_TOKEN
}

export async function POST(req: NextRequest) {
  if (!authOK(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sql = neon(process.env.DATABASE_URL!)

  let body: any = {}
  try {
    body = await req.json()
  } catch {}
  const count = Math.min(Math.max(1, parseInt(body.count ?? '3', 10)), 10)
  const targetSlug: string | undefined = body.slug

  const targets = targetSlug
    ? await sql`SELECT * FROM library_questions WHERE slug = ${targetSlug} LIMIT 1`
    : await sql`
        SELECT * FROM library_questions
        WHERE status = 'pending' OR status = 'failed'
        ORDER BY search_volume_tier ASC, created_at ASC
        LIMIT ${count}
      `

  if (!targets.length) {
    const statsRows = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'generating') AS generating,
        COUNT(*) FILTER (WHERE status = 'published') AS published,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed
      FROM library_questions
    `
    const r = statsRows[0]
    return NextResponse.json({
      processed: 0,
      stats: {
        total: parseInt(r.total), pending: parseInt(r.pending),
        generating: parseInt(r.generating), published: parseInt(r.published),
        failed: parseInt(r.failed),
      },
    })
  }

  const results: Array<{
    slug: string
    status: 'published' | 'failed'
    debateId?: string
    error?: string
  }> = []

  for (const q of targets) {
    try {
      await sql`UPDATE library_questions SET status = 'generating' WHERE id = ${q.id}`
      const debate = await runDebatePipeline(q.question, 'library')
      ;(debate as any).librarySlug = q.slug
      ;(debate as any).libraryCategory = q.category

      // Save debate directly — bypass db.ts/store.ts
      await sql`
        INSERT INTO debates (id, headline, track, geographic_scope, publish_status, created_at, city, state, data)
        VALUES (
          ${debate.id},
          ${debate.headline},
          ${(debate.track || 'serious').toLowerCase()},
          ${(debate as any).geographicScope || 'national'},
          ${'published'},
          ${debate.createdAt},
          ${(debate as any).city || null},
          ${(debate as any).state || null},
          ${JSON.stringify(debate)}
        )
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          publish_status = EXCLUDED.publish_status
      `

      await sql`
        UPDATE library_questions
        SET status = 'published', debate_id = ${debate.id}, generated_at = NOW(), error_message = NULL
        WHERE id = ${q.id}
      `
      results.push({ slug: q.slug, status: 'published', debateId: debate.id })
    } catch (err: any) {
      console.error(`[library] generation failed for ${q.slug}:`, err)
      await sql`
        UPDATE library_questions
        SET status = 'failed', error_message = ${String(err?.message || err).slice(0, 500)}
        WHERE id = ${q.id}
      `
      results.push({ slug: q.slug, status: 'failed', error: String(err?.message || err) })
    }
  }

  const statsRows = await sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'generating') AS generating,
      COUNT(*) FILTER (WHERE status = 'published') AS published,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed
    FROM library_questions
  `
  const r = statsRows[0]
  return NextResponse.json({
    processed: results.length,
    results,
    stats: {
      total: parseInt(r.total), pending: parseInt(r.pending),
      generating: parseInt(r.generating), published: parseInt(r.published),
      failed: parseInt(r.failed),
    },
  })
}
