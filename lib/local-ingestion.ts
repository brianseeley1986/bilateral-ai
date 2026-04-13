import { fetchLocalStoriesForLocation, scoreStoryForDebate } from './trends'
import { checkDuplicate, registerStory } from './deduplication'
import { runDebatePipeline } from './pipeline'
import { saveDebate } from './store'
import { getIngestionState, setIngestionState } from './db'
import { neon } from '@neondatabase/serverless'

const DEFAULT_CITIES_ROTATION = [
  { city: 'Lakeland', state: 'Florida' },
  { city: 'Tampa', state: 'Florida' },
  { city: 'Orlando', state: 'Florida' },
  { city: 'Miami', state: 'Florida' },
  { city: 'Jacksonville', state: 'Florida' },
  { city: 'Atlanta', state: 'Georgia' },
  { city: 'Charlotte', state: 'North Carolina' },
  { city: 'Nashville', state: 'Tennessee' },
  { city: 'Phoenix', state: 'Arizona' },
  { city: 'Denver', state: 'Colorado' },
  { city: 'Chicago', state: 'Illinois' },
  { city: 'Seattle', state: 'Washington' },
]

export async function ingestNextDefaultCity(maxDebates = 2): Promise<{
  city: string
  state: string
  debated: number
  skipped: number
  storiesFound: number
  nextCity: string
  index: number
}> {
  const lastIndex = await getIngestionState('last_default_city_index')
  const currentIndex = lastIndex
    ? (parseInt(lastIndex) + 1) % DEFAULT_CITIES_ROTATION.length
    : 0

  const loc = DEFAULT_CITIES_ROTATION[currentIndex]
  const nextIndex = (currentIndex + 1) % DEFAULT_CITIES_ROTATION.length
  const next = DEFAULT_CITIES_ROTATION[nextIndex]

  console.log(`[local] Processing default city: ${loc.city}, ${loc.state} (${currentIndex + 1}/${DEFAULT_CITIES_ROTATION.length})`)

  const result = await fetchLocalStoriesForLocation(undefined, loc.city, loc.state, undefined, 5)
  console.log(`[local] ${loc.city}: resolved=${result.resolvedLevel}, stories=${result.stories.length}`)

  let debated = 0
  let skipped = 0

  for (const story of result.stories) {
    if (debated >= maxDebates) break

    const dupCheck = await checkDuplicate(story.title)
    if (dupCheck.isDuplicate) {
      skipped++
      continue
    }

    const score = await scoreStoryForDebate(story.title)
    if (!score.shouldDebate || score.confidence < 0.65) {
      skipped++
      continue
    }

    try {
      const debate = await runDebatePipeline(story.title, 'rss', loc.city, loc.state)
      await saveDebate(debate)
      registerStory(story.title, debate.id, dupCheck.hash)
      debated++
      await new Promise((r) => setTimeout(r, 1000))
    } catch (err) {
      console.error('[local] Pipeline error:', err)
      skipped++
    }
  }

  await setIngestionState('last_default_city_index', currentIndex.toString())

  return {
    city: loc.city,
    state: loc.state,
    debated,
    skipped,
    storiesFound: result.stories.length,
    nextCity: `${next.city}, ${next.state}`,
    index: currentIndex,
  }
}

