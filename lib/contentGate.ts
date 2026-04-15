import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const HAIKU = 'claude-haiku-4-5-20251001'

export type GateResult =
  | { allow: true }
  | { allow: false; reason: string; userMessage: string }

// Hard blocks — categories that aren't unlocked by mainstream coverage.
// Kept narrow on purpose; broad rules over-reject. Each entry checks for
// the WORST framing of the category, not any mention of related topics.
const HARD_BLOCK_PATTERNS: Array<{ test: RegExp; reason: string; userMessage: string }> = [
  {
    test: /(holocaust|sandy hook|parkland|uvalde|columbine|las vegas shooting)\s*(was|is|were)?\s*(a\s*)?(hoax|fake|staged|didn'?t happen|never happened|crisis actor)/i,
    reason: 'mass-tragedy denial',
    userMessage: "Bilateral doesn't debate denial of documented mass tragedies.",
  },
  {
    test: /(white|jewish|black|muslim|christian)\s*(genocide|replacement|conspiracy)\s*(plot|theory|agenda)?/i,
    reason: 'ethnic/religious replacement framing',
    userMessage: "Bilateral doesn't debate ethnic or religious replacement claims.",
  },
  {
    test: /\b(secretly|actually)\s+(a\s+)?(man|woman|trans|transgender|male|female)\b/i,
    reason: 'unfounded personal identity claim about a named individual',
    userMessage: "Bilateral doesn't debate unsourced claims about a person's body or identity.",
  },
  {
    test: /\b(adrenochrome|qanon|pizzagate|pedophile ring|child trafficking ring)\b.*\b(elite|democrat|liberal|hollywood|globalist|cabal)/i,
    reason: 'mass-pedophilia conspiracy framing',
    userMessage: "Bilateral doesn't debate mass-pedophilia conspiracy framings.",
  },
]

function hardBlock(headline: string): GateResult | null {
  for (const rule of HARD_BLOCK_PATTERNS) {
    if (rule.test.test(headline)) {
      return { allow: false, reason: rule.reason, userMessage: rule.userMessage }
    }
  }
  return null
}

// Asks a fast model with web search whether the headline is being covered by
// established outlets. Established = AP, Reuters, NYT, WaPo, WSJ, BBC, NPR,
// Politico, The Hill, The Atlantic, etc. Includes debunkings — coverage is
// coverage. Widely-believed historical conspiracies (moon landing, JFK,
// MK-Ultra) pass because they have decades of mainstream reporting.
async function mainstreamCheck(headline: string): Promise<GateResult> {
  try {
    const res = await client.messages.create({
      model: HAIKU,
      max_tokens: 400,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }] as any,
      system:
        'You evaluate whether a news topic is currently or historically covered by established mainstream press (AP, Reuters, NYT, WaPo, WSJ, BBC, NPR, Politico, The Hill, The Atlantic, major university or government sources). Debunkings and critical coverage count as coverage. Long-running historical conspiracy topics with decades of mainstream press attention (moon landing skepticism, JFK assassination theories, MK-Ultra, COINTELPRO, lab-leak hypothesis, Epstein network) all qualify. Reject only when the topic appears exclusively in fringe blogs, conspiracy forums, or anonymous social-media posts with zero established-press coverage.\n\nRespond ONLY with JSON: {"covered": true|false, "reason": "<one sentence>"}.',
      messages: [{ role: 'user', content: `Headline: ${headline}` }],
    })
    const text = res.content
      .map((c: any) => (c.type === 'text' ? c.text : ''))
      .join('')
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { allow: true } // fail open — don't block on parse error
    const parsed = JSON.parse(match[0]) as { covered: boolean; reason: string }
    if (parsed.covered) return { allow: true }
    return {
      allow: false,
      reason: `no mainstream coverage: ${parsed.reason}`,
      userMessage:
        "We couldn't find established reporting on this story. Bilateral debates topics that are in the news cycle or have a documented history. Try a current headline.",
    }
  } catch {
    // Fail open on infrastructure errors — don't block real users because the model 500'd.
    return { allow: true }
  }
}

export async function runContentGate(headline: string): Promise<GateResult> {
  const blocked = hardBlock(headline)
  if (blocked) return blocked
  return await mainstreamCheck(headline)
}
