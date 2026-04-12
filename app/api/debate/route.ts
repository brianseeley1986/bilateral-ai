import { NextRequest, NextResponse } from 'next/server'
import { runDebatePipeline } from '@/lib/pipeline'
import { saveDebate, getDebate, getAllDebates } from '@/lib/store'
import { checkDuplicate, registerStory } from '@/lib/deduplication'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { headline } = await req.json()
    if (!headline || typeof headline !== 'string') {
      return NextResponse.json({ error: 'headline required' }, { status: 400 })
    }

    const dedup = await checkDuplicate(headline)
    if (dedup.isDuplicate) {
      return NextResponse.json(
        {
          duplicate: true,
          reason: dedup.reason,
          existingDebateId: dedup.existingDebateId,
          similarityScore: dedup.similarityScore,
        },
        { status: 409 }
      )
    }

    const debate = await runDebatePipeline(headline)

    await saveDebate(debate)
    const firstC = debate.exchanges?.[0]?.c || debate.conservative?.previewLine
    registerStory(headline, debate.id, dedup.hash, firstC)

    return NextResponse.json({
      id: debate.id,
      publishStatus: debate.publishStatus,
      qualityScore: debate.qualityScore,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Pipeline failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { deleteDebate } = await import('@/lib/db')
  await deleteDebate(id)
  return NextResponse.json({ deleted: id })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  if (searchParams.get('feed') === 'true') {
    const state = searchParams.get('state')
    let debates: any[]

    if (state) {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL!)
      const rows = await sql`
        SELECT data FROM debates
        WHERE publish_status = 'published'
        AND (
          geographic_scope IN ('national', 'international')
          OR track = 'satire'
          OR (
            geographic_scope IN ('local', 'state')
            AND (
              state = ${state}
              OR data->>'state' = ${state}
            )
          )
        )
        ORDER BY created_at DESC
        LIMIT 20
      `
      debates = rows.map((r: any) => r.data)
    } else {
      debates = await getAllDebates()
    }

    return NextResponse.json(
      debates.map((d: any) => ({
        id: d.id,
        headline: d.headline,
        track: d.track,
        sourceType: d.sourceType,
        geographicScope: d.geographicScope,
        createdAt: d.createdAt,
        publishStatus: d.publishStatus || 'published',
        conservativeOneLine: d.conservative?.previewLine || d.satireExchanges?.[0]?.a || '',
        liberalOneLine: d.liberal?.previewLine || d.satireExchanges?.[0]?.b || '',
        suggestedHook: d.suggestedHook,
        exchanges: d.exchanges?.slice(0, 1),
        satireExchanges: d.satireExchanges?.slice(0, 1),
      }))
    )
  }

  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const debate = await getDebate(id)
  if (!debate) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(debate)
}
