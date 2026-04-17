import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getUnpostedDebates, markAsPostedToX, unmarkXPost } from '@/lib/db'
import { postToX } from '@/lib/social'

async function readAutoPostToggle(): Promise<boolean> {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = (await sql`SELECT value FROM ingestion_state WHERE key = 'autopost_enabled'`) as Array<{ value: string }>
    return rows[0]?.value === 'true'
  } catch (e) {
    console.error('readAutoPostToggle failed', e)
    return false
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await readAutoPostToggle()
  if (!enabled) {
    return NextResponse.json({ success: true, skipped: true, reason: 'auto-post disabled' })
  }

  const mockMode = process.env.X_MOCK_MODE === 'true'

  try {
    const unposted = await getUnpostedDebates(5)

    if (unposted.length === 0) {
      return NextResponse.json({ success: true, message: 'No unposted debates', posted: 0 })
    }

    const debate = unposted[0]
    const debateData = debate.data

    // Mark BEFORE posting so if the function is killed mid-flight (deploy,
    // timeout) the debate doesn't get re-posted. On failure we unmark.
    await markAsPostedToX(debate.id, undefined)

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
      // Update with the actual tweet ID
      await markAsPostedToX(debate.id, result.tweetId)
    } else if (result.error && /duplicate content/i.test(result.error)) {
      // X already saw this URL — keep it marked so the cron moves on.
    } else {
      // Real failure — unmark so the cron retries next run.
      await unmarkXPost(debate.id)
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
