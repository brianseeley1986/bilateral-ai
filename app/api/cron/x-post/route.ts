import { NextRequest, NextResponse } from 'next/server'
import { getUnpostedDebates, markAsPostedToX } from '@/lib/db'
import { postToX } from '@/lib/social'
import { getAutoPostToggle } from '@/lib/autopost'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await getAutoPostToggle()
  const dbHost = (process.env.DATABASE_URL || '').match(/@([^/]+)/)?.[1] || 'unknown'
  // Direct DB read to compare with the helper
  let directRead: any = null
  let directError: string | null = null
  try {
    const { neon } = await import('@neondatabase/serverless')
    const direct = neon(process.env.DATABASE_URL!)
    const rows = await direct`SELECT value FROM ingestion_state WHERE key = 'autopost_enabled'`
    directRead = (rows as any)[0]?.value ?? null
  } catch (e) {
    directError = String(e)
  }
  if (!enabled) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'auto-post disabled',
      debug: { enabled, dbHost, directRead, directError },
    })
  }

  const mockMode = process.env.X_MOCK_MODE === 'true'

  try {
    const unposted = await getUnpostedDebates(5)

    if (unposted.length === 0) {
      return NextResponse.json({ success: true, message: 'No unposted debates', posted: 0 })
    }

    const debate = unposted[0]
    const debateData = debate.data

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

    if (result.success) {
      await markAsPostedToX(debate.id, result.tweetId)
    }

    return NextResponse.json({
      success: true,
      posted: result.success ? 1 : 0,
      tweetId: result.tweetId,
      tweetText: result.tweetText,
      mock: result.mock,
      error: result.error,
    })
  } catch (err) {
    console.error('X cron error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
