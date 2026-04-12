import { NextRequest, NextResponse } from 'next/server'
import { ingestJournalistContent } from '@/lib/journalist-ingestion'
import { seedJournalistRegistry } from '@/lib/journalist-seed'
import { getAllJournalists, getJournalistStats, initDb } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get('x-ingest-token') || req.nextUrl.searchParams.get('token')
  return token === process.env.INGEST_SECRET_TOKEN
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))

    if (body.seed) {
      await initDb()
      const seeded = await seedJournalistRegistry()
      return NextResponse.json({ seeded })
    }

    const stats = await ingestJournalistContent(body.beats || [], body.maxDebates || 3)
    return NextResponse.json({ success: true, stats })
  } catch (err: any) {
    console.error('Journalist ingestion error:', err)
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await initDb()
    const stats = await getJournalistStats()
    const journalists = await getAllJournalists()
    return NextResponse.json({
      registry: stats,
      journalists: journalists.map((j: any) => ({
        id: j.id,
        name: j.name,
        beats: j.beats,
        tier: j.tier,
        credibility_score: j.credibility_score,
        former_outlet: j.former_outlet,
        last_fetched_at: j.last_fetched_at,
        substack_url: j.substack_url,
        rss_url: j.rss_url,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
