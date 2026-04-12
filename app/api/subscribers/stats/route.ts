import { NextResponse } from 'next/server'
import { getSubscriberStats, initDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await initDb()
    const stats = await getSubscriberStats()
    return NextResponse.json(stats)
  } catch (err: any) {
    console.error('subscriber stats error', err)
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
