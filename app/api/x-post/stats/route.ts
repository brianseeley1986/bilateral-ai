import { NextRequest, NextResponse } from 'next/server'
import { getXPostingStats, getRecentXPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-ingest-token') || req.nextUrl.searchParams.get('token')
  if (token !== process.env.INGEST_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [stats, recent] = await Promise.all([
      getXPostingStats(),
      getRecentXPosts(10),
    ])
    return NextResponse.json({ stats, recent })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed' }, { status: 500 })
  }
}
