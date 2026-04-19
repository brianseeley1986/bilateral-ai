import { ImageResponse } from 'next/og'
import { neon } from '@neondatabase/serverless'
import { loadFraunces } from '@/lib/og-fonts'

export const runtime = 'edge'
export const alt = 'Bilateral Debate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function smartTrim(text: string, max: number): string {
  const clean = text.trim()
  if (clean.length <= max) return clean
  const SENTINEL = '\uE000'
  const safe = clean.replace(/(\d)\.(\d)/g, `$1${SENTINEL}$2`)
  const restore = (s: string) => s.replace(new RegExp(SENTINEL, 'g'), '.')
  const sentences = safe.match(/[^.!?]+[.!?]+/g) || []
  let built = ''
  for (const s of sentences) {
    const next = built + s
    if (next.length > max) break
    built = next
  }
  if (built.length >= 40) return restore(built).trim()
  const cut = safe.slice(0, max)
  const clause = Math.max(cut.lastIndexOf(';'), cut.lastIndexOf(' — '), cut.lastIndexOf(', '))
  if (clause > 60) return restore(safe.slice(0, clause)).trim() + '…'
  const space = cut.lastIndexOf(' ')
  return restore(space > 0 ? cut.slice(0, space) : cut).trim() + '…'
}

function pickLine(hook: string | undefined, fallback: string | undefined, max = 100): string {
  const source = (hook && hook.trim()) || (fallback && fallback.trim()) || ''
  return smartTrim(source, max)
}

export default async function Image({ params }: { params: { id: string } }) {
  let headline = 'The argument behind every headline.'
  let shortHeadline: string | undefined
  let hook = ''
  let cLine = ''
  let lLine = ''

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const isNumericId = /^\d+$/.test(params.id)
    const rows = isNumericId
      ? await sql`SELECT data FROM debates WHERE id = ${params.id} LIMIT 1`
      : await sql`SELECT data FROM debates WHERE slug = ${params.id} LIMIT 1`
    const debate: any = rows[0]?.data
    if (debate) {
      headline = debate.headline || headline
      shortHeadline = debate.shortHeadline || undefined
      hook = smartTrim(debate.suggestedHook || debate.context?.whatHappened || '', 160)
      const cFallback =
        debate.conservative?.previewLine ||
        debate.exchanges?.[0]?.c ||
        debate.conservative?.argument ||
        ''
      const lFallback =
        debate.liberal?.previewLine ||
        debate.exchanges?.[0]?.l ||
        debate.liberal?.argument ||
        ''
      cLine = pickLine(debate.conservativeFeedHook, cFallback)
      lLine = pickLine(debate.liberalFeedHook, lFallback)
    }
  } catch (err) {
    console.error('OG image DB query failed for', params.id, err)
  }

  const displayHeadline = shortHeadline || (headline.length > 90 ? headline.slice(0, 87) + '…' : headline)
  const headlineSize = displayHeadline.length > 70 ? 52 : displayHeadline.length > 45 ? 60 : 72

  const [frauncesMedium, frauncesBold] = await Promise.all([
    loadFraunces(500, false),
    loadFraunces(700, false),
  ])

  const fonts = [
    frauncesMedium && { name: 'Fraunces', data: frauncesMedium, weight: 500 as const, style: 'normal' as const },
    frauncesBold && { name: 'Fraunces', data: frauncesBold, weight: 700 as const, style: 'normal' as const },
  ].filter(Boolean) as Array<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }>

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#F5F5F0',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Fraunces, Georgia, serif',
        }}
      >
        {/* Top bar: wordmark left, CTA right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 44px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#C1121F' }} />
            <span
              style={{
                fontFamily: 'Fraunces',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '-0.035em',
                color: '#0A0A0A',
              }}
            >
              bilateral
            </span>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#1B4FBE' }} />
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#6B6B6B',
              letterSpacing: '0.02em',
            }}
          >
            Read the full debate →
          </span>
        </div>

        {/* Headline + hook */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '20px 44px 0',
          }}
        >
          <div
            style={{
              fontFamily: 'Fraunces',
              fontSize: headlineSize,
              fontWeight: 500,
              color: '#0A0A0A',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              maxWidth: 1100,
              marginBottom: hook ? 14 : 0,
            }}
          >
            {displayHeadline}
          </div>
          {hook && (
            <div
              style={{
                fontSize: 22,
                color: '#6B6B6B',
                lineHeight: 1.4,
                fontStyle: 'italic',
                maxWidth: 1000,
              }}
            >
              {hook}
            </div>
          )}
        </div>

        {/* Spacer — pushes cards toward the middle, not the very bottom */}
        <div style={{ flex: '1' }} />

        {/* C/L blocks — positioned mid-lower with generous bottom margin */}
        {(cLine || lLine) && (
          <div style={{ display: 'flex', gap: 12, padding: '0 44px 80px' }}>
            <div
              style={{
                flex: 1,
                background: '#C1121F',
                borderRadius: 12,
                padding: '16px 24px 18px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.8)',
                  letterSpacing: '0.16em',
                  marginBottom: 6,
                }}
              >
                CONSERVATIVE
              </span>
              <div style={{ fontSize: 19, color: '#FFFFFF', lineHeight: 1.35, fontWeight: 500 }}>
                {cLine}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: '#1B4FBE',
                borderRadius: 12,
                padding: '16px 24px 18px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.8)',
                  letterSpacing: '0.16em',
                  marginBottom: 6,
                }}
              >
                LIBERAL
              </span>
              <div style={{ fontSize: 19, color: '#FFFFFF', lineHeight: 1.35, fontWeight: 500 }}>
                {lLine}
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
