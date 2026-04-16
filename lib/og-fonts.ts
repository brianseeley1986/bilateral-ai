/**
 * Font loader for @vercel/og ImageResponse.
 * Fetches Fraunces from Google Fonts CDN at edge.
 * Follows the vercel/og documented pattern (no UA, match truetype format).
 */

type FontStyle = 'normal' | 'italic'

async function fetchFont(family: string, weight: number, style: FontStyle): Promise<ArrayBuffer | null> {
  try {
    const axis = style === 'italic' ? `ital,wght@1,${weight}` : `wght@${weight}`
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:${axis}`
    const css = await fetch(cssUrl).then((r) => r.text())
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)
    if (!match) return null
    const res = await fetch(match[1])
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

type CacheKey = `${string}-${number}-${FontStyle}`
const cache = new Map<CacheKey, Promise<ArrayBuffer | null>>()

function cached(family: string, weight: number, style: FontStyle): Promise<ArrayBuffer | null> {
  const key: CacheKey = `${family}-${weight}-${style}`
  let hit = cache.get(key)
  if (!hit) {
    hit = fetchFont(family, weight, style)
    cache.set(key, hit)
  }
  return hit
}

export async function loadFraunces(weight: 400 | 500 | 600 | 700 = 500, italic = false): Promise<ArrayBuffer | null> {
  return cached('Fraunces', weight, italic ? 'italic' : 'normal')
}
