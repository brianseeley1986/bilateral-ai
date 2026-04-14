import { NextRequest, NextResponse } from 'next/server'
import { deleteDebate } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') || req.headers.get('x-admin-key') || ''
  const secret = process.env.ADMIN_SECRET || ''
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await deleteDebate(id)
  return NextResponse.json({ ok: true, id })
}
