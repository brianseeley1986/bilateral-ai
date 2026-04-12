import { NextRequest, NextResponse } from 'next/server'
import { ingestLocalStoriesForAllSubscribers } from '@/lib/local-ingestion'
import { acquireIngestionLock, releaseIngestionLock } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locked = await acquireIngestionLock('local-ingest', 15)
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: 'already running' })
  }

  try {
    console.log('Local cron ingestion starting...')
    const stats = await ingestLocalStoriesForAllSubscribers(2)
    console.log('Local cron ingestion complete:', stats)
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Local cron error:', err)
    return NextResponse.json({ error: 'Local cron failed' }, { status: 500 })
  } finally {
    await releaseIngestionLock('local-ingest')
  }
}
