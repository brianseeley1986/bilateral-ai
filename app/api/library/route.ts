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
