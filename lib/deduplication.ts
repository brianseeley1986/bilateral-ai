import crypto from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { neon } from '@neondatabase/serverless'

async function hasRecentDebateInDB(
  headline: string
): Promise<{ found: boolean; id?: string }> {
  const sql = neon(process.env.DATABASE_URL!)
  const normalizedHeadline = headline.toLowerCase().trim()

  // Exact-ish headline match in last 48 hours
  const rows = await sql`
    SELECT id, headline FROM debates
    WHERE created_at > NOW() - INTERVAL '48 hours'
    AND LOWER(TRIM(headline)) = ${normalizedHeadline}
    LIMIT 1
  `
  if (rows.length > 0) {
    return { found: true, id: rows[0].id }
  }

  // Similarity match using pg_trgm
  try {
    const similar = await sql`
      SELECT id, headline FROM debates
      WHERE created_at > NOW() - INTERVAL '48 hours'
      AND similarity(LOWER(headline), ${normalizedHeadline}) > 0.6
      ORDER BY similarity(LOWER(headline), ${normalizedHeadline}) DESC
      LIMIT 1
    `
    if (similar.length > 0) {
      return { found: true, id: similar[0].id }
    }
  } catch {
    // pg_trgm not enabled yet; fall through
  }

  return { found: false }
}

