import { NextRequest, NextResponse } from 'next/server'
import { ingestTrendingStories } from '@/lib/trends'
import { acquireIngestionLock, releaseIngestionLock, cleanExpiredResearchCache } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locked = await acquireIngestionLock('main-ingest', 15)
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: 'already running' })
  }

  try {
    console.log('Cron ingestion starting...')
    await cleanExpiredResearchCache()
    const stats = await ingestTrendingStories(2)
    console.log('Cron ingestion complete:', stats)
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Cron ingestion error:', err)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  } finally {
    await releaseIngestionLock('main-ingest')
  }
}
