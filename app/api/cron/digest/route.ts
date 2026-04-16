import { NextRequest, NextResponse } from 'next/server'
import { sendDailyDigests } from '@/lib/digest'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = await sendDailyDigests()
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Digest cron error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
