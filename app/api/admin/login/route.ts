import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const secret = process.env.ADMIN_SECRET || ''

  if (!secret) {
    return NextResponse.json({ error: 'ADMIN_SECRET not configured' }, { status: 500 })
  }

  if (!password || password !== secret) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
