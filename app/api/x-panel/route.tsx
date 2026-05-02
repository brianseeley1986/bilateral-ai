import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { loadFraunces } from '@/lib/og-fonts'

export const runtime = 'edge'

const SIZE = { width: 800, height: 800 }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const side = searchParams.get('side') as 'conservative' | 'liberal' | null
  const headline = searchParams.get('headline') || ''
  const hook = searchParams.get('hook') || ''

  if (!side || !headline) {
    return NextResponse.json({ error: 'side and headline required' }, { status: 400 })
  }

  const isConservative = side === 'conservative'
  const color = isConservative ? '#C1121F' : '#1B4FBE'
  const glowColor = isConservative
    ? 'rgba(193,18,31,0.15)'
    : 'rgba(27,79,190,0.15)'
  const label = isConservative ? 'CONSERVATIVE' : 'LIBERAL'

  const [frauncesMedium, frauncesBold] = await Promise.all([
    loadFraunces(500, false),
    loadFraunces(700, false),
  ])

  const fonts = [
    frauncesMedium && { name: 'Fraunces', data: frauncesMedium, weight: 500 as const, style: 'normal' as const },
    frauncesBold && { name: 'Fraunces', data: frauncesBold, weight: 700 as const, style: 'normal' as const },
  ].filter(Boolean) as Array<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }>

  const hookSize = hook.length > 120 ? 28 : hook.length > 80 ? 32 : 36

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: 'Fraunces, Georgia, serif',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: `radial-gradient(ellipse at 50% 50%, ${glowColor} 0%, transparent 70%)`,
          }}
        />

        {/* Accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: color,
            display: 'flex',
          }}
        />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C1121F', display: 'flex' }} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.4)' }}>
            bilateral
          </span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B4FBE', display: 'flex' }} />
        </div>

        {/* Side label */}
        <div
          style={{
            display: 'flex',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: color,
            background: `${color}22`,
            padding: '6px 20px',
            borderRadius: 999,
            marginBottom: 28,
          }}
        >
          {label}
        </div>

        {/* Hook text */}
        <div
          style={{
            fontSize: hookSize,
            fontWeight: 600,
            color: '#FFFFFF',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            maxWidth: 620,
            marginBottom: 32,
            display: 'flex',
          }}
        >
          {hook}
        </div>

        {/* Headline as context */}
        <div
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.35)',
            lineHeight: 1.4,
            textAlign: 'center',
            maxWidth: 500,
            display: 'flex',
          }}
        >
          {headline.length > 90 ? headline.slice(0, 87) + '…' : headline}
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: color,
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      ...SIZE,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
