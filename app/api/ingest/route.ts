import { NextRequest, NextResponse } from 'next/server'
import { ingestTrendingStories } from '@/lib/trends'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function isAuthorized(req: NextRequest): boolean {
  const token =
    req.headers.get('x-ingest-token') || req.nextUrl.searchParams.get('token')
  return token === process.env.INGEST_SECRET_TOKEN
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const maxStories = Math.min(body.maxStories || 5, 10)

    const stats = await ingestTrendingStories(maxStories)

    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Ingestion error:', err)
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'ready',
    sources: [
      'Google Trends US',
      'Reuters Top News',
      'Reuters World News',
      'BBC World News',
      'NPR News',
      'AP Top News',
    ],
  })
}
