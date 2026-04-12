import { fetchLocalStoriesForLocation, scoreStoryForDebate } from './trends'
import { checkDuplicate, registerStory } from './deduplication'
import { runDebatePipeline } from './pipeline'
import { saveDebate } from './store'
import { neon } from '@neondatabase/serverless'

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

export async function ingestLocalStoriesForSubscriber(subscriberId: string): Promise<{
  found: number
  debated: number
  skipped: number
}> {
  const stats = { found: 0, debated: 0, skipped: 0 }
  const sql = getSql()

  const rows = await sql`
    SELECT zip, latitude, longitude, city, region
    FROM subscribers
    WHERE id = ${subscriberId}
    AND confirmed = true
  `

  if (rows.length === 0) return stats
  const subscriber = rows[0]
  if (!subscriber.zip && !subscriber.latitude) return stats

  const localStories = await fetchLocalStoriesForLocation(
    subscriber.zip || undefined,
    subscriber.region || undefined,
    3
  )

  stats.found = localStories.length

  for (const story of localStories) {
    try {
      const dupCheck = await checkDuplicate(story.title)
      if (dupCheck.isDuplicate) {
        stats.skipped++
        continue
      }

      const score = await scoreStoryForDebate(story.title)
      if (!score.shouldDebate || score.confidence < 0.65) {
        stats.skipped++
        continue
      }

      const debate = await runDebatePipeline(story.title, 'rss')
      await saveDebate(debate)
      registerStory(story.title, debate.id, dupCheck.hash)

      stats.debated++
      await new Promise((r) => setTimeout(r, 1500))
    } catch (err) {
      console.error(`Error processing local story: ${story.title}`, err)
      stats.skipped++
    }
  }

  return stats
}

export async function ingestLocalStoriesForAllSubscribers(
  maxDebatesPerLocation = 2
): Promise<{ locations: number; totalDebated: number }> {
  const sql = getSql()

  const rows = await sql`
    SELECT DISTINCT zip, region, city
    FROM subscribers
    WHERE confirmed = true
    AND unsubscribed_at IS NULL
    AND 'local' = ANY(topics)
    AND (zip IS NOT NULL OR latitude IS NOT NULL)
  `

  console.log(`Found ${rows.length} unique subscriber locations for local ingestion`)

  let totalDebated = 0

  for (const location of rows) {
    try {
      const stories = await fetchLocalStoriesForLocation(
        location.zip || undefined,
        location.region || undefined,
        maxDebatesPerLocation
      )

      for (const story of stories.slice(0, maxDebatesPerLocation)) {
        const dupCheck = await checkDuplicate(story.title)
        if (dupCheck.isDuplicate) continue

        const score = await scoreStoryForDebate(story.title)
        if (!score.shouldDebate) continue

        const debate = await runDebatePipeline(story.title, 'rss')
        await saveDebate(debate)
        registerStory(story.title, debate.id, dupCheck.hash)
        totalDebated++

        await new Promise((r) => setTimeout(r, 1500))
      }
    } catch (err) {
      console.error('Error ingesting for location:', location, err)
    }
  }

  return { locations: rows.length, totalDebated }
}