export async function ingestSpecificCity(
  city: string,
  state: string,
  maxDebates = 2
): Promise<{ city: string; state: string; debated: number; skipped: number; storiesFound: number }> {
  console.log(`[local] Processing specific city: ${city}, ${state}`)
  const result = await fetchLocalStoriesForLocation(undefined, city, state, undefined, 5)
  let debated = 0
  let skipped = 0

  for (const story of result.stories) {
    if (debated >= maxDebates) break
    const dupCheck = await checkDuplicate(story.title)
    if (dupCheck.isDuplicate) { skipped++; continue }
    const score = await scoreStoryForDebate(story.title)
    if (!score.shouldDebate || score.confidence < 0.65) { skipped++; continue }
    try {
      const debate = await runDebatePipeline(story.title, 'rss', city, state)
      await saveDebate(debate)
      registerStory(story.title, debate.id, dupCheck.hash)
      debated++
      await new Promise((r) => setTimeout(r, 1000))
    } catch (err) {
      console.error('[local] Pipeline error:', err)
      skipped++
    }
  }

  return { city, state, debated, skipped, storiesFound: result.stories.length }
}


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
    SELECT zip, latitude, longitude, city, region, county
    FROM subscribers
    WHERE id = ${subscriberId}
    AND confirmed = true
  `

  if (rows.length === 0) return stats
  const subscriber = rows[0]
  if (!subscriber.city && !subscriber.region && !subscriber.zip) return stats

  const result = await fetchLocalStoriesForLocation(
    subscriber.zip || undefined,
    subscriber.city || undefined,
    subscriber.region || undefined,
    subscriber.county || undefined,
    3
  )
  console.log(`[local] subscriber ${subscriberId}: resolved=${result.resolvedLevel} (${result.resolvedLocation})`)

  stats.found = result.stories.length
  const processedThisRun = new Set<string>()

  for (const story of result.stories) {
    try {
      const key = story.title.toLowerCase().trim()
      if (processedThisRun.has(key)) {
        stats.skipped++
        continue
      }
      processedThisRun.add(key)

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

      const debate = await runDebatePipeline(story.title, 'rss', story.city, story.state)
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

const DEFAULT_CITIES = [
  { city: 'Lakeland', region: 'Florida' },
  { city: 'Tampa', region: 'Florida' },
  { city: 'Orlando', region: 'Florida' },
  { city: 'Miami', region: 'Florida' },
  { city: 'Jacksonville', region: 'Florida' },
  { city: 'Atlanta', region: 'Georgia' },
  { city: 'Charlotte', region: 'North Carolina' },
  { city: 'Nashville', region: 'Tennessee' },
  { city: 'Phoenix', region: 'Arizona' },
  { city: 'Denver', region: 'Colorado' },
]

async function ingestForLocation(
  loc: { zip?: string; city?: string; region?: string; county?: string },
  maxDebates: number,
  processedThisRun: Set<string>
): Promise<number> {
  let debated = 0
  const result = await fetchLocalStoriesForLocation(
    loc.zip || undefined,
    loc.city || undefined,
    loc.region || undefined,
    loc.county || undefined,
    maxDebates
  )
  console.log(`[local] ${loc.city || loc.zip}: resolved=${result.resolvedLevel} (${result.resolvedLocation}), stories=${result.stories.length}`)

  for (const story of result.stories.slice(0, maxDebates)) {
    const key = story.title.toLowerCase().trim()
    if (processedThisRun.has(key)) {
      console.log(`Session dedup hit (local): ${story.title}`)
      continue
    }
    processedThisRun.add(key)

    const dupCheck = await checkDuplicate(story.title)
    if (dupCheck.isDuplicate) continue

    const score = await scoreStoryForDebate(story.title)
    if (!score.shouldDebate) continue

    const debate = await runDebatePipeline(story.title, 'rss', story.city, story.state)
    await saveDebate(debate)
    registerStory(story.title, debate.id, dupCheck.hash)
    debated++

    await new Promise((r) => setTimeout(r, 1500))
  }
  return debated
}

export async function ingestLocalStoriesForAllSubscribers(
  maxDebatesPerLocation = 2
): Promise<{ locations: number; totalDebated: number; defaultCities: number }> {
  let totalDebated = 0
  let defaultCityDebates = 0
  const processedThisRun = new Set<string>()

  // Process default cities first (1 debate each)
  console.log(`[local] Processing ${DEFAULT_CITIES.length} default cities...`)
  for (const loc of DEFAULT_CITIES) {
    try {
      const count = await ingestForLocation(loc, 1, processedThisRun)
      defaultCityDebates += count
      totalDebated += count
    } catch (err) {
      console.error(`Error ingesting default city ${loc.city}:`, err)
    }
  }

  // Then process subscriber locations (up to maxDebatesPerLocation each)
  const sql = getSql()
  const rows = await sql`
    SELECT DISTINCT zip, region, city, county
    FROM subscribers
    WHERE confirmed = true
    AND unsubscribed_at IS NULL
    AND 'local' = ANY(topics)
    AND (zip IS NOT NULL OR latitude IS NOT NULL)
  `
  console.log(`[local] Found ${rows.length} subscriber locations`)

  for (const location of rows) {
    try {
      const count = await ingestForLocation(location, maxDebatesPerLocation, processedThisRun)
      totalDebated += count
    } catch (err) {
      console.error('Error ingesting for location:', location, err)
    }
  }

  return { locations: rows.length + DEFAULT_CITIES.length, totalDebated, defaultCities: defaultCityDebates }
}
