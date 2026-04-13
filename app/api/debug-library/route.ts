import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { initDb, getLibraryQuestionBySlug } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const sql = neon(process.env.DATABASE_URL!)

  // Direct neon query
  const directRows = await sql`SELECT id, slug, status, debate_id FROM library_questions WHERE slug = ${slug} LIMIT 1`
  const direct = directRows[0] ?? null

  // Via db.ts (same as the library page)
  await initDb()
  const viaDbTs = await getLibraryQuestionBySlug(slug)

  return NextResponse.json({
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    direct_query: direct,
    via_db_ts: viaDbTs ? { id: viaDbTs.id, slug: viaDbTs.slug, status: viaDbTs.status, debate_id: viaDbTs.debate_id } : null,
  })
}