async function getRecentHeadlines(): Promise<string[]> {
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    SELECT headline FROM debates
    WHERE created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
    LIMIT 30
  `
  return rows.map((r) => r.headline as string)
}

interface StoryRecord {
  hash: string
  headline: string
  normalizedText: string
  firstSeenAt: string
  debateId: string
  firstExchangeC?: string
}

const g = globalThis as unknown as { __bilateralStoryIndex?: Map<string, StoryRecord> }
const storyIndex: Map<string, StoryRecord> =
  g.__bilateralStoryIndex ?? (g.__bilateralStoryIndex = new Map())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function generateHash(normalized: string): string {
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}

function extractKeyTerms(normalized: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
    'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are',
    'was', 'were', 'has', 'have', 'had', 'will', 'would',
    'could', 'should', 'may', 'might', 'be', 'been', 'being',
    'that', 'this', 'it', 'its', 'as', 'up', 'out', 'about',
  ])
  return normalized.split(' ').filter((word) => word.length > 3 && !stopWords.has(word))
}

function calculateSimilarity(termsA: string[], termsB: string[]): number {
  const setA = new Set(termsA)
  const setB = new Set(termsB)
  const intersection = termsA.filter((term) => setB.has(term)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

function robustJSONParse(raw: string): any {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1))
  }
  return JSON.parse(cleaned)
}

async function checkSemanticSimilarity(
  newHeadline: string,
  existingRecords: Array<{ headline: string; context?: string }>
): Promise<{
  isDuplicate: boolean
  matchedHeadline?: string
  confidence: number
  reasoning?: string
}> {
  if (existingRecords.length === 0) {
    return { isDuplicate: false, confidence: 0 }
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You are a news story deduplication agent. Your only job is to determine if a new headline covers the same story as any headline in a provided list.

Same story means: same event, same subject, same core news — even if worded completely differently.
"Fed holds rates" and "Federal Reserve keeps rates unchanged" are the same story.
"Fed holds rates" and "Fed cuts rates" are different stories.

You will receive headlines and optionally the first debate exchange line for additional context.

Return ONLY valid JSON:
{
  "isDuplicate": true or false,
  "matchedHeadline": "the matching headline verbatim from the list, or null",
  "confidence": 0.0 to 1.0,
  "reasoning": "one sentence"
}

No preamble. No markdown. Only JSON.`,
    messages: [
      {
        role: 'user',
        content: `New headline: "${newHeadline}"

Existing stories from last 24 hours:
${existingRecords.map((r, i) => `${i + 1}. "${r.headline}"${r.context ? `\n   Context: ${r.context}` : ''}`).join('\n')}`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    return { isDuplicate: false, confidence: 0 }
  }

  try {
    const result = robustJSONParse(content.text)
    return {
      isDuplicate: !!result.isDuplicate && result.confidence >= 0.80,
      matchedHeadline: result.matchedHeadline || undefined,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0,
      reasoning: result.reasoning,
    }
  } catch (e) {
    console.error('semantic dedup parse failed', e, content.text)
    return { isDuplicate: false, confidence: 0 }
  }
}

export interface DeduplicationResult {
  isDuplicate: boolean
  reason?: 'db_match' | 'exact_match' | 'jaccard_similarity' | 'semantic_similarity'
  existingDebateId?: string
  similarityScore?: number
  hash: string
}

export async function checkDuplicate(headline: string): Promise<DeduplicationResult> {
  const normalized = normalizeText(headline)
  const hash = generateHash(normalized)
  const WINDOW_HOURS = 24
  const JACCARD_SHORTCIRCUIT = 0.4
  const now = new Date()

  // LAYER 0: DB check — survives across all serverless instances
  try {
    const dbCheck = await hasRecentDebateInDB(headline)
    if (dbCheck.found) {
      return {
        isDuplicate: true,
        reason: 'db_match',
        existingDebateId: dbCheck.id,
        similarityScore: 1.0,
        hash,
      }
    }
  } catch (e) {
    console.error('DB dedup check failed, falling through:', e)
  }

  // Layer 1: exact hash match (in-memory, same instance)
  if (storyIndex.has(hash)) {
    const existing = storyIndex.get(hash)!
    const hoursAgo =
      (now.getTime() - new Date(existing.firstSeenAt).getTime()) / (1000 * 60 * 60)

    if (hoursAgo < WINDOW_HOURS) {
      return {
        isDuplicate: true,
        reason: 'exact_match',
        existingDebateId: existing.debateId,
        similarityScore: 1.0,
        hash,
      }
    }
  }

  // Layer 2: Jaccard prefilter — shortcircuit on high overlap
  const newTerms = extractKeyTerms(normalized)
  const cutoff = new Date(now.getTime() - WINDOW_HOURS * 60 * 60 * 1000)

  for (const [, record] of storyIndex) {
    const recordTime = new Date(record.firstSeenAt)
    if (recordTime < cutoff) continue

    const existingTerms = extractKeyTerms(record.normalizedText)
    const similarity = calculateSimilarity(newTerms, existingTerms)

    if (similarity >= JACCARD_SHORTCIRCUIT) {
      return {
        isDuplicate: true,
        reason: 'jaccard_similarity',
        existingDebateId: record.debateId,
        similarityScore: similarity,
        hash,
      }
    }
  }

  // Layer 3: semantic check via Claude — cross-instance, pulls headlines from DB
  try {
    const recentFromDB = await getRecentHeadlines()
    if (recentFromDB.length > 0) {
      const recordsWithContext = recentFromDB.map((h) => ({ headline: h }))
      const semantic = await checkSemanticSimilarity(headline, recordsWithContext)

      if (semantic.isDuplicate) {
        return {
          isDuplicate: true,
          reason: 'semantic_similarity',
          existingDebateId: undefined,
          similarityScore: semantic.confidence,
          hash,
        }
      }
    }
  } catch (e) {
    console.error('Semantic dedup check failed:', e)
  }

  return { isDuplicate: false, hash }
}

export function registerStory(headline: string, debateId: string, hash: string, firstExchangeC?: string): void {
  const normalized = normalizeText(headline)
  storyIndex.set(hash, {
    hash,
    headline,
    normalizedText: normalized,
    firstSeenAt: new Date().toISOString(),
    debateId,
    firstExchangeC,
  })
}

export function cleanExpiredRecords(): void {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  for (const [hash, record] of storyIndex) {
    if (new Date(record.firstSeenAt) < cutoff) {
      storyIndex.delete(hash)
    }
  }
}

export function getDeduplicationStats(): object {
  return {
    totalTracked: storyIndex.size,
    oldestRecord:
      [...storyIndex.values()].sort(
        (a, b) => new Date(a.firstSeenAt).getTime() - new Date(b.firstSeenAt).getTime()
      )[0]?.firstSeenAt || null,
  }
}

export function getRecentStories(limit = 10): Array<{
  headline: string
  hash: string
  firstSeenAt: string
}> {
  return [...storyIndex.values()]
    .sort((a, b) => new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime())
    .slice(0, limit)
    .map((r) => ({ headline: r.headline, hash: r.hash, firstSeenAt: r.firstSeenAt }))
}

export function clearStoryIndex(): number {
  const n = storyIndex.size
  storyIndex.clear()
  return n
}

export function compareHeadlines(a: string, b: string): number {
  const termsA = extractKeyTerms(normalizeText(a))
  const termsB = extractKeyTerms(normalizeText(b))
  return calculateSimilarity(termsA, termsB)
}
