import { NextRequest, NextResponse } from 'next/server'
import { getAllDebates, getDebate, saveDebate } from '@/lib/store'

export const dynamic = 'force-dynamic'
import {
  postToX,
  postToLinkedIn,
  postToReddit,
  postToFacebook,
  postToInstagram,
} from '@/lib/autopost'
import type { CampaignStatus } from '@/types/debate'

const VALID_STATUSES: CampaignStatus[] = ['pending', 'approved', 'posted', 'skipped']

export async function GET() {
  const debates = await getAllDebates()
  const items = debates
    .filter((d) => d.campaign)
    .map((d) => ({
      debateId: d.id,
      headline: d.headline,
      track: d.track,
      geographicScope: d.geographicScope,
      createdAt: d.createdAt,
      campaign: d.campaign,
      publishStatus: d.publishStatus,
      qualityScore: d.qualityScore,
    }))
  return NextResponse.json(items)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { debateId, status, autoPost } = body
  if (!debateId) {
    return NextResponse.json({ error: 'debateId required' }, { status: 400 })
  }
  const debate = await getDebate(debateId)
  if (!debate || !debate.campaign) {
    return NextResponse.json({ error: 'debate or campaign not found' }, { status: 404 })
  }
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 })
    }
    debate.campaign.status = status
    if (status === 'approved') {
      debate.campaign.approvedAt = new Date().toISOString()
    }
  }
  if (typeof autoPost === 'boolean') {
    debate.campaign.autoPost = autoPost
  }
  await saveDebate(debate)
  return NextResponse.json({ ok: true, campaign: debate.campaign })
}

export async function POST(req: NextRequest) {
  const { debateId, platform } = await req.json()
  if (!debateId || !platform) {
    return NextResponse.json({ error: 'debateId and platform required' }, { status: 400 })
  }
  const debate = await getDebate(debateId)
  if (!debate || !debate.campaign) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const { posts, targeting } = debate.campaign
  try {
    switch (platform) {
      case 'xA':
        await postToX(posts.xA)
        break
      case 'xB':
        await postToX(posts.xB)
        break
      case 'xThread':
        for (const tweet of posts.xThread) await postToX(tweet)
        break
      case 'linkedin':
        await postToLinkedIn(posts.linkedin)
        break
      case 'facebook':
        await postToFacebook(posts.facebook)
        break
      case 'reddit':
        await postToReddit(targeting.subreddits[0] || 'test', posts.reddit)
        break
      case 'instagram':
        await postToInstagram(posts.instagram)
        break
      default:
        return NextResponse.json({ error: `platform ${platform} not supported` }, { status: 400 })
    }
    debate.campaign.postedAt = new Date().toISOString()
    debate.campaign.status = 'posted'
    await saveDebate(debate)
    return NextResponse.json({ posted: true, platform })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'post failed' }, { status: 500 })
  }
}
