import { getJournalistsByBeat, updateJournalistFetched } from './db'
import { parseRSSItems, fetchWithTimeout, scoreStoryForDebate } from './trends'
import { checkDuplicate, registerStory } from './deduplication'
import { runDebatePipeline } from './pipeline'
import { saveDebate } from './store'
import { neon } from '@neondatabase/serverless'

function getSubstackRSS(url: string): string {
  return `${url.replace(/\/$/, '')}/feed`
}

export async function fetchJournalistStories(journalist: any): Promise<string[]> {
  const urls: string[] = []

  if (journalist.substack_url) urls.push(getSubstackRSS(journalist.substack_url))
  if (journalist.rss_url) urls.push(journalist.rss_url)

  const stories: string[] = []

  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, 8000)
      if (!response.ok) continue
      const xml = await response.text()
      stories.push(...parseRSSItems(xml).slice(0, 3))
    } catch {
      continue
    }
  }

  return stories
}

export async function ingestJournalistContent(
  beats: string[] = [],
  maxDebates = 3
): Promise<{
  journalists: number
  stories: number
  debated: number
  skipped: number
  debatedTitles: string[]
}> {
  const stats = { journalists: 0, stories: 0, debated: 0, skipped: 0, debatedTitles: [] as string[] }

  let journalists: any[] = []

  if (beats.length > 0) {
    const results = await Promise.all(beats.map((b) => getJournalistsByBeat(b, 1)))
    const seen = new Set<string>()
    for (const list of results) {
      for (const j of list) {
        if (!seen.has(j.id)) {
          seen.add(j.id)
          journalists.push(j)
        }
      }
    }
  } else {
    const sql = neon(process.env.DATABASE_URL!)
    journalists = await sql`
      SELECT * FROM journalists
      WHERE tier = 1 AND active = true
      ORDER BY credibility_score DESC
      LIMIT 20
    `
  }

  stats.journalists = journalists.length
  console.log(`[journalists] checking ${journalists.length} journalists`)
  let debatedCount = 0
  const processedThisRun = new Set<string>()

  for (const journalist of journalists) {
    if (debatedCount >= maxDebates) break

    try {
      const stories = await fetchJournalistStories(journalist)
      stats.stories += stories.length
      console.log(`[journalists] ${journalist.name}: ${stories.length} stories from RSS`)

      for (const story of stories) {
        if (debatedCount >= maxDebates) break

        const key = story.toLowerCase().trim()
        if (processedThisRun.has(key)) {
          stats.skipped++
          console.log(`Session dedup hit (journalist): ${story}`)
          continue
        }
        processedThisRun.add(key)

        const dupCheck = await checkDuplicate(story)
        if (dupCheck.isDuplicate) {
          stats.skipped++
          continue
        }

        const score = await scoreStoryForDebate(story)
        if (!score.shouldDebate || score.confidence < 0.7) {
          stats.skipped++
          continue
        }

        console.log(`[journalists] debating from ${journalist.name}: ${story}`)
        const debate = await runDebatePipeline(story, 'rss')
        await saveDebate(debate)
        registerStory(story, debate.id, dupCheck.hash)

        stats.debated++
        stats.debatedTitles.push(story)
        debatedCount++

        await new Promise((r) => setTimeout(r, 2000))
      }

      await updateJournalistFetched(journalist.id)
    } catch (err) {
      console.error(`[journalists] error fetching from ${journalist.name}:`, err)
    }
  }

  console.log('[journalists] ingestion complete:', stats)
  return stats
}
