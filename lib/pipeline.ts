import Anthropic from '@anthropic-ai/sdk'
import {
  CLASSIFIER_PROMPT,
  RESEARCHER_PROMPT,
  CONSERVATIVE_PROMPT,
  LIBERAL_PROMPT,
  REBUTTAL_PROMPT,
  ARBITER_PROMPT,
  LINE_BY_LINE_PROMPT,
  SATIRE_PROMPT,
  ADVERTISING_AGENT_PROMPT,
  QUALITY_SCORER_PROMPT,
  FEED_HOOKS_PROMPT,
  SHORT_HEADLINE_PROMPT,
  DIVIDE_CARD_PROMPT,
} from './agents'
import type {
  DebateOutput,
  Track,
  GeoScope,
  CampaignPackage,
  QualityScore,
  PublishStatus,
} from '@/types/debate'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SONNET = 'claude-sonnet-4-6'
const HAIKU = 'claude-haiku-4-5-20251001'

async function runAgent(
  systemPrompt: string,
  userMessage: string,
  model: string = SONNET,
  maxTokens: number = 4096
): Promise<string> {
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}

async function searchViaExa(headline: string): Promise<string | null> {
  const key = process.env.EXA_API_KEY
  if (!key) return null
  try {
    const { default: Exa } = await import('exa-js')
    const exa = new Exa(key)
    const result = await exa.searchAndContents(headline, {
      numResults: 6,
      type: 'auto',
      text: { maxCharacters: 20000 } as any,
      useAutoprompt: true,
      startPublishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // last 60 days
    } as any)
    const blocks = (result.results || []).map((r: any) => {
      const title = r.title || ''
      const url = r.url || ''
      const published = r.publishedDate || ''
      const text = (r.text || '').slice(0, 4000)
      return `[${title}] (${url}) — ${published}\n${text}`
    })
    if (blocks.length === 0) return null
    return blocks.join('\n\n---\n\n')
  } catch (e) {
    console.error('Exa search failed, falling back:', e)
    return null
  }
}

async function searchViaHaikuTool(headline: string): Promise<string> {
  try {
    const response = await client.messages.create({
      model: HAIKU,
      max_tokens: 2500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
      system: `You are a research assistant. Search the web for the most recent and relevant information about this news story or topic. Find:
1. What actually happened — specific facts, names, dates, locations, quotes
2. Who the key people and organizations are
3. What the actual dispute or decision is
4. Any recent developments in the last 30 days
5. Local context if this is a local story

Return a factual summary of what you found. If this is a local story, prioritize local news sources. If search returns nothing relevant, say so clearly.`,
      messages: [{ role: 'user', content: `Search for current information about: "${headline}"` }],
    })

    const textContent = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => (b.type === 'text' ? b.text : ''))
      .join('\n')

    // Extract real URLs from web_search_tool_result blocks
    const citations: Array<{ url: string; title: string }> = []
    for (const block of response.content as any[]) {
      if (block.type === 'web_search_tool_result') {
        const results = Array.isArray(block.content) ? block.content : []
        for (const r of results) {
          if (r?.url) citations.push({ url: r.url, title: r.title || r.url })
        }
      }
    }
    const dedupedCitations = citations.filter(
      (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i
    )

    const sourcesBlock = dedupedCitations.length > 0
      ? '\n\nSOURCES (real URLs — pass these through verbatim in your briefing):\n' +
        dedupedCitations.map((c) => `- ${c.title} :: ${c.url}`).join('\n')
      : ''

    return (textContent || 'No additional web search results found.') + sourcesBlock
  } catch (err) {
    console.error('Haiku web_search failed:', err)
    return 'Web search unavailable — proceeding with background knowledge only.'
  }
}

async function searchForStory(headline: string): Promise<string> {
  // Exa disabled for A/B test — force Haiku web_search path
  void searchViaExa
  return searchViaHaikuTool(headline)
}

function parseJSON(raw: string): any {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1))
  }
  return JSON.parse(cleaned)
}

