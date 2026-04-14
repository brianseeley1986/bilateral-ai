import { NextRequest, NextResponse } from 'next/server'
import { getAutoPostToggle, setAutoPostToggle } from '@/lib/autopost'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ enabled: await getAutoPostToggle() })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 })
  }
  await setAutoPostToggle(body.enabled)
  return NextResponse.json({ enabled: body.enabled })
}
