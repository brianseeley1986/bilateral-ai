import { NextRequest, NextResponse } from 'next/server'
import {
  initDb,
  getAllLibraryQuestions,
  getLibraryStats,
} from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await initDb()
  const { searchParams } = new URL(req.url)
  if (searchParams.get('stats') === 'true') {
    const stats = await getLibraryStats()
    return NextResponse.json(stats)
  }
  if (searchParams.get('featured') === 'true') {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`
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
    return NextResponse.json(
      rows.map((r: any) => ({
        id: r.id,
        question: r.question,
        category: r.category,
        slug: r.slug,
        hook: r.hook,
        debateId: r.debate_id,
        qualityScore: r.score,
        conservativePreview: r.c_preview,
        liberalPreview: r.l_preview,
      }))
    )
  }
  const rows = await getAllLibraryQuestions()
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      question: r.question,
      category: r.category,
      slug: r.slug,
      hook: r.hook,
      status: r.status,
      debateId: r.debate_id,
      tier: r.search_volume_tier,
      generatedAt: r.generated_at,
    }))
  )
}
