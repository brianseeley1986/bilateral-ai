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
  // ?og= bumps whenever the OG card design changes. X caches the scraped OG per
  // exact URL, so a new query param forces a fresh scrape. Bump this on any
  // opengraph-image.tsx change that should be reflected in already-posted-style tweets.
  const debateUrl = `${baseUrl}/debate/${debate.slug || debate.id}?og=12`

  // Tweet text = just the URL. The OG card renders headline + C/L + brand,
  // so any additional text creates duplication when Twitter unfurls it.
  const tweetText = debateUrl

  if (mockMode) {
    console.log('MOCK X POST:\n', tweetText)
    return { success: true, tweetText, mock: true }
  }

  try {
    const url = 'https://api.twitter.com/2/tweets'
    const body = { text: tweetText }
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
