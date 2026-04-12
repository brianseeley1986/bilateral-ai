import { NextRequest, NextResponse } from 'next/server'
import { confirmSubscriber } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/?confirmed=false', req.url))
  }
  const confirmed = await confirmSubscriber(token)
  return NextResponse.redirect(
    new URL(confirmed ? '/?confirmed=true' : '/?confirmed=false', req.url)
  )
}
