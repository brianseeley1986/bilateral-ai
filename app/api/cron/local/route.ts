import { NextRequest, NextResponse } from 'next/server'
import { ingestNextDefaultCity } from '@/lib/local-ingestion'
import { acquireIngestionLock, releaseIngestionLock } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locked = await acquireIngestionLock('local-ingest', 10)
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: 'already running' })
  }

  try {
    console.log('Local cron: processing next default city...')
    const result = await ingestNextDefaultCity(2)
    console.log('Local cron result:', result)
    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('Local cron error:', err)
    return NextResponse.json({ error: 'Local cron failed' }, { status: 500 })
  } finally {
    await releaseIngestionLock('local-ingest')
  }
}
