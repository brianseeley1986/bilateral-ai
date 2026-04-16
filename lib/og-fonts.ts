/**
 * Font loader for @vercel/og ImageResponse.
 * Fetches Fraunces woff2 from Google Fonts CDN.
 * Called from edge routes; result should be cached per instance.
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

async function fetchFontFromGoogle(family: string, weight: number, italic: boolean): Promise<ArrayBuffer> {
  const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`
  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:${axis}&display=swap`
  const css = await fetch(cssUrl, { headers: { 'User-Agent': UA } }).then((r) => r.text())
  const match = css.match(/src: url\((https:\/\/[^)]+)\) format\('woff2'\)/)
  if (!match) throw new Error(`Could not locate ${family} woff2 in Google Fonts CSS`)
  return fetch(match[1]).then((r) => r.arrayBuffer())
}

type FontKey = `${string}-${number}-${'n' | 'i'}`
const cache = new Map<FontKey, Promise<ArrayBuffer>>()

export function loadFraunces(weight: 400 | 500 | 600 | 700 = 500, italic = false): Promise<ArrayBuffer> {
  const key: FontKey = `Fraunces-${weight}-${italic ? 'i' : 'n'}`
  let existing = cache.get(key)
  if (!existing) {
    existing = fetchFontFromGoogle('Fraunces', weight, italic)
    cache.set(key, existing)
  }
  return existing
}
