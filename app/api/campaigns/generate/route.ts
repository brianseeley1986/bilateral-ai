import { NextRequest, NextResponse } from 'next/server'
import { getDebate, saveDebate } from '@/lib/store'
import { runAdvertising } from '@/lib/pipeline'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { debateId } = await req.json()
  if (!debateId) {
    return NextResponse.json({ error: 'debateId required' }, { status: 400 })
  }
  const debate = await getDebate(debateId)
  if (!debate) {
    return NextResponse.json({ error: 'debate not found' }, { status: 404 })
  }

  const campaign = await runAdvertising(debate)
  if (!campaign) {
    return NextResponse.json({ error: 'campaign generation failed' }, { status: 500 })
  }

  debate.campaign = campaign
  await saveDebate(debate)
  return NextResponse.json({ ok: true, campaign })
}
