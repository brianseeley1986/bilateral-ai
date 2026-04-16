import { checkDuplicate, registerStory } from './deduplication'
import { runDebatePipeline } from './pipeline'
import { saveDebate } from './store'

const TRENDS_RSS_URL =
  'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US'

const RSS_FEEDS = [
  { url: 'https://feeds.reuters.com/reuters/topNews', name: 'Reuters Top News', scope: 'national' },
  { url: 'https://feeds.reuters.com/Reuters/worldNews', name: 'Reuters World News', scope: 'international' },
  // Politics-focused feeds. The scorer filters out any non-debate-worthy noise.
  { url: 'https://feeds.npr.org/1014/rss.xml',                        name: 'NPR Politics',    scope: 'national' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', name: 'NYT Politics',    scope: 'national' },
  { url: 'https://www.politico.com/rss/politics08.xml',               name: 'Politico',        scope: 'national' },
  { url: 'https://thehill.com/homenews/feed/',                        name: 'The Hill',        scope: 'national' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',               name: 'BBC World',       scope: 'international' },
  { url: 'https://feeds.bbci.co.uk/news/politics/rss.xml',            name: 'BBC UK Politics', scope: 'international' },
  { url: 'https://www.theguardian.com/world/rss',                     name: 'Guardian World',  scope: 'international' },
]

function buildGoogleNewsLocalUrl(city: string, state: string): string {
  // Policy-focused query — Google News sorts by recency so we target
  // governance/policy content directly instead of crawling past entertainment and crime stories
  const terms = '("city council" OR "school board" OR "county commission" OR mayor OR ordinance OR zoning OR "property tax" OR policy OR ruling OR lawsuit)'
  const q = encodeURIComponent(`${city} ${state} ${terms}`)
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`
}

interface TrendingStory {
  title: string
  source: string
  scope: string
  sourceType: 'trending' | 'rss'
  city?: string
  state?: string
}

export async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
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

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
}

function extractTextContent(xml: string, tag: string): string {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]+)\\]\\]></${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = xml.match(pattern)
    if (match?.[1]) return decodeHtmlEntities(match[1].trim())
  }
  return ''
}

export function parseRSSItems(xml: string): string[] {
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
        for (const title of parseRSSItems(xml).slice(0, 15)) {
          stories.push({ title, source: feed.name, scope: feed.scope, sourceType: 'rss' })
        }
      } catch (err) {
        console.error(`RSS fetch failed for ${feed.name}:`, err)
      }
    })
  )
  return stories
}

const FLORIDA_METRO_FALLBACKS: Record<string, string> = {
  'haines city': 'lakeland',
  'winter haven': 'lakeland',
  'auburndale': 'lakeland',
  'bartow': 'lakeland',
  'plant city': 'tampa',
  'brandon': 'tampa',
  'clearwater': 'tampa',
  'st pete': 'tampa',
  'kissimmee': 'orlando',
  'sanford': 'orlando',
  'deltona': 'orlando',
  'daytona beach': 'orlando',
  'cape coral': 'fort-myers',
  'fort myers': 'fort-myers',
  'naples': 'fort-myers',
  'boca raton': 'miami',
  'fort lauderdale': 'miami',
  'pompano beach': 'miami',
  'hollywood': 'miami',
  'hialeah': 'miami',
  'pensacola': 'tallahassee',
  'gainesville': 'tallahassee',
  'tallahassee': 'tallahassee',
}

async function tryGoogleNewsRSS(url: string): Promise<string[]> {
  try {
    console.log(`[local] trying: ${url}`)
    const response = await fetchWithTimeout(url, 10000)
    if (!response.ok) return []
    const xml = await response.text()
    const titles = parseRSSItems(xml)
    if (titles.length > 0) console.log(`[local] hit: ${titles.length} stories`)
    return titles
  } catch {
    return []
  }
}

function makeStories(
  titles: string[],
  source: string,
  max: number,
  city?: string,
  state?: string
): TrendingStory[] {
  return titles.slice(0, max).map((title) => ({
    title,
    source,
    scope: 'local',
    sourceType: 'rss' as const,
    city,
    state,
  }))
}

export interface LocalFetchResult {
  stories: TrendingStory[]
  resolvedLevel: 'city' | 'county' | 'metro' | 'state' | 'none'
  resolvedLocation: string
}

export async function fetchLocalStoriesForLocation(
  zip?: string,
  city?: string,
  state?: string,
  county?: string,
  maxStories = 5
): Promise<LocalFetchResult> {
  const none: LocalFetchResult = { stories: [], resolvedLevel: 'none', resolvedLocation: '' }
  if (!state) return none

  const cityLower = (city || '').toLowerCase()

  // Level 1: Exact city
  if (city && state) {
    console.log(`[local] L1 city: ${city}, ${state}`)
    const titles = await tryGoogleNewsRSS(buildGoogleNewsLocalUrl(city, state))
    if (titles.length > 0) {
      return { stories: makeStories(titles, `${city} Local`, maxStories, city, state), resolvedLevel: 'city', resolvedLocation: city }
    }
  }

  // Level 2: County
  if (county && state) {
    console.log(`[local] L2 county: ${county}, ${state}`)
    const titles = await tryGoogleNewsRSS(buildGoogleNewsLocalUrl(`${county} County`, state))
    if (titles.length > 0) {
      return { stories: makeStories(titles, `${county} County Local`, maxStories, city, state), resolvedLevel: 'county', resolvedLocation: `${county} County` }
    }
  }

  // Level 3: Metro fallback (Florida only for now)
  if (state.toLowerCase() === 'florida' && cityLower) {
    const metro = FLORIDA_METRO_FALLBACKS[cityLower]
    if (metro) {
      console.log(`[local] L3 metro: ${cityLower} → ${metro}`)
      const titles = await tryGoogleNewsRSS(buildGoogleNewsLocalUrl(metro, state))
      if (titles.length > 0) {
        return { stories: makeStories(titles, `${metro} Local`, maxStories, city, state), resolvedLevel: 'metro', resolvedLocation: metro }
      }
    }
  }

  // Level 4: State-level
  if (state) {
    console.log(`[local] L4 state: ${state}`)
    const titles = await tryGoogleNewsRSS(buildGoogleNewsLocalUrl('', state))
    if (titles.length > 0) {
      return { stories: makeStories(titles, `${state} News`, maxStories, city, state), resolvedLevel: 'state', resolvedLocation: state }
    }
  }

  // Level 5: None
  console.log(`[local] L5 none — no coverage for ${city || ''}, ${state}`)
  return none
}

const AUTO_DEBATE_SIGNALS = [
  'supreme court',
  'rules against', 'rules for', 'ruled that', 'court holds', 'court decides', 'court rules',
  'dissent', 'unconstitutional', 'strikes down', 'overturns', 'overruled',
  'signed into law', 'executive order',
  'congress passes', 'senate votes', 'senate passes', 'house passes', 'house votes',
  'fed raises', 'fed cuts', 'fed holds', 'interest rates',
  'ceasefire', 'invasion', 'peace talks', 'declared war', 'sanctions', 'impeachment',
  '8-1', '7-2', '6-3', '5-4', '9-0',
  'landmark ruling', 'historic ruling', 'first time in',
  'appeals court', 'circuit court', 'district court rules',
  'injunction', 'blocked by', 'upholds',
  'school board votes', 'city council votes', 'city council approves',
  'zoning', 'ballot measure', 'referendum', 'recall',
  'mayor signs', 'governor signs', 'governor vetoes',
  'legislature passes', 'state senate', 'state house passes',
]

export async function scoreStoryForDebate(
  title: string
): Promise<{ shouldDebate: boolean; reason: string; confidence: number }> {
  const titleLower = title.toLowerCase()
  const hasAutoSignal = AUTO_DEBATE_SIGNALS.some((signal) => titleLower.includes(signal))

  if (hasAutoSignal) {
    console.log('[scorer] auto-debate signal:', title)
    return {
      shouldDebate: true,
      reason: 'auto-debate: high-signal story (government/court/policy action)',
      confidence: 0.95,
    }
  }

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

SHOULD NOT DEBATE — only these narrow categories:
- Pure celebrity or entertainment news with zero policy dimension
- Sports scores and game results
- Natural disasters with no policy angle
- Individual crime reports with no broader policy dimension
- Product launches and earnings with no regulatory dimension
- Weather events
- Obituaries
- Human interest stories with no ideological stakes

NEVER filter out:
- Court rulings even if the headline is phrased as a plain fact
- Government decisions and votes even if phrased declaratively
- Policy changes even if no opinion language appears in the headline
- Anything involving legislative, executive, or judicial action
- Local government decisions (city council, school board, zoning)

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
  const processedThisRun = new Set<string>()

  for (const story of shuffled) {
    if (debatedCount >= maxStories) break
    stats.processed++

    try {
      const key = story.title.toLowerCase().trim()
      if (processedThisRun.has(key)) {
        stats.duplicates++
        console.log(`Session dedup hit: ${story.title}`)
        continue
      }
      processedThisRun.add(key)

      const dupCheck = await checkDuplicate(story.title)
      if (dupCheck.isDuplicate) {
        stats.duplicates++
        console.log(`Duplicate: ${story.title}`)
        continue
      }

      const score = await scoreStoryForDebate(story.title)
      if (!score.shouldDebate || score.confidence < 0.7) {
        stats.skipped++
        console.log(`Skipped (${score.reason}, conf=${score.confidence}): ${story.title}`)
        continue
      }

      console.log(`Debating: ${story.title}`)
      const debate = await runDebatePipeline(story.title, story.sourceType, story.city, story.state)
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
