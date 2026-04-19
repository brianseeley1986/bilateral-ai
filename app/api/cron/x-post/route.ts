import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getUnpostedDebates, markAsPostedToX, getRecentXPostedHeadlines } from '@/lib/db'
import { postToX } from '@/lib/social'
import { compareHeadlines } from '@/lib/deduplication'

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
    const unposted = await getUnpostedDebates(10)

    if (unposted.length === 0) {
      return NextResponse.json({ success: true, message: 'No unposted debates', posted: 0 })
    }

    // Check each candidate against recently posted headlines to avoid
    // posting the same story twice (different headline, same topic).
    const recentHeadlines = await getRecentXPostedHeadlines(72)
    let debate: (typeof unposted)[0] | null = null
    const skippedDupes: string[] = []

    for (const candidate of unposted) {
      const candidateHeadline = candidate.headline || candidate.data?.headline || ''
      const isTooSimilar = recentHeadlines.some(
        (posted) => compareHeadlines(candidateHeadline, posted) >= 0.35
      )
      if (isTooSimilar) {
        // Mark it so it doesn't clog the queue forever
        await markAsPostedToX(candidate.id, 'skipped-duplicate')
        skippedDupes.push(candidateHeadline)
        continue
      }
      debate = candidate
      break
    }

    if (!debate) {
      return NextResponse.json({
        success: true,
        message: 'All candidates were duplicates of recent posts',
        skippedDupes,
        posted: 0,
      })
    }

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
    }
    // On any failure (duplicate, rate limit, timeout): keep it marked.
    // A skipped debate is better than a duplicate post. The admin panel
    // can manually retry if needed.

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
