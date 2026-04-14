import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Bilateral Debate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

export default async function Image({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bilateral.news'
  let headline = 'The argument behind every headline.'
  let cLine = ''
  let lLine = ''

  try {
    const res = await fetch(`${baseUrl}/api/debate?id=${params.id}`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const debate = await res.json()
      headline = debate.headline || headline
      // Prefer feed hooks — they're written to be tight and punchy.
      // Fall back to previewLine only if no hook exists.
      cLine = debate.conservativeFeedHook || debate.conservative?.previewLine || ''
      lLine = debate.liberalFeedHook || debate.liberal?.previewLine || ''
    }
  } catch {}

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
        {/* Brand bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            padding: '36px 60px 24px',
          }}
        >
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
                padding: '28px 40px',
                background: 'linear-gradient(180deg, rgba(193,18,31,0.18) 0%, rgba(193,18,31,0.05) 100%)',
                borderRight: '1px solid #1f1f1f',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#C1121F',
                  letterSpacing: '0.12em',
                  marginBottom: '12px',
                }}
              >
                CONSERVATIVE
              </div>
              <div style={{ fontSize: '22px', color: '#F5F5F0', lineHeight: 1.35, fontWeight: 500 }}>
                {truncate(cLine, 95)}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '28px 40px',
                background: 'linear-gradient(180deg, rgba(27,79,190,0.18) 0%, rgba(27,79,190,0.05) 100%)',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#1B4FBE',
                  letterSpacing: '0.12em',
                  marginBottom: '12px',
                }}
              >
                LIBERAL
              </div>
              <div style={{ fontSize: '22px', color: '#F5F5F0', lineHeight: 1.35, fontWeight: 500 }}>
                {truncate(lLine, 95)}
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    { ...size },
  )
}
