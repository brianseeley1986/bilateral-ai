import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Bilateral Debate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bilater-ai.vercel.app'
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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0A0A0A',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#C1121F',
            }}
          />
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#F5F5F0',
              letterSpacing: '-0.02em',
            }}
          >
            bilateral
          </div>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#1B4FBE',
            }}
          />
        </div>

        <div
          style={{
            fontSize: '48px',
            fontWeight: 600,
            color: '#F5F5F0',
            lineHeight: 1.2,
            marginBottom: '48px',
            letterSpacing: '-0.02em',
          }}
        >
          {headline}
        </div>

        {cLine && (
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#C1121F' }}>C</div>
            <div style={{ fontSize: '22px', color: '#d4d4d4', lineHeight: 1.4 }}>{cLine}</div>
          </div>
        )}

        {lLine && (
          <div
            style={{
              display: 'flex',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#1B4FBE' }}>L</div>
            <div style={{ fontSize: '22px', color: '#d4d4d4', lineHeight: 1.4 }}>{lLine}</div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '80px',
            fontSize: '20px',
            color: '#4a4a4a',
          }}
        >
          bilateral.news
        </div>
      </div>
    ),
    { ...size }
  )
}
