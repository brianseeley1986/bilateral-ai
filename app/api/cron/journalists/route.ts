import { NextRequest, NextResponse } from 'next/server'
import { ingestJournalistContent } from '@/lib/journalist-ingestion'
import { acquireIngestionLock, releaseIngestionLock } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locked = await acquireIngestionLock('journalist-ingest', 15)
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: 'already running' })
  }

  try {
    console.log('Journalist cron starting...')
    const stats = await ingestJournalistContent([], 3)
    console.log('Journalist cron complete:', stats)
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Journalist cron error:', err)
    return NextResponse.json({ error: 'Journalist cron failed' }, { status: 500 })
  } finally {
    await releaseIngestionLock('journalist-ingest')
  }
}
