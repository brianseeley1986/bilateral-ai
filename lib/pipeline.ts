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

async function runAgent(systemPrompt: string, userMessage: string, maxTokens = 4096): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
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

function classificationToStatus(classification: string): PublishStatus {
  if (classification === 'PUBLISH') return 'published'
  if (classification === 'REVIEW') return 'review'
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

  const raw = await runAgent(QUALITY_SCORER_PROMPT, qualityInput, 1500)
  return parseJSON(raw) as QualityScore
}

export async function runAdvertising(debate: Partial<DebateOutput>): Promise<CampaignPackage | undefined> {
  try {
    const raw = await runAgent(
      ADVERTISING_AGENT_PROMPT,
      `FULL DEBATE:\n${JSON.stringify(debate, null, 2)}`
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
  sourceType: 'user_submitted' | 'trending' | 'rss' = 'user_submitted',
): Promise<DebateOutput> {
  const id = Date.now().toString()
  const createdAt = new Date().toISOString()

  // 1. Classifier
  const classification = parseJSON(
    await runAgent(CLASSIFIER_PROMPT, `Headline: ${headline}`, 512)
  )
  const track = classification.track as Track
  const geographicScope = classification.geographicScope as GeoScope
  const suggestedHook = classification.suggestedHook as string

  // 2. Researcher
  const research = parseJSON(
    await runAgent(
      RESEARCHER_PROMPT,
      `Headline: ${headline}\n\nBuild the full verified briefing.`
    )
  )

  // ---- SATIRE PATH ----
  if (track === 'satire') {
    const satire = parseJSON(
      await runAgent(
        SATIRE_PROMPT,
        `HEADLINE: ${headline}\n\nRESEARCHER BRIEFING:\n${JSON.stringify(research, null, 2)}`
      )
    )

    const partial = {
      id,
      headline,
      createdAt,
      track,
      geographicScope,
      suggestedHook,
      sourceType,
      context: research.context,
      timeline: research.timeline || [],
      satireExchanges: satire.exchanges,
      satireCloser: satire.closer,
    }

    return {
      ...partial,
      sources: research.sources || [],
      publishStatus: 'published',
    }
  }

  // ---- SERIOUS / LOCAL PATH ----
  const briefing = `RESEARCHER BRIEFING:\n${JSON.stringify(research, null, 2)}\n\nHEADLINE: ${headline}`

  const [conservativeRaw, liberalRaw] = await Promise.all([
    runAgent(CONSERVATIVE_PROMPT, briefing),
    runAgent(LIBERAL_PROMPT, briefing),
  ])
  const conservative = parseJSON(conservativeRaw)
  const liberal = parseJSON(liberalRaw)

  const rebuttal = parseJSON(
    await runAgent(
      REBUTTAL_PROMPT,
      `CONSERVATIVE POSITION:\n${JSON.stringify(conservative, null, 2)}\n\nLIBERAL POSITION:\n${JSON.stringify(liberal, null, 2)}`
    )
  )

  const verdict = parseJSON(
    await runAgent(
      ARBITER_PROMPT,
      `RESEARCHER BRIEFING:\n${JSON.stringify(research, null, 2)}\n\nCONSERVATIVE:\n${JSON.stringify(conservative, null, 2)}\n\nLIBERAL:\n${JSON.stringify(liberal, null, 2)}\n\nREBUTTALS:\n${JSON.stringify(rebuttal, null, 2)}`
    )
  )

  // Quality scorer + line-by-line run in parallel (both depend on arbiter output)
  const qualityInput = `HEADLINE: ${headline}

CONTEXT:
${JSON.stringify(research.context, null, 2)}

CONSERVATIVE POSITION:
${JSON.stringify(conservative, null, 2)}

LIBERAL POSITION:
${JSON.stringify(liberal, null, 2)}

REBUTTAL:
${JSON.stringify(rebuttal, null, 2)}

VERDICT:
${JSON.stringify(verdict, null, 2)}`

  const lblInput = `HEADLINE: ${headline}\n\nCONSERVATIVE:\n${JSON.stringify(conservative, null, 2)}\n\nLIBERAL:\n${JSON.stringify(liberal, null, 2)}\n\nREBUTTALS:\n${JSON.stringify(rebuttal, null, 2)}`

  const [lblRaw, qualityRaw] = await Promise.all([
    runAgent(LINE_BY_LINE_PROMPT, lblInput),
    runAgent(QUALITY_SCORER_PROMPT, qualityInput, 1500),
  ])

  const lbl = parseJSON(lblRaw)
  const qualityScore = parseJSON(qualityRaw) as QualityScore
  const publishStatus = classificationToStatus(qualityScore.classification)

  const partial = {
    id,
    headline,
    createdAt,
    track,
    geographicScope,
    suggestedHook,
    context: research.context,
    timeline: research.timeline || [],
    conservative,
    liberal,
    rebuttal,
    verdict,
    exchanges: lbl.exchanges,
  }

  return {
    ...partial,
    sources: research.sources || [],
    qualityScore,
    publishStatus,
  }
}
