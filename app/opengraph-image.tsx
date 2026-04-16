import { ImageResponse } from 'next/og'
import { loadFraunces } from '@/lib/og-fonts'

export const runtime = 'edge'
export const alt = 'Bilateral — The argument behind every headline.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CONSERVATIVE = '#C1121F'
const LIBERAL = '#1B4FBE'
const PAPER = '#F5F5F0'

export default async function Image() {
  const [frauncesMedium, frauncesBold, frauncesItalic] = await Promise.all([
    loadFraunces(500, false),
    loadFraunces(700, false),
    loadFraunces(500, true),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
        }}
      >
        <div style={{ flex: 1, background: CONSERVATIVE, display: 'flex', padding: '44px 48px' }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.82)',
              letterSpacing: '0.22em',
            }}
          >
            CONSERVATIVE
          </span>
        </div>
        <div
          style={{
            flex: 1,
            background: LIBERAL,
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '44px 48px',
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.82)',
              letterSpacing: '0.22em',
            }}
          >
            LIBERAL
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 80px',
          }}
        >
          <div
            style={{
              fontFamily: 'Fraunces',
              fontSize: 148,
              fontWeight: 700,
              color: PAPER,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              textShadow: '0 2px 24px rgba(0,0,0,0.25)',
            }}
          >
            bilateral
          </div>
          <div
            style={{
              fontFamily: 'Fraunces',
              fontSize: 32,
              fontWeight: 500,
              fontStyle: 'italic',
              color: 'rgba(245,245,240,0.88)',
              marginTop: 18,
              letterSpacing: '0.01em',
              textShadow: '0 1px 12px rgba(0,0,0,0.2)',
            }}
          >
            The argument behind every headline.
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 40,
            display: 'flex',
            justifyContent: 'center',
            fontSize: 16,
            color: 'rgba(245,245,240,0.6)',
            letterSpacing: '0.22em',
            fontWeight: 700,
          }}
        >
          BILATERAL.NEWS
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Fraunces', data: frauncesMedium, weight: 500, style: 'normal' },
        { name: 'Fraunces', data: frauncesBold, weight: 700, style: 'normal' },
        { name: 'Fraunces', data: frauncesItalic, weight: 500, style: 'italic' },
      ],
    },
  )
}
