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

function pickLine(hook: string | undefined, fallback: string | undefined, max = 120): string {
  const source = (hook && hook.trim()) || (fallback && fallback.trim()) || ''
  return smartTrim(source, max)
}

export default async function Image({ params }: { params: { id: string } }) {
  let headline = 'The argument behind every headline.'
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

  const displayHeadline = headline.length > 110 ? headline.slice(0, 107) + '…' : headline
  const headlineSize = displayHeadline.length > 85 ? 48 : displayHeadline.length > 55 ? 56 : 64

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
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Fraunces, serif',
        }}
      >
        {/* Top bar: wordmark left, CTA right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 44px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#C1121F' }} />
            <span
              style={{
                fontFamily: 'Fraunces',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.035em',
                color: '#F5F5F0',
              }}
            >
              bilateral
            </span>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#1B4FBE' }} />
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#F5F5F0',
              letterSpacing: '0.02em',
            }}
          >
            Read the full debate →
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 56px 16px',
            flex: cLine && lLine ? '0 0 auto' : '1',
          }}
        >
          <div
            style={{
              fontFamily: 'Fraunces',
              fontSize: headlineSize,
              fontWeight: 500,
              color: '#F5F5F0',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              textAlign: 'center',
              maxWidth: 1080,
            }}
          >
            {displayHeadline}
          </div>
        </div>

        {/* C/L split panels */}
        {(cLine || lLine) && (
          <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 44px 70px 44px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(193,18,31,0.35) 0%, rgba(193,18,31,0.10) 100%)',
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#FF6B78',
                  letterSpacing: '0.18em',
                  marginBottom: 10,
                }}
              >
                CONSERVATIVE
              </span>
              <div style={{ fontSize: 26, color: '#F5F5F0', lineHeight: 1.3, fontWeight: 500 }}>
                {cLine}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                background: '#0A0A0A',
                fontSize: 22,
                fontWeight: 900,
                color: '#F5F5F0',
                letterSpacing: '0.05em',
              }}
            >
              VS
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 44px 70px 44px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(27,79,190,0.35) 0%, rgba(27,79,190,0.10) 100%)',
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#6B93FF',
                  letterSpacing: '0.18em',
                  marginBottom: 10,
                }}
              >
                LIBERAL
              </span>
              <div style={{ fontSize: 26, color: '#F5F5F0', lineHeight: 1.3, fontWeight: 500 }}>
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
