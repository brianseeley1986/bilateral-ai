import { ImageResponse } from 'next/og'
import { neon } from '@neondatabase/serverless'

// Edge runtime keeps cold starts tight — Twitter's scraper times out on slow OG renders.
// Neon's serverless driver works at the edge, so we query the DB directly.
export const runtime = 'edge'
export const alt = 'Bilateral Debate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Truncate at a sentence, then a clause (semicolon/em dash), then a space.
// Avoids mid-word cuts, and always leaves the panel text feeling complete.
function smartTrim(text: string, max: number): string {
  const clean = text.trim()
  if (clean.length <= max) return clean

  // Temporarily swap decimal points so they aren't mistaken for sentence ends.
  const SENTINEL = '\uE000'
  const safe = clean.replace(/(\d)\.(\d)/g, `$1${SENTINEL}$2`)
  const restore = (s: string) => s.replace(new RegExp(SENTINEL, 'g'), '.')

  // Collect complete sentences up to the cap.
  const sentences = safe.match(/[^.!?]+[.!?]+/g) || []
  let built = ''
  for (const s of sentences) {
    const next = built + s
    if (next.length > max) break
    built = next
  }
  if (built.length >= 40) return restore(built).trim()

  // No complete sentence fits — fall back to a clause break.
  const cut = safe.slice(0, max)
  const clause = Math.max(cut.lastIndexOf(';'), cut.lastIndexOf(' — '), cut.lastIndexOf(', '))
  if (clause > 60) return restore(safe.slice(0, clause)).trim() + '…'

  // Last resort: word boundary.
  const space = cut.lastIndexOf(' ')
  return restore(space > 0 ? cut.slice(0, space) : cut).trim() + '…'
}

function pickLine(hook: string | undefined, fallback: string | undefined, max = 140): string {
  const source = (hook && hook.trim()) || (fallback && fallback.trim()) || ''
  return smartTrim(source, max)
}

export default async function Image({ params }: { params: { id: string } }) {
  let headline = 'The argument behind every headline.'
  let cLine = ''
  let lLine = ''

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`SELECT data FROM debates WHERE id = ${params.id} LIMIT 1`
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
  const headlineSize = displayHeadline.length > 85 ? 58 : displayHeadline.length > 55 ? 68 : 78

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Brand left, CTA right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '22px 48px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#C1121F' }} />
            <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: '#F5F5F0' }}>
              bilateral
            </span>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#1B4FBE' }} />
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#F5F5F0',
              letterSpacing: '0.02em',
            }}
          >
            Read the full debate  →
          </div>
        </div>

        {/* Headline — huge, dominates the card for mobile legibility */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px 60px 14px',
            flex: cLine && lLine ? '0 0 auto' : 1,
          }}
        >
          <div
            style={{
              fontSize: `${headlineSize}px`,
              fontWeight: 800,
              color: '#F5F5F0',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              textAlign: 'center',
              maxWidth: '1080px',
            }}
          >
            {displayHeadline}
          </div>
        </div>

        {/* Split C/L panel with center VS divider */}
        {(cLine || lLine) && (
          <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '22px 50px 80px 48px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(193,18,31,0.35) 0%, rgba(193,18,31,0.08) 100%)',
              }}
            >
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#FF6B78',
                  letterSpacing: '0.18em',
                  marginBottom: '12px',
                }}
              >
                CONSERVATIVE
              </span>
              <div style={{ fontSize: '32px', color: '#F5F5F0', lineHeight: 1.28, fontWeight: 600 }}>
                {cLine}
              </div>
            </div>
            {/* VS divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                background: '#0A0A0A',
                fontSize: '28px',
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
                padding: '22px 48px 80px 50px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(27,79,190,0.35) 0%, rgba(27,79,190,0.08) 100%)',
              }}
            >
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#6B93FF',
                  letterSpacing: '0.18em',
                  marginBottom: '12px',
                }}
              >
                LIBERAL
              </span>
              <div style={{ fontSize: '32px', color: '#F5F5F0', lineHeight: 1.28, fontWeight: 600 }}>
                {lLine}
              </div>
            </div>
          </div>
        )}

      </div>
    ),
    { ...size },
  )
}
