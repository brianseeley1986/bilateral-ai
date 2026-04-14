import { NextRequest, NextResponse } from 'next/server'
import { getIngestionState, setIngestionState } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const v = await getIngestionState('local_ingest_enabled')
  return NextResponse.json({ enabled: v === 'true' })
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') || req.headers.get('x-admin-key') || ''
  const secret = process.env.ADMIN_SECRET || ''
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 })
  }
  await setIngestionState('local_ingest_enabled', body.enabled ? 'true' : 'false')
  return NextResponse.json({ enabled: body.enabled })
}
