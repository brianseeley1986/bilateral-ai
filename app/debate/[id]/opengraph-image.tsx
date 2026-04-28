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


export default async function Image({ params }: { params: { id: string } }) {
  let headline = 'The debate behind every headline.'
  let shortHeadline: string | undefined
  let context = ''

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
      context = smartTrim(debate.suggestedHook || debate.context?.whatHappened || '', 120)
    }
  } catch (err) {
    console.error('OG image DB query failed for', params.id, err)
  }

  const displayHeadline = shortHeadline || (headline.length > 80 ? headline.slice(0, 77) + '…' : headline)
  const headlineSize = displayHeadline.length > 60 ? 40 : displayHeadline.length > 40 ? 46 : 52

  const [frauncesMedium, frauncesBold] = await Promise.all([
    loadFraunces(500, false),
    loadFraunces(700, false),
  ])

  const fonts = [
    frauncesMedium && { name: 'Fraunces', data: frauncesMedium, weight: 500 as const, style: 'normal' as const },
    frauncesBold && { name: 'Fraunces', data: frauncesBold, weight: 700 as const, style: 'normal' as const },
  ].filter(Boolean) as Array<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }>

  const BLUE = '#1B4FBE'
  const RED = '#C1121F'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A0A0A',
          display: 'flex',
          position: 'relative',
          fontFamily: 'Fraunces, Georgia, serif',
          overflow: 'hidden',
        }}
      >
        {/* Blue glow — left edge */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 300,
            display: 'flex',
            background: 'linear-gradient(to right, rgba(27,79,190,0.25), rgba(27,79,190,0.06) 60%, transparent)',
          }}
        />

        {/* Red glow — right edge */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 300,
            display: 'flex',
            background: 'linear-gradient(to left, rgba(193,18,31,0.25), rgba(193,18,31,0.06) 60%, transparent)',
          }}
        />

        {/* Left side label */}
        <div
          style={{
            position: 'absolute',
            left: 32,
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20, color: BLUE, opacity: 0.7, display: 'flex' }}>←</span>
          <div
            style={{
              display: 'flex',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: BLUE,
              opacity: 0.7,
              transform: 'rotate(-90deg)',
              whiteSpace: 'nowrap',
            }}
          >
            LIBERAL
          </div>
        </div>

        {/* Right side label */}
        <div
          style={{
            position: 'absolute',
            right: 32,
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: RED,
              opacity: 0.7,
              transform: 'rotate(90deg)',
              whiteSpace: 'nowrap',
            }}
          >
            CONSERVATIVE
          </div>
          <span style={{ fontSize: 20, color: RED, opacity: 0.7, display: 'flex' }}>→</span>
        </div>

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '40px 120px',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: RED, display: 'flex' }} />
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: '#F5F5F0' }}>
              bilateral
            </span>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: BLUE, display: 'flex' }} />
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: headlineSize,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              textAlign: 'center',
              maxWidth: 800,
              marginBottom: context ? 16 : 24,
              display: 'flex',
            }}
          >
            {displayHeadline}
          </div>

          {/* Context line */}
          {context && (
            <div
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.5,
                textAlign: 'center',
                maxWidth: 600,
                marginBottom: 24,
                display: 'flex',
              }}
            >
              {context}
            </div>
          )}

          {/* Swipe instruction */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.08em',
              display: 'flex',
            }}
          >
            SWIPE TO SEE BOTH SIDES
          </div>
        </div>

        {/* Tab bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            borderTop: '1px solid #2A2A2A',
            background: '#141414',
            height: 44,
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'rgba(27,79,190,0.4)',
            }}
          >
            LIBERAL
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              borderBottom: '2px solid #FFFFFF',
            }}
          >
            NEUTRAL
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'rgba(193,18,31,0.4)',
            }}
          >
            CONSERVATIVE
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
