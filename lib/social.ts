import crypto from 'crypto'

function generateOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string>
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: process.env.X_API_KEY!,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: process.env.X_ACCESS_TOKEN!,
    oauth_version: '1.0',
  }

  const allParams = { ...params, ...oauthParams }

  const sortedParams = Object.keys(allParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
    .join('&')

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&')

  const signingKey = `${encodeURIComponent(process.env.X_API_SECRET!)}&${encodeURIComponent(process.env.X_ACCESS_TOKEN_SECRET!)}`

  const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64')

  const headerParams: Record<string, string> = { ...oauthParams, oauth_signature: signature }

  return (
    'OAuth ' +
    Object.keys(headerParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(headerParams[key])}"`)
      .join(', ')
  )
}

function trimToFit(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?\s]+$/, '') + '…'
}

// Rotating curiosity-gap hooks. Question-format clickbait drives clicks by
// creating uncertainty the image then resolves. Rotated so the feed doesn't
// look identical every day.
const CURIOSITY_HOOKS = [
  "Who's actually right on this?",
  "Two completely opposite reads of the same story.",
  "Which side has the stronger argument?",
  "One story. Two completely different conclusions.",
  "The strongest case from each side — side by side.",
  "Smart people disagree on this. Here's why.",
]

function pickHook(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return CURIOSITY_HOOKS[Math.abs(hash) % CURIOSITY_HOOKS.length]
}

function buildDebateTweet(headline: string, url: string, seed: string): string {
  // The OG image carries both sides verbatim. The tweet body's job is the
  // curiosity gap: headline for keyword discoverability, hook for the click.
  const urlBudget = 23
  const hook = pickHook(seed)
  // Available chars for the headline line: 280 - hook - "\n\n" - "\n\nSee both sides ↓\n\n" - url
  const cta = '\n\nSee both sides ↓\n\n'
  const headlineGap = '\n\n'
  const overhead = hook.length + headlineGap.length + cta.length + urlBudget
  const headlineMax = Math.max(20, 280 - overhead)
  const headlineLine = trimToFit(headline.trim(), headlineMax)
  return `${headlineLine}${headlineGap}${hook}${cta}${url}`
}

export async function postToX(
  debate: {
    id: string
    slug?: string
    headline: string
    shortHeadline?: string
    conservativeFeedHook?: string
    liberalFeedHook?: string
    conservative?: { previewLine?: string }
    liberal?: { previewLine?: string }
  },
  mockMode: boolean = false
): Promise<{
  success: boolean
  tweetId?: string
  tweetText?: string
  error?: string
  mock?: boolean
}> {
  const baseUrl = 'https://bilateral.news'
  const debateUrl = `${baseUrl}/debate/${debate.slug || debate.id}`

  // Tweet copy now hosts the curiosity hook; the new OG image carries both
  // sides' hooks visually. Prefer shortHeadline (8-12 words, punchy) over
  // the full wire headline.
  const headlineForTweet = debate.shortHeadline?.trim() || debate.headline.trim()
  const tweetText = buildDebateTweet(headlineForTweet, debateUrl, debate.id)

  if (mockMode) {
    console.log('MOCK X POST:\n', tweetText)
    return { success: true, tweetText, mock: true }
  }

  // Warm the OG image before posting. X's crawler scrapes the card
  // immediately after the tweet goes live. If the edge function is cold
  // or mid-deploy the image 500s and X caches the broken card forever.
  const pageUrl = `${baseUrl}/debate/${debate.slug || debate.id}`
  try { await fetch(pageUrl, { method: 'GET' }) } catch {}

  const ogImageUrl = `${baseUrl}/debate/${debate.slug || debate.id}/opengraph-image`
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const warm = await fetch(ogImageUrl, { method: 'GET' })
      if (warm.ok) {
        console.log(`OG image warmed (${warm.status}, attempt ${attempt + 1})`)
        break
      }
      console.warn(`OG image warm attempt ${attempt + 1} returned ${warm.status}`)
    } catch (e) {
      console.warn(`OG image warm attempt ${attempt + 1} failed:`, e)
    }
  }

  try {
    const url = 'https://api.twitter.com/2/tweets'
    const body: Record<string, unknown> = { text: tweetText }
    const authHeader = generateOAuthHeader('POST', url, {})

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('X API error:', data)
      return { success: false, error: JSON.stringify(data) }
    }

    console.log('Posted to X:', data.data?.id, tweetText)
    return { success: true, tweetId: data.data?.id, tweetText }
  } catch (err) {
    console.error('X post failed:', err)
    return { success: false, error: String(err) }
  }
}
