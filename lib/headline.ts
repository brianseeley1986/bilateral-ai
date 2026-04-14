// Strip outlet suffixes like " - Miami Herald" and Editorial/Opinion/Analysis prefixes.
export function cleanHeadline(title: string): string {
  if (!title) return ''
  return title
    .replace(/\s[-–|]\s[A-Z][^-–|]{2,50}$/, '')
    .replace(/^Editorial:\s*/i, '')
    .replace(/^Opinion:\s*/i, '')
    .replace(/^Analysis:\s*/i, '')
    .trim()
}

// Normalize a user-submitted headline: fix capitalization, obvious typos, punctuation.
// Never changes meaning. Returns the raw input on any error.
export async function normalizeUserHeadline(raw: string): Promise<string> {
  const input = raw.trim()
  if (!input) return input
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `You clean up user-submitted news headlines. Fix capitalization (first letter and proper nouns), punctuation, and obvious spelling/grammar errors (e.g., "then" vs "than", "its" vs "it's"). Do NOT change the meaning. Do NOT add or remove information. Do NOT summarize. Do NOT add quotes. If the headline is already clean, return it unchanged. Return ONLY the cleaned headline on a single line, with no preamble, quotes, or commentary.`,
      messages: [{ role: 'user', content: input }],
    })
    const content = response.content[0]
    if (content.type !== 'text') return input
    const cleaned = content.text.trim().replace(/^["']|["']$/g, '').split('\n')[0].trim()
    if (!cleaned || cleaned.length > input.length * 2 + 20 || cleaned.length < 3) return input
    return cleaned
  } catch (e) {
    console.error('normalizeUserHeadline failed, using raw:', e)
    return input
  }
}
