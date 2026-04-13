import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get('x-ingest-token') || req.nextUrl.searchParams.get('token')
  return token === process.env.INGEST_SECRET_TOKEN
}

// GET — diagnose: count by status, find broken links and orphaned debates
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sql = neon(process.env.DATABASE_URL!)

  const [statusCounts, brokenLinks, orphanedDebates] = await Promise.all([
    // How many questions in each status
    sql`
      SELECT status, COUNT(*) as count
      FROM library_questions
      GROUP BY status
      ORDER BY count DESC
    `,

    // Published questions with debate_id set but the debate row is missing
    sql`
      SELECT lq.slug, lq.status, lq.debate_id
      FROM library_questions lq
      LEFT JOIN debates d ON d.id = lq.debate_id
      WHERE lq.debate_id IS NOT NULL
        AND d.id IS NULL
    `,

    // Debates tagged as library that aren't linked to any question
    // (debate exists, question not linked — the repairable case)
    sql`
      SELECT
        d.id        AS debate_id,
        d.data->>'librarySlug' AS library_slug,
        lq.status   AS question_status,
        lq.debate_id AS question_debate_id
      FROM debates d
      JOIN library_questions lq ON lq.slug = d.data->>'librarySlug'
      WHERE d.data->>'sourceType' = 'library'
        AND (lq.debate_id IS NULL OR lq.status != 'published')
      ORDER BY lq.slug
    `,
  ])

  return NextResponse.json({
    statusCounts,
    brokenLinks,           // debate_id set but debate row missing — needs regeneration
    orphanedDebates,       // debate exists but question not linked — repairable now
    repairableCount: orphanedDebates.length,
    brokenCount: brokenLinks.length,
  })
}

// POST — repair: link orphaned debates back to their questions, mark published
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sql = neon(process.env.DATABASE_URL!)

  // Find the best debate for each unlinked question:
  // debates tagged with librarySlug where the question is missing its link.
  // If multiple debates exist for the same slug, take the most recent.
  const candidates = await sql`
    SELECT DISTINCT ON (lq.slug)
      d.id          AS debate_id,
      d.data->>'librarySlug' AS library_slug,
      lq.slug,
      lq.status     AS old_status
    FROM debates d
    JOIN library_questions lq ON lq.slug = d.data->>'librarySlug'
    WHERE d.data->>'sourceType' = 'library'
      AND (lq.debate_id IS NULL OR lq.status != 'published')
    ORDER BY lq.slug, d.created_at DESC
  `

  if (candidates.length === 0) {
    return NextResponse.json({ repaired: 0, message: 'Nothing to repair' })
  }

  let repaired = 0
  const repairedSlugs: string[] = []
  const errors: string[] = []

  for (const c of candidates) {
    try {
      await sql`
        UPDATE library_questions
        SET debate_id = ${c.debate_id},
            status    = 'published'
        WHERE slug = ${c.slug}
      `
      repaired++
      repairedSlugs.push(c.slug)
    } catch (err: any) {
      errors.push(`${c.slug}: ${err?.message}`)
    }
  }

  return NextResponse.json({
    repaired,
    repairedSlugs,
    errors,
  })
}
