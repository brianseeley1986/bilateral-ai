import { checkDuplicate, registerStory } from './deduplication'
import { runDebatePipeline } from './pipeline'
import { saveDebate } from './store'

const TRENDS_RSS_URL =
  'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US'

const RSS_FEEDS = [
  { url: 'https://feeds.reuters.com/reuters/topNews', name: 'Reuters Top News', scope: 'national' },
  { url: 'https://feeds.reuters.com/Reuters/worldNews', name: 'Reuters World News', scope: 'international' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World News', scope: 'international' },
  { url: 'https://feeds.npr.org/1001/rss.xml', name: 'NPR News', scope: 'national' },
  { url: 'https://rss.apnews.com/apf-topnews', name: 'AP Top News', scope: 'national' },
]

const LOCAL_RSS_FEEDS: Record<
  string,
  { url: string; name: string; city: string; state: string; stateAbbr: string; zip_prefixes: string[] }[]
> = {
  florida: [
    { url: 'https://www.tampabay.com/feed/', name: 'Tampa Bay Times', city: 'Tampa', state: 'Florida', stateAbbr: 'FL', zip_prefixes: ['33', '34'] },
    { url: 'https://www.orlandosentinel.com/feed/', name: 'Orlando Sentinel', city: 'Orlando', state: 'Florida', stateAbbr: 'FL', zip_prefixes: ['32'] },
    { url: 'https://www.miamiherald.com/news/local/?outputType=rss', name: 'Miami Herald', city: 'Miami', state: 'Florida', stateAbbr: 'FL', zip_prefixes: ['33', '34'] },
    { url: 'https://www.theledger.com/feed/', name: 'The Ledger', city: 'Lakeland', state: 'Florida', stateAbbr: 'FL', zip_prefixes: ['338'] },
    { url: 'https://www.sun-sentinel.com/feed/', name: 'Sun Sentinel', city: 'Fort Lauderdale', state: 'Florida', stateAbbr: 'FL', zip_prefixes: ['333'] },
  ],
  texas: [
    { url: 'https://www.houstonchronicle.com/feed/', name: 'Houston Chronicle', city: 'Houston', state: 'Texas', stateAbbr: 'TX', zip_prefixes: ['77'] },
    { url: 'https://www.dallasnews.com/arc/outboundfeeds/rss/', name: 'Dallas Morning News', city: 'Dallas', state: 'Texas', stateAbbr: 'TX', zip_prefixes: ['75', '76'] },
  ],
  new_york: [
    { url: 'https://gothamist.com/feed', name: 'Gothamist', city: 'New York City', state: 'New York', stateAbbr: 'NY', zip_prefixes: ['10', '11'] },
  ],
  california: [
    { url: 'https://www.latimes.com/local/rss2.0.xml', name: 'LA Times Local', city: 'Los Angeles', state: 'California', stateAbbr: 'CA', zip_prefixes: ['90', '91'] },
    { url: 'https://www.sfchronicle.com/feed/', name: 'SF Chronicle', city: 'San Francisco', state: 'California', stateAbbr: 'CA', zip_prefixes: ['94'] },
  ],
  illinois: [
    { url: 'https://www.chicagotribune.com/feed/', name: 'Chicago Tribune', city: 'Chicago', state: 'Illinois', stateAbbr: 'IL', zip_prefixes: ['60'] },
  ],
  georgia: [
    { url: 'https://www.ajc.com/feed/', name: 'Atlanta Journal-Constitution', city: 'Atlanta', state: 'Georgia', stateAbbr: 'GA', zip_prefixes: ['30', '31'] },
  ],
  washington: [
    { url: 'https://www.seattletimes.com/feed/', name: 'Seattle Times', city: 'Seattle', state: 'Washington', stateAbbr: 'WA', zip_prefixes: ['98'] },
  ],
}

interface TrendingStory {
  title: string
  source: string
  scope: string
  sourceType: 'trending' | 'rss'
  city?: string
  state?: string
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Bilateral/1.0 News Aggregator' },
    })
  } finally {
    clearTimeout(timeout)
  }
}

function extractTextContent(xml: string, tag: string): string {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]+)\\]\\]></${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = xml.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return ''
}

function parseRSSItems(xml: string): string[] {
  const items: string[] = []
  const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemPattern.exec(xml)) !== null) {
    const title = extractTextContent(match[1], 'title')
    if (title && title.length > 10) items.push(title)
  }
  return items.slice(0, 10)
}

export async function fetchGoogleTrends(): Promise<TrendingStory[]> {
  try {
    const response = await fetchWithTimeout(TRENDS_RSS_URL)
    if (!response.ok) return []
    const xml = await response.text()
    return parseRSSItems(xml).map((title) => ({
      title,
      source: 'Google Trends',
      scope: 'national',
      sourceType: 'trending' as const,
    }))
  } catch (err) {
    console.error('Google Trends fetch failed:', err)
    return []
  }
}

