import { NextRequest, NextResponse } from 'next/server'
import { scoreDebate } from '@/lib/pipeline'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { debate } = body
    if (!debate || typeof debate !== 'object') {
      return NextResponse.json({ error: 'debate object required' }, { status: 400 })
    }
    const score = await scoreDebate(debate)
    return NextResponse.json(score)
  } catch (e: any) {
    console.error('quality/test failed', e)
    return NextResponse.json(
      { error: e?.message || 'scoring failed' },
      { status: 500 }
    )
  }
}
