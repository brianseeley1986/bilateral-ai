import { runDebatePipeline } from './pipeline'
import { saveDebate, hasRecentDebate } from './store'

const TRENDS_URL = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US'
const MAX_PER_TICK = 5

export interface TrendsTickResult {
  fetched: number
  processed: number
  skipped: number
  errors: string[]
}

export async function ingestTrends(): Promise<TrendsTickResult> {
  const res = await fetch(TRENDS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 Bilateral/1.0' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Trends fetch failed: ${res.status}`)
  const xml = await res.text()

  const titleMatches = [
    ...xml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g),
  ]
  const terms = titleMatches
    .map((m) => m[1].trim())
    .filter(Boolean)
    .slice(0, MAX_PER_TICK)

  const result: TrendsTickResult = {
    fetched: terms.length,
    processed: 0,
    skipped: 0,
    errors: [],
  }

  for (const term of terms) {
    if (await hasRecentDebate(term)) {
      result.skipped++
      continue
    }
    try {
      const debate = await runDebatePipeline(term)
      await saveDebate(debate)
      result.processed++
    } catch (e: any) {
      result.errors.push(`${term}: ${e?.message || 'unknown'}`)
    }
  }

  return result
}
