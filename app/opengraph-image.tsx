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

  const fonts = [
    frauncesMedium && { name: 'Fraunces', data: frauncesMedium, weight: 500 as const, style: 'normal' as const },
    frauncesBold && { name: 'Fraunces', data: frauncesBold, weight: 700 as const, style: 'normal' as const },
    frauncesItalic && { name: 'Fraunces', data: frauncesItalic, weight: 500 as const, style: 'italic' as const },
  ].filter(Boolean) as Array<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' | 'italic' }>

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
        <div style={{ flex: 1, background: CONSERVATIVE, display: 'flex' }} />
        <div style={{ flex: 1, background: LIBERAL, display: 'flex' }} />

        {/* Huge wordmark — split bisects "bi" | "lateral" */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Fraunces',
            fontSize: 180,
            fontWeight: 700,
            color: PAPER,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            textShadow: '0 2px 24px rgba(0,0,0,0.22)',
          }}
        >
          <span style={{ display: 'flex' }}>bi</span>
          <span style={{ display: 'flex' }}>lateral</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 80,
            display: 'flex',
            justifyContent: 'center',
            fontFamily: 'Fraunces',
            fontSize: 30,
            fontWeight: 500,
            fontStyle: 'italic',
            color: 'rgba(245,245,240,0.9)',
            letterSpacing: '0.01em',
            textShadow: '0 1px 12px rgba(0,0,0,0.2)',
          }}
        >
          The argument behind every headline.
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 36,
            display: 'flex',
            justifyContent: 'center',
            fontSize: 14,
            color: 'rgba(245,245,240,0.6)',
            letterSpacing: '0.3em',
            fontWeight: 700,
          }}
        >
          BILATERAL.NEWS
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
