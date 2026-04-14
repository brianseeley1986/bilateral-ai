import { NextRequest, NextResponse } from 'next/server'
import { ingestLocalStoriesForAllSubscribers } from '@/lib/local-ingestion'
import { acquireIngestionLock, releaseIngestionLock, cleanExpiredResearchCache, getIngestionState } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if ((await getIngestionState('local_ingest_enabled')) !== 'true') {
    return NextResponse.json({ skipped: true, reason: 'local ingest disabled' })
  }

  const locked = await acquireIngestionLock('local-daily', 25)
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: 'already running' })
  }

  try {
    console.log('Local daily cron starting...')
    await cleanExpiredResearchCache()
    const stats = await ingestLocalStoriesForAllSubscribers(2)
    console.log('Local daily cron complete:', stats)
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Local daily cron error:', err)
    return NextResponse.json({ error: 'Local daily cron failed' }, { status: 500 })
  } finally {
    await releaseIngestionLock('local-daily')
  }
}