function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    return parseJSON(raw) as T
  } catch {
    return fallback
  }
}

function scoreToStatus(score: number): PublishStatus {
  if (score >= 7.5) return 'published'
  if (score >= 6.0) return 'review'
  return 'held'
}

export async function scoreDebate(input: {
  conservative?: any
  liberal?: any
  rebuttal?: any
  verdict?: any
  context?: any
  headline?: string
}): Promise<QualityScore> {
  const qualityInput = `HEADLINE: ${input.headline || '(synthetic test)'}

CONTEXT:
${JSON.stringify(input.context ?? {}, null, 2)}

CONSERVATIVE POSITION:
${JSON.stringify(input.conservative ?? {}, null, 2)}

LIBERAL POSITION:
${JSON.stringify(input.liberal ?? {}, null, 2)}

REBUTTAL:
${JSON.stringify(input.rebuttal ?? {}, null, 2)}

VERDICT:
${JSON.stringify(input.verdict ?? {}, null, 2)}`

  const raw = await runAgent(QUALITY_SCORER_PROMPT, qualityInput, HAIKU, 1500)
  return parseJSON(raw) as QualityScore
}

export async function runAdvertising(debate: Partial<DebateOutput>): Promise<CampaignPackage | undefined> {
  try {
    const raw = await runAgent(
      ADVERTISING_AGENT_PROMPT,
      `FULL DEBATE:\n${JSON.stringify(debate, null, 2)}`,
      SONNET
    )
    const parsed = parseJSON(raw)
    return {
      hook: parsed.hook || '',
      posts: {
        xA: parsed.posts?.xA || '',
        xB: parsed.posts?.xB || '',
        xThread: parsed.posts?.xThread || [],
        linkedin: parsed.posts?.linkedin || '',
        facebook: parsed.posts?.facebook || '',
        reddit: parsed.posts?.reddit || '',
        instagram: parsed.posts?.instagram || '',
      },
      targeting: {
        subreddits: parsed.targeting?.subreddits || [],
        xAccountTypes: parsed.targeting?.xAccountTypes || [],
        facebookGroups: parsed.targeting?.facebookGroups || [],
        localFocus: parsed.targeting?.localFocus ?? null,
      },
      influencerNote: parsed.influencerNote || '',
      timing: parsed.timing || 'midday',
      abVariants: {
        hookA: parsed.abVariants?.hookA || '',
        hookB: parsed.abVariants?.hookB || '',
      },
      hashtags: parsed.hashtags || [],
      status: 'pending',
      autoPost: false,
    }
  } catch (e) {
    console.error('advertising agent failed', e)
    return undefined
  }
}