export async function fetchRSSFeeds(): Promise<TrendingStory[]> {
  const stories: TrendingStory[] = []
  await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const response = await fetchWithTimeout(feed.url)
        if (!response.ok) return
        const xml = await response.text()
        for (const title of parseRSSItems(xml).slice(0, 5)) {
          stories.push({ title, source: feed.name, scope: feed.scope, sourceType: 'rss' })
        }
      } catch (err) {
        console.error(`RSS fetch failed for ${feed.name}:`, err)
      }
    })
  )
  return stories
}

export function getLocalFeedsForZip(zip: string) {
  const results: (typeof LOCAL_RSS_FEEDS)[string] = []
  for (const feeds of Object.values(LOCAL_RSS_FEEDS)) {
    for (const feed of feeds) {
      if (feed.zip_prefixes.some((prefix) => zip.startsWith(prefix))) {
        results.push(feed)
      }
    }
  }
  return results
}

export function getLocalFeedsForState(state: string) {
  const lower = state.toLowerCase()
  const results: (typeof LOCAL_RSS_FEEDS)[string] = []
  for (const feeds of Object.values(LOCAL_RSS_FEEDS)) {
    for (const feed of feeds) {
      if (feed.state.toLowerCase().includes(lower) || feed.stateAbbr.toLowerCase() === lower) {
        results.push(feed)
      }
    }
  }
  return results
}

export async function fetchLocalStoriesForLocation(
  zip?: string,
  state?: string,
  maxPerFeed = 5
): Promise<TrendingStory[]> {
  const feeds = zip ? getLocalFeedsForZip(zip) : state ? getLocalFeedsForState(state) : []
  if (feeds.length === 0) return []

  const stories: TrendingStory[] = []
  await Promise.allSettled(
    feeds.map(async (feed) => {
      try {
        const response = await fetchWithTimeout(feed.url)
        if (!response.ok) return
        const xml = await response.text()
        for (const title of parseRSSItems(xml).slice(0, maxPerFeed)) {
          stories.push({
            title,
            source: feed.name,
            scope: 'local',
            sourceType: 'rss',
            city: feed.city,
            state: feed.state,
          })
        }
      } catch (err) {
        console.error(`Local RSS fetch failed for ${feed.name}:`, err)
      }
    })
  )
  return stories
}

export async function scoreStoryForDebate(
  title: string
): Promise<{ shouldDebate: boolean; reason: string; confidence: number }> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,
    system: `You are a news story scorer for Bilateral News, a platform that produces Conservative vs Liberal debates.

Score whether a story headline is worth debating.

SHOULD DEBATE if the story involves:
- Genuine policy disagreement between left and right
- Economic decisions with ideological implications
- Social or cultural contested topics
- Government actions or legislation
- International affairs with domestic policy angles
- Legal decisions with political implications
- Local government decisions (school boards, zoning, city budgets)

SHOULD NOT DEBATE if the story is:
- Pure entertainment or celebrity news
- Sports scores or results
- Natural disasters with no policy angle
- Product launches or business earnings
- Crime reports without policy dimension
- Weather events
- Too thin or vague to produce substantive arguments

Return ONLY valid JSON:
{
  "shouldDebate": true or false,
  "reason": "one sentence",
  "confidence": 0.0 to 1.0
}`,
    messages: [{ role: 'user', content: `Should this headline become a debate? "${title}"` }],
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
    return JSON.parse(cleaned)
  } catch {
    return { shouldDebate: false, reason: 'parse error', confidence: 0 }
  }
}

export async function ingestTrendingStories(maxStories = 5): Promise<{
  processed: number
  debated: number
  skipped: number
  duplicates: number
  errors: number
  stories: string[]
}> {
  const stats = {
    processed: 0,
    debated: 0,
    skipped: 0,
    duplicates: 0,
    errors: 0,
    stories: [] as string[],
  }

  console.log('Starting trends ingestion...')

  const [trendsStories, rssStories] = await Promise.all([fetchGoogleTrends(), fetchRSSFeeds()])
  const allStories = [...trendsStories, ...rssStories]
  console.log(`Fetched ${allStories.length} total stories`)

  const shuffled = allStories.sort(() => Math.random() - 0.5)
  let debatedCount = 0

  for (const story of shuffled) {
    if (debatedCount >= maxStories) break
    stats.processed++

    try {
      const dupCheck = await checkDuplicate(story.title)
      if (dupCheck.isDuplicate) {
        stats.duplicates++
        console.log(`Duplicate: ${story.title}`)
        continue
      }

      const score = await scoreStoryForDebate(story.title)
      if (!score.shouldDebate || score.confidence < 0.7) {
        stats.skipped++
        console.log(`Skipped (${score.reason}): ${story.title}`)
        continue
      }

      console.log(`Debating: ${story.title}`)
      const debate = await runDebatePipeline(story.title, story.sourceType)
      await saveDebate(debate)

      const firstC = debate.exchanges?.[0]?.c || debate.conservative?.previewLine
      registerStory(story.title, debate.id, dupCheck.hash, firstC)

      stats.debated++
      debatedCount++
      stats.stories.push(story.title)
      console.log(`Completed: ${story.title} (${debate.qualityScore?.classification})`)

      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (err) {
      stats.errors++
      console.error(`Error processing "${story.title}":`, err)
    }
  }

  console.log('Ingestion complete:', stats)
  return stats
}
