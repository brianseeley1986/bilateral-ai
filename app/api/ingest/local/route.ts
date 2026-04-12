import { NextRequest, NextResponse } from 'next/server'
import {
  ingestLocalStoriesForAllSubscribers,
  ingestLocalStoriesForSubscriber,
} from '@/lib/local-ingestion'

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

    if (body.subscriberId) {
      const stats = await ingestLocalStoriesForSubscriber(body.subscriberId)
      return NextResponse.json({ success: true, stats })
    }

    const stats = await ingestLocalStoriesForAllSubscribers(body.maxPerLocation || 2)
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Local ingestion error:', err)
    return NextResponse.json({ error: 'Local ingestion failed' }, { status: 500 })
  }
}