export async function runDebatePipeline(
  headline: string,
  sourceType: 'user_submitted' | 'trending' | 'rss' | 'library' = 'user_submitted',
  city?: string,
  state?: string,
  opts?: { id?: string; createdAt?: string; onPartial?: (partial: any) => Promise<void> }
): Promise<DebateOutput> {
  const id = opts?.id || Date.now().toString()
  const createdAt = opts?.createdAt || new Date().toISOString()
  const emit = async (partial: any) => {
    if (!opts?.onPartial) return
    try { await opts.onPartial(partial) } catch (e) { console.error('onPartial failed:', e) }
  }

  // 1+2. Classifier + web search in parallel (independent)
  console.log(`[pipeline] classifier+search in parallel: ${headline}`)
  const [classificationRaw, searchResults] = await Promise.all([
    runAgent(CLASSIFIER_PROMPT, `Headline: ${headline}`, HAIKU, 512),
    searchForStory(headline),
  ])
  const classification = safeParseJSON<any>(classificationRaw, { track: 'serious', geographicScope: 'national', suggestedHook: '' })
  classification.track = (classification.track?.toLowerCase() || 'serious')
  classification.geographicScope = (classification.geographicScope?.toLowerCase() || 'national')
  if (classification.track === 'satire') classification.track = 'serious'
  const track = classification.track as Track
  const geographicScope = classification.geographicScope as GeoScope
  const suggestedHook = classification.suggestedHook as string
  console.log(`[pipeline] search returned ${searchResults.length} chars`)

  // 3. Researcher (SONNET — quality matters, grounds the whole debate)
  const researcherRaw = await runAgent(
    RESEARCHER_PROMPT,
    `Headline: ${headline}

WEB SEARCH RESULTS (use these as primary source material — this is what is actually happening right now):
${searchResults}

Build the full verified briefing based on these search results. If the search results contain specific facts, names, quotes, and events use them. Do not invent details not found in the search results.`,
    SONNET,
    8000
  )
  let research: any
  try {
    research = parseJSON(researcherRaw)
  } catch (e) {
    console.error('Researcher JSON parse failed — falling back to minimal briefing:', e)
    research = {
      context: { whatHappened: headline, whyItMatters: '', keyFacts: [] },
      timeline: [],
      conservativePositions: { dominantArgument: '', keyPoints: [], notableVoices: [] },
      liberalPositions: { dominantArgument: '', keyPoints: [], notableVoices: [] },
      faultLines: { valuesInConflict: '', unansweredQuestion: '' },
      disputedClaims: [],
      sources: [],
    }
  }

  // Stage 1: researcher done — emit context/timeline
  await emit({
    id, headline, createdAt, track, geographicScope, suggestedHook,
    sourceType, city, state,
    context: research.context,
    timeline: research.timeline || [],
    sources: research.sources || [],
  })

  // ---- SATIRE PATH ----
  if (track === 'satire') {
    const satire = parseJSON(
      await runAgent(
        SATIRE_PROMPT,
        `HEADLINE: ${headline}\n\nRESEARCHER BRIEFING:\n${JSON.stringify(research, null, 2)}`,
        SONNET
      )
    )

    return {
      id,
      headline,
      createdAt,
      track,
      geographicScope,
      suggestedHook,
      sourceType,
      city,
      state,
      context: research.context,
      timeline: research.timeline || [],
      satireExchanges: satire.exchanges,
      satireCloser: satire.closer,
      sources: research.sources || [],
      publishStatus: 'published',
    }
  }

  // ---- SERIOUS / LOCAL PATH ----
  const cPositions = research.conservativePositions
  const lPositions = research.liberalPositions
  const faultLines = research.faultLines

  const baseBriefing = `RESEARCHER BRIEFING:\n${JSON.stringify(research, null, 2)}\n\nHEADLINE: ${headline}`

  const conservativeBriefing = `${baseBriefing}

REAL CONSERVATIVE POSITIONS ON THIS STORY:
Dominant argument: ${cPositions?.dominantArgument || '(not found)'}

Key points conservatives are making:
${(cPositions?.keyPoints as string[] | undefined)?.map((p: string) => `- ${p}`).join('\n') || '(none found)'}

Notable conservative voices:
${(cPositions?.notableVoices as Array<{ speaker?: string; quote?: string }> | undefined)?.map((v) => `${v.speaker || ''}: "${v.quote || ''}"`).join('\n') || '(none found)'}

INSTRUCTION: Argue this position — the politically real one that actual conservatives are taking right now. Argue with full conviction and intellectual depth. Then name your weakest point honestly.`

  const liberalBriefing = `${baseBriefing}

REAL LIBERAL POSITIONS ON THIS STORY:
Dominant argument: ${lPositions?.dominantArgument || '(not found)'}

Key points liberals are making:
${(lPositions?.keyPoints as string[] | undefined)?.map((p: string) => `- ${p}`).join('\n') || '(none found)'}

Notable liberal voices:
${(lPositions?.notableVoices as Array<{ speaker?: string; quote?: string }> | undefined)?.map((v) => `${v.speaker || ''}: "${v.quote || ''}"`).join('\n') || '(none found)'}

INSTRUCTION: Argue this position — the politically real one that actual liberals and Democrats are taking right now. Argue with full conviction and intellectual depth. Then name your weakest point honestly.`

  // 4. Conservative + Liberal (SONNET — core debate quality)
  const [conservativeRaw, liberalRaw] = await Promise.all([
    runAgent(CONSERVATIVE_PROMPT, conservativeBriefing, SONNET),
    runAgent(LIBERAL_PROMPT, liberalBriefing, SONNET),
  ])
  const conservative = safeParseJSON<any>(conservativeRaw, { argument: '', keyEvidence: [], weakestPoint: '', previewLine: '' })
  const liberal = safeParseJSON<any>(liberalRaw, { argument: '', keyEvidence: [], weakestPoint: '', previewLine: '' })

  // Stage 2: conservative + liberal positions done
  await emit({
    id, headline, createdAt, track, geographicScope, suggestedHook,
    sourceType, city, state,
    context: research.context,
    timeline: research.timeline || [],
    conservative,
    liberal,
    sources: research.sources || [],
  })

  const leadingSide: 'conservative' | 'liberal' = Math.random() > 0.5 ? 'conservative' : 'liberal'

  // 5. Kick off rebuttal/arbiter/quality chain AND lbl/hooks/faction in parallel.
  // lbl, hooks, and faction don't depend on rebuttal or arbiter — no reason to wait.
  const rebuttalArbiterQualityChain = (async () => {
    const rebuttalRaw = await runAgent(
      REBUTTAL_PROMPT,
      `CONSERVATIVE POSITION:\n${JSON.stringify(conservative, null, 2)}\n\nLIBERAL POSITION:\n${JSON.stringify(liberal, null, 2)}`,
      HAIKU
    )
    const rebuttal = safeParseJSON<any>(rebuttalRaw, { conservative: '', liberal: '' })

    const verdictRaw = await runAgent(
      ARBITER_PROMPT,
      `RESEARCHER BRIEFING:\n${JSON.stringify(research, null, 2)}\n\nCONSERVATIVE:\n${JSON.stringify(conservative, null, 2)}\n\nLIBERAL:\n${JSON.stringify(liberal, null, 2)}\n\nREBUTTALS:\n${JSON.stringify(rebuttal, null, 2)}`,
      HAIKU
    )
    const verdict = safeParseJSON<any>(verdictRaw, { agreements: [], conflicts: [], openQuestions: [] })
    const qualityInput = `HEADLINE: ${headline}\n\nCONTEXT:\n${JSON.stringify(research.context, null, 2)}\n\nCONSERVATIVE POSITION:\n${JSON.stringify(conservative, null, 2)}\n\nLIBERAL POSITION:\n${JSON.stringify(liberal, null, 2)}\n\nREBUTTAL:\n${JSON.stringify(rebuttal, null, 2)}\n\nVERDICT:\n${JSON.stringify(verdict, null, 2)}`
    const qualityRaw = await runAgent(QUALITY_SCORER_PROMPT, qualityInput, HAIKU, 1500)
    return { rebuttal, verdict, qualityRaw }
  })()

  const lblInput = `LEADING_SIDE: ${leadingSide}\n\nHEADLINE: ${headline}\n\nCONSERVATIVE:\n${JSON.stringify(conservative, null, 2)}\n\nLIBERAL:\n${JSON.stringify(liberal, null, 2)}\n\nFAULT LINES:\n${faultLines?.valuesInConflict ? `- ${faultLines.valuesInConflict}` : '(none)'}\nUnanswered question: ${faultLines?.unansweredQuestion || '(none)'}`

  const hooksInput = `Conservative position:\n${conservative.argument}\n\nLiberal position:\n${liberal.argument}`

  const [lblResult, hooksResult, shortHeadlineResult, chainResult] = await Promise.allSettled([
    runAgent(LINE_BY_LINE_PROMPT, lblInput, SONNET),
    runAgent(FEED_HOOKS_PROMPT, hooksInput, HAIKU, 400),
    headline.length > 60
      ? runAgent(SHORT_HEADLINE_PROMPT, headline, HAIKU, 100)
      : Promise.resolve(headline),
    rebuttalArbiterQualityChain,
  ])

  const chain = chainResult.status === 'fulfilled' ? chainResult.value : null
  const rebuttal = chain?.rebuttal
  const verdict = chain?.verdict
  const qualityResult = { status: chainResult.status, value: chain?.qualityRaw } as
    | { status: 'fulfilled'; value: string | undefined }
    | { status: 'rejected'; value: undefined }

  const lbl: any = lblResult.status === 'fulfilled'
    ? safeParseJSON<any>(lblResult.value, {})
    : {}

  const qualityFallback: QualityScore = {
    overallScore: 7.5,
    classification: 'PUBLISH',
    weakestDimension: '',
    scoringNotes: 'quality scorer failed — defaulting to publish',
    scores: { argumentSpecificity: 0, evidenceQuality: 0, genuineTension: 0, intellectualHonesty: 0, depthBeyondHeadlines: 0 },
  }
  const qualityScore: QualityScore = qualityResult.status === 'fulfilled' && qualityResult.value
    ? safeParseJSON<QualityScore>(qualityResult.value, qualityFallback)
    : qualityFallback
  if (qualityScore === qualityFallback) {
    console.warn('Quality scorer failed for debate — defaulting to PUBLISH:', headline)
  }
  const publishStatus = scoreToStatus(qualityScore.overallScore)

  let conservativeFeedHook: string | undefined
  let liberalFeedHook: string | undefined
  if (hooksResult.status === 'fulfilled') {
    const hooks = safeParseJSON<any>(hooksResult.value, {})
    conservativeFeedHook = hooks.conservativeFeedHook || undefined
    liberalFeedHook = hooks.liberalFeedHook || undefined
  }

  const shortHeadline: string | undefined =
    shortHeadlineResult.status === 'fulfilled' && shortHeadlineResult.value
      ? shortHeadlineResult.value.trim().replace(/^["']|["']$/g, '').split('\n')[0].trim()
      : undefined

  // Build factionAlert from researcher's findings (moved from separate agent call)
  const cSplit = cPositions?.factionSplit
  const lSplit = lPositions?.factionSplit
  const cDetected = !!cSplit?.detected
  const lDetected = !!lSplit?.detected
  const factionAlert: any = {
    detected: cDetected || lDetected,
    dividedSide: cDetected && lDetected ? 'both' : cDetected ? 'conservative' : lDetected ? 'liberal' : null,
    summary: null,
    dominantPosition: {
      conservative: cPositions?.dominantArgument || null,
      liberal: lPositions?.dominantArgument || null,
    },
    conservativeFactions: cDetected
      ? { detected: true, faction1: cSplit.faction1, faction2: cSplit.faction2 }
      : { detected: false, faction1: null, faction2: null },
    liberalFactions: lDetected
      ? { detected: true, faction1: lSplit.faction1, faction2: lSplit.faction2 }
      : { detected: false, faction1: null, faction2: null },
  }

  // 7. Divide card — only if faction split detected
  let divideCard: any = null
  if (factionAlert?.detected) {
    try {
      const raw = await runAgent(DIVIDE_CARD_PROMPT, JSON.stringify(factionAlert), HAIKU, 800)
      divideCard = safeParseJSON<any>(raw, null)
    } catch (e) {
      console.error('divide card failed', e)
    }
  }

  return {
    id,
    headline,
    createdAt,
    track,
    geographicScope,
    suggestedHook,
    sourceType,
    city,
    state,
    context: research.context,
    timeline: research.timeline || [],
    conservative,
    liberal,
    rebuttal,
    verdict,
    exchanges: lbl.exchanges,
    leadingSide,
    shortHeadline,
    conservativeFeedHook,
    liberalFeedHook,
    factionAlert,
    divideCard,
    sources: research.sources || [],
    qualityScore,
    publishStatus,
  }
}
