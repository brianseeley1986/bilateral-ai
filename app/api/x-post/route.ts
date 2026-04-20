import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getUnpostedDebates, markAsPostedToX } from '@/lib/db'
import { postToX } from '@/lib/social'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-ingest-token')
  if (token !== process.env.INGEST_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const mockMode = body.mock ?? process.env.X_MOCK_MODE === 'true'

  let debate: any

  if (body.debateId) {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`
      SELECT id, headline, slug, data, x_posted_at FROM debates WHERE id = ${body.debateId}
    `
    debate = rows[0]
    if (debate?.x_posted_at) {
      return NextResponse.json({
        error: 'Already posted',
        debateId: body.debateId,
        postedAt: debate.x_posted_at,
      }, { status: 409 })
    }
  } else {
    const unposted = await getUnpostedDebates(1)
    debate = unposted[0]
  }

  if (!debate) {
    return NextResponse.json({ error: 'No debate found' })
  }

  const debateData = debate.data

  // Mark BEFORE posting so concurrent requests or mid-flight kills
  // don't cause duplicate posts.
  if (!mockMode) {
    await markAsPostedToX(debate.id, undefined)
  }

  const result = await postToX(
    {
      id: debate.id,
      slug: debate.slug,
      headline: debate.headline || debateData.headline,
      conservativeFeedHook: debateData.conservativeFeedHook,
      liberalFeedHook: debateData.liberalFeedHook,
      conservative: debateData.conservative,
      liberal: debateData.liberal,
    },
    mockMode
  )

  if (result.success && !result.mock) {
    await markAsPostedToX(debate.id, result.tweetId)
  }

  return NextResponse.json({
    success: result.success,
    tweetId: result.tweetId,
    tweetText: result.tweetText,
    mock: result.mock,
    debateId: debate.id,
    headline: debate.headline || debateData.headline,
    error: result.error,
  })
}
