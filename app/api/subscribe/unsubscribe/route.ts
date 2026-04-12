import { NextRequest, NextResponse } from 'next/server'
import { unsubscribe } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }
  await unsubscribe(email)
  return NextResponse.redirect(new URL('/?unsubscribed=true', req.url))
}
