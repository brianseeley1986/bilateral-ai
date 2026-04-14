import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Bilateral Debate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function truncate(text: string, max: number) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…'
}

// When a feed hook isn't available, extract the first sentence of the analytical line.
// Produces hook-feeling text without mid-phrase truncation.
function hookify(hook: string | undefined, fallback: string | undefined): string {
  if (hook && hook.trim()) return hook.trim()
  if (!fallback) return ''
  const firstSentence = fallback.match(/^[^.!?]+[.!?]/)?.[0]
  const candidate = (firstSentence || fallback).trim()
  return truncate(candidate, 110)
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
      cLine = hookify(debate.conservativeFeedHook, debate.conservative?.previewLine)
      lLine = hookify(debate.liberalFeedHook, debate.liberal?.previewLine)
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#C1121F' }} />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#F5F5F0',
                    letterSpacing: '0.14em',
                  }}
                >
                  CONSERVATIVE
                </span>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1B4FBE' }} />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#F5F5F0',
                    letterSpacing: '0.14em',
                  }}
                >
                  LIBERAL
                </span>
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
