import { NextRequest, NextResponse } from 'next/server'
import { sendLocalWeeklyDigests } from '@/lib/local-digest'
import { acquireIngestionLock, releaseIngestionLock, getIngestionState } from '@/lib/db'

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

  const locked = await acquireIngestionLock('local-digest', 15)
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: 'already running' })
  }

  try {
    console.log('Local digest cron starting...')
    const stats = await sendLocalWeeklyDigests()
    console.log('Local digest cron complete:', stats)
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Local digest cron error:', err)
    return NextResponse.json({ error: 'Local digest cron failed' }, { status: 500 })
  } finally {
    await releaseIngestionLock('local-digest')
  }
}
