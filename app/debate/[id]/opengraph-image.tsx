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

  // Collect complete sentences up to the cap.
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || []
  let built = ''
  for (const s of sentences) {
    const next = built + s
    if (next.length > max) break
    built = next
  }
  if (built.length >= 40) return built.trim()

  // No complete sentence fits — fall back to a clause break.
  const cut = clean.slice(0, max)
  const clause = Math.max(cut.lastIndexOf(';'), cut.lastIndexOf(' — '), cut.lastIndexOf(', '))
  if (clause > 60) return clean.slice(0, clause).trim() + '…'

  // Last resort: word boundary.
  const space = cut.lastIndexOf(' ')
  return (space > 0 ? cut.slice(0, space) : cut).trim() + '…'
}

function pickLine(hook: string | undefined, fallback: string | undefined, max = 240): string {
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

  const displayHeadline = headline.length > 120 ? headline.slice(0, 117) + '…' : headline
  const headlineSize = displayHeadline.length > 90 ? 44 : displayHeadline.length > 60 ? 52 : 60

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
        {/* Top row — brand centered, CTA on the right (safe from X's bottom overlay) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '28px 48px 16px',
          }}
        >
          <div style={{ width: '200px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#C1121F' }} />
              <span
                style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#F5F5F0',
                }}
              >
                bilateral
              </span>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#1B4FBE' }} />
            </div>
            <div
              style={{
                marginTop: '10px',
                fontSize: '22px',
                fontWeight: 500,
                color: '#D4D4CA',
                letterSpacing: '0.01em',
              }}
            >
              The argument behind every headline.
            </div>
          </div>
          <div
            style={{
              width: '200px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingTop: '12px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#F5F5F0',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Read →
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 80px',
            flex: cLine && lLine ? '0 0 auto' : 1,
            marginBottom: cLine && lLine ? '32px' : 0,
          }}
        >
          <div
            style={{
              fontSize: `${headlineSize}px`,
              fontWeight: 700,
              color: '#F5F5F0',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              textAlign: 'center',
              maxWidth: '1040px',
            }}
          >
            {displayHeadline}
          </div>
        </div>

        {/* Split C/L panel */}
        {(cLine || lLine) && (
          <div
            style={{
              display: 'flex',
              flex: 1,
              borderTop: '1px solid #1f1f1f',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '28px 40px 20px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(193,18,31,0.18) 0%, rgba(193,18,31,0.05) 100%)',
                borderRight: '1px solid #1f1f1f',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#C1121F' }} />
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#F5F5F0',
                    letterSpacing: '0.14em',
                  }}
                >
                  CONSERVATIVE
                </span>
              </div>
              <div style={{ fontSize: '24px', color: '#F5F5F0', lineHeight: 1.4, fontWeight: 500 }}>
                {cLine}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '28px 40px 20px',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(27,79,190,0.18) 0%, rgba(27,79,190,0.05) 100%)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#1B4FBE' }} />
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#F5F5F0',
                    letterSpacing: '0.14em',
                  }}
                >
                  LIBERAL
                </span>
              </div>
              <div style={{ fontSize: '24px', color: '#F5F5F0', lineHeight: 1.4, fontWeight: 500 }}>
                {lLine}
              </div>
            </div>
          </div>
        )}

        {/* CTA footer — right-aligned so X's bottom-left title overlay doesn't cover it */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '20px 48px 28px',
            background: '#0A0A0A',
            fontSize: '22px',
            fontWeight: 500,
            color: '#F5F5F0',
            letterSpacing: '0.02em',
          }}
        >
          Read the full debate  →
        </div>
      </div>
    ),
    { ...size },
  )
}
