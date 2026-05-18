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

function buildDebateTweet(
  cHook: string,
  lHook: string,
  url: string
): string {
  // X counts every URL as 23 chars regardless of actual length.
  const urlBudget = 23
  const cAttr = '\n— Conservative'
  const lAttr = '\n— Liberal'
  const gap = '\n\n'
  const tail = '\n\n'
  const overhead = cAttr.length + lAttr.length + gap.length + tail.length + urlBudget
  const available = 280 - overhead

  const c = cHook.trim()
  const l = lHook.trim()

  if (!c && !l) return url
  if (!c) return `${trimToFit(l, 280 - urlBudget - tail.length - lAttr.length)}${lAttr}${tail}${url}`
  if (!l) return `${trimToFit(c, 280 - urlBudget - tail.length - cAttr.length)}${cAttr}${tail}${url}`

  // Both sides — attributed quotes stacked with breathing room.
  const total = c.length + l.length
  if (total <= available) {
    return `${c}${cAttr}${gap}${l}${lAttr}${tail}${url}`
  }
  const cMax = Math.max(60, Math.floor(available * (c.length / total)))
  const lMax = available - cMax
  return `${trimToFit(c, cMax)}${cAttr}${gap}${trimToFit(l, lMax)}${lAttr}${tail}${url}`
}

export async function postToX(
  debate: {
    id: string
    slug?: string
    headline: string
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

  // previewLine is constrained to ≤120 chars and written as a scroll-stopping
  // hook — purpose-built for this exact use. feedHook runs 250-350 chars and
  // gets truncated mid-thought, so it's only the fallback.
  const cHook =
    debate.conservative?.previewLine?.trim() ||
    debate.conservativeFeedHook?.trim() ||
    ''
  const lHook =
    debate.liberal?.previewLine?.trim() ||
    debate.liberalFeedHook?.trim() ||
    ''
  const tweetText = buildDebateTweet(cHook, lHook, debateUrl)

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
