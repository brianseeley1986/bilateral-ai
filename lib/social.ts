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

// Upload an image buffer to X via the v1.1 media/upload endpoint.
async function uploadMediaToX(imageBuffer: Buffer): Promise<string | null> {
  try {
    const base64 = imageBuffer.toString('base64')
    const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json'

    const params: Record<string, string> = {
      media_data: base64,
    }

    const authHeader = generateOAuthHeader('POST', uploadUrl, {})

    const formBody = new URLSearchParams(params)
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('X media upload error:', data)
      return null
    }

    return data.media_id_string || null
  } catch (err) {
    console.error('X media upload failed:', err)
    return null
  }
}

// Generate a panel image via our internal API route.
async function generatePanelImage(
  side: 'conservative' | 'liberal',
  headline: string,
  hook: string
): Promise<Buffer | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bilateral.news'
  const params = new URLSearchParams({ side, headline, hook })
  const url = `${baseUrl}/api/x-panel?${params}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`Panel image generation failed (${side}):`, res.status)
      return null
    }
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.error(`Panel image fetch failed (${side}):`, err)
    return null
  }
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

  // Pick the best hook for each side
  const conHook = debate.conservative?.previewLine || debate.conservativeFeedHook || ''
  const libHook = debate.liberal?.previewLine || debate.liberalFeedHook || ''

  if (mockMode) {
    const tweetText = `${debate.headline}\n\n${debateUrl}`
    console.log('MOCK X POST:\n', tweetText, '\nImages: [conservative panel, liberal panel]')
    return { success: true, tweetText, mock: true }
  }

  // Generate both panel images in parallel
  const [conImage, libImage] = await Promise.all([
    generatePanelImage('conservative', debate.headline, conHook),
    generatePanelImage('liberal', debate.headline, libHook),
  ])

  // Upload images to X
  const mediaIds: string[] = []
  if (libImage) {
    const libMediaId = await uploadMediaToX(libImage)
    if (libMediaId) mediaIds.push(libMediaId)
  }
  if (conImage) {
    const conMediaId = await uploadMediaToX(conImage)
    if (conMediaId) mediaIds.push(conMediaId)
  }

  if (mediaIds.length === 0) {
    console.warn('No panel images uploaded — falling back to URL-only post')
  }

  // Post tweet with images + headline + URL
  const tweetText = `${debate.headline}\n\n${debateUrl}`

  try {
    const url = 'https://api.twitter.com/2/tweets'
    const body: Record<string, unknown> = { text: tweetText }
    if (mediaIds.length > 0) {
      body.media = { media_ids: mediaIds }
    }
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

    console.log('Posted to X with', mediaIds.length, 'images:', data.data?.id, tweetText)
    return { success: true, tweetId: data.data?.id, tweetText }
  } catch (err) {
    console.error('X post failed:', err)
    return { success: false, error: String(err) }
  }
}
