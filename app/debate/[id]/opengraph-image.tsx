import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Bilateral Debate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 3) + '...' : text
}

export default async function Image({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bilateral.news'
  let headline = 'Read the full debate'
  let cLine = ''
  let lLine = ''

  try {
    const res = await fetch(`${baseUrl}/api/debate?id=${params.id}`)
    if (res.ok) {
      const debate = await res.json()
      headline = debate.headline || headline
      cLine = debate.conservative?.previewLine || ''
      lLine = debate.liberal?.previewLine || ''
    }
  } catch {}

  const displayHeadline = headline.length > 80 ? headline.slice(0, 77) + '...' : headline
  const headlineFontSize =
    displayHeadline.length > 80 ? 26 : displayHeadline.length > 60 ? 32 : 38

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#6B6B6B',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          bilateral.news
        </div>

        <div
          style={{
            fontSize: `${headlineFontSize}px`,
            fontWeight: 700,
            color: '#F5F5F0',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            maxWidth: '900px',
          }}
        >
          {displayHeadline}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cLine && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#C1121F',
                  background: '#3a0a0a',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  marginTop: '2px',
                }}
              >
                C
              </div>
              <div style={{ fontSize: '15px', color: '#9B9B9B', lineHeight: 1.5 }}>
                {truncate(cLine, 100)}
              </div>
            </div>
          )}
          {lLine && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#1B4FBE',
                  background: '#0a1a3a',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  marginTop: '2px',
                }}
              >
                L
              </div>
              <div style={{ fontSize: '15px', color: '#9B9B9B', lineHeight: 1.5 }}>
                {truncate(lLine, 100)}
              </div>
            </div>
          )}
          <div style={{ fontSize: '13px', color: '#444', marginTop: '8px' }}>
            The argument behind every headline.
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
