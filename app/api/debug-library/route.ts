import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { initDb, getLibraryQuestionBySlug } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const sql = neon(process.env.DATABASE_URL!)

  const directRows = await sql`SELECT id, slug, status, debate_id FROM library_questions WHERE slug = ${slug} LIMIT 1`
  const direct = directRows[0] ?? null

  const allRows = await sql`SELECT id, status, debate_id, created_at FROM library_questions WHERE slug = ${slug} ORDER BY created_at DESC`

  const statusCounts = await sql`SELECT status, COUNT(*) FROM library_questions GROUP BY status`

  await initDb()
  const viaDbTs = await getLibraryQuestionBySlug(slug)

  return NextResponse.json({
    direct_query: direct,
    all_rows_count: allRows.length,
    status_counts: statusCounts,
    via_db_ts: viaDbTs ? { status: viaDbTs.status, debate_id: viaDbTs.debate_id } : null,
  })
}
