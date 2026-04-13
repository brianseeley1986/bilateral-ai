import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getDebate } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || req.headers.get('x-ingest-token') || ''
  if (!process.env.INGEST_SECRET_TOKEN || token !== process.env.INGEST_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sql = neon(process.env.DATABASE_URL!)

  // Get all published library questions from the correct DB
  const questions = await sql`
    SELECT id, slug, debate_id FROM library_questions
    WHERE status = 'published' AND debate_id IS NOT NULL
  `

  let copied = 0
  let alreadyPresent = 0
  let missing = 0
  const missingIds: string[] = []

  for (const q of questions) {
    // Check if debate already exists in correct DB
    const existing = await sql`SELECT id FROM debates WHERE id = ${q.debate_id} LIMIT 1`
    if (existing.length > 0) {
      alreadyPresent++
      continue
    }

    // Fetch from wrong DB via db.ts
    const debate = await getDebate(q.debate_id)
    if (!debate) {
      missing++
      missingIds.push(q.debate_id)
      continue
    }

    // Write to correct DB
    await sql`
      INSERT INTO debates (id, headline, track, geographic_scope, publish_status, created_at, city, state, data)
      VALUES (
        ${debate.id},
        ${debate.headline},
        ${(debate.track || 'serious').toLowerCase()},
        ${debate.geographicScope || 'national'},
        ${'published'},
        ${debate.createdAt},
        ${debate.city || null},
        ${debate.state || null},
        ${JSON.stringify(debate)}
      )
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        publish_status = EXCLUDED.publish_status
    `
    copied++
  }

  return NextResponse.json({
    total: questions.length,
    copied,
    alreadyPresent,
    missing,
    missingIds,
  })
}
