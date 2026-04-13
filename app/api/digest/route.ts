import { NextRequest, NextResponse } from 'next/server'
import { sendDailyDigests } from '@/lib/digest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get('x-ingest-token') || req.nextUrl.searchParams.get('token')
  return !!token && token === process.env.INGEST_SECRET_TOKEN
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const stats = await sendDailyDigests()
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Manual digest error:', err)
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 })
  }
}
