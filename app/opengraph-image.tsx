import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Bilateral — The argument behind every headline.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#C1121F',
            }}
          />
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: '#F5F5F0',
              letterSpacing: '-0.03em',
            }}
          >
            bilateral
          </div>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#1B4FBE',
            }}
          />
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#6B6B6B',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          The argument behind every headline.
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
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
