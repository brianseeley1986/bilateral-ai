import { NextRequest, NextResponse } from 'next/server'
import { runDebatePipeline } from '@/lib/pipeline'
import { saveDebate, getDebate } from '@/lib/store'
import { queueCampaign, getAutoPostToggle } from '@/lib/autopost'
import { checkDuplicate, registerStory } from '@/lib/deduplication'

export async function POST(req: NextRequest) {
  try {
    const { headline } = await req.json()
    if (!headline || typeof headline !== 'string') {
      return NextResponse.json({ error: 'headline required' }, { status: 400 })
    }

    const dedup = await checkDuplicate(headline)
    if (dedup.isDuplicate) {
      return NextResponse.json(
        {
          duplicate: true,
          reason: dedup.reason,
          existingDebateId: dedup.existingDebateId,
          similarityScore: dedup.similarityScore,
        },
        { status: 409 }
      )
    }

    const debate = await runDebatePipeline(headline)

    if (debate.campaign && getAutoPostToggle()) {
      debate.campaign.autoPost = true
      debate.campaign.status = 'approved'
      debate.campaign.approvedAt = new Date().toISOString()
    }

    saveDebate(debate)
    registerStory(headline, debate.id, dedup.hash)

    if (debate.campaign) {
      await queueCampaign(debate.campaign, debate.id)
    }

    return NextResponse.json({
      id: debate.id,
      publishStatus: debate.publishStatus,
      qualityScore: debate.qualityScore,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Pipeline failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const debate = getDebate(id)
  if (!debate) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(debate)
}
