import { fetchLocalStoriesForLocation, scoreStoryForDebate } from './trends'
import { checkDuplicate, registerStory } from './deduplication'
import { runDebatePipeline } from './pipeline'
import { saveDebate } from './store'
import { getIngestionState, setIngestionState } from './db'
import { neon } from '@neondatabase/serverless'

export const DEFAULT_CITIES: Array<{ city: string; state: string }> = [
  { city: 'Tampa', state: 'Florida' },
  { city: 'Orlando', state: 'Florida' },
  { city: 'Miami', state: 'Florida' },
  { city: 'Jacksonville', state: 'Florida' },
  { city: 'Tallahassee', state: 'Florida' },
  { city: 'Atlanta', state: 'Georgia' },
  { city: 'Charlotte', state: 'North Carolina' },
  { city: 'Raleigh', state: 'North Carolina' },
  { city: 'Nashville', state: 'Tennessee' },
  { city: 'Memphis', state: 'Tennessee' },
  { city: 'Birmingham', state: 'Alabama' },
  { city: 'New Orleans', state: 'Louisiana' },
  { city: 'Houston', state: 'Texas' },
  { city: 'Dallas', state: 'Texas' },
  { city: 'San Antonio', state: 'Texas' },
  { city: 'Austin', state: 'Texas' },
  { city: 'Oklahoma City', state: 'Oklahoma' },
  { city: 'Louisville', state: 'Kentucky' },
  { city: 'Chicago', state: 'Illinois' },
  { city: 'Detroit', state: 'Michigan' },
  { city: 'Cleveland', state: 'Ohio' },
  { city: 'Columbus', state: 'Ohio' },
  { city: 'Indianapolis', state: 'Indiana' },
  { city: 'Milwaukee', state: 'Wisconsin' },
  { city: 'Minneapolis', state: 'Minnesota' },
  { city: 'Kansas City', state: 'Missouri' },
  { city: 'St. Louis', state: 'Missouri' },
  { city: 'Pittsburgh', state: 'Pennsylvania' },
  { city: 'Philadelphia', state: 'Pennsylvania' },
  { city: 'Baltimore', state: 'Maryland' },
  { city: 'Washington', state: 'DC' },
  { city: 'Richmond', state: 'Virginia' },
  { city: 'Virginia Beach', state: 'Virginia' },
  { city: 'Boston', state: 'Massachusetts' },
  { city: 'Providence', state: 'Rhode Island' },
  { city: 'Hartford', state: 'Connecticut' },
  { city: 'Buffalo', state: 'New York' },
  { city: 'New York', state: 'New York' },
  { city: 'Denver', state: 'Colorado' },
  { city: 'Phoenix', state: 'Arizona' },
  { city: 'Tucson', state: 'Arizona' },
  { city: 'Las Vegas', state: 'Nevada' },
  { city: 'Salt Lake City', state: 'Utah' },
  { city: 'Albuquerque', state: 'New Mexico' },
  { city: 'Los Angeles', state: 'California' },
  { city: 'San Francisco', state: 'California' },
  { city: 'San Diego', state: 'California' },
  { city: 'Sacramento', state: 'California' },
  { city: 'Seattle', state: 'Washington' },
  { city: 'Portland', state: 'Oregon' },
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
    ? (parseInt(lastIndex) + 1) % DEFAULT_CITIES.length
    : 0

  const loc = DEFAULT_CITIES[currentIndex]
  const nextIndex = (currentIndex + 1) % DEFAULT_CITIES.length
  const next = DEFAULT_CITIES[nextIndex]

  console.log(`[local] Processing default city: ${loc.city}, ${loc.state} (${currentIndex + 1}/${DEFAULT_CITIES.length})`)

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

export async function generateSignupLocalDebates(sub: {
  id: string
  city?: string | null
  region?: string | null
  zip?: string | null
  county?: string | null
}): Promise<{ debated: number; skipped: number }> {
  const stats = { debated: 0, skipped: 0 }
  if (!sub.city && !sub.region && !sub.zip) return stats

  const result = await fetchLocalStoriesForLocation(
    sub.zip || undefined,
    sub.city || undefined,
    sub.region || undefined,
    sub.county || undefined,
    5
  )
  console.log(`[local] signup ${sub.id}: resolved=${result.resolvedLevel} (${result.resolvedLocation})`)

  const processedThisRun = new Set<string>()

  for (const story of result.stories) {
    if (stats.debated >= 3) break
    try {
      const key = story.title.toLowerCase().trim()
      if (processedThisRun.has(key)) { stats.skipped++; continue }
      processedThisRun.add(key)

      const dupCheck = await checkDuplicate(story.title)
      if (dupCheck.isDuplicate) { stats.skipped++; continue }

      const score = await scoreStoryForDebate(story.title)
      if (!score.shouldDebate || score.confidence < 0.65) { stats.skipped++; continue }

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

async function ingestForLocation(
  loc: { zip?: string; city?: string; state?: string; county?: string },
  maxDebates: number,
  processedThisRun: Set<string>
): Promise<number> {
  let debated = 0
  const result = await fetchLocalStoriesForLocation(
    loc.zip || undefined,
    loc.city || undefined,
    loc.state || undefined,
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

  // Process all 50 default cities (max 2 debates each)
  console.log(`[local] Processing ${DEFAULT_CITIES.length} default cities...`)
  for (const loc of DEFAULT_CITIES) {
    try {
      const count = await ingestForLocation(loc, maxDebatesPerLocation, processedThisRun)
      defaultCityDebates += count
      totalDebated += count
    } catch (err) {
      console.error(`Error ingesting default city ${loc.city}:`, err)
    }
  }

  // Then process unique subscriber locations
  const sql = getSql()
  const rows = await sql`
    SELECT DISTINCT zip, region AS state, city, county
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
