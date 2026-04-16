import { ImageResponse } from 'next/og'
import { neon } from '@neondatabase/serverless'
import { loadFraunces } from '@/lib/og-fonts'

// Edge runtime keeps cold starts tight — Twitter's scraper times out on slow OG renders.
// Neon's serverless driver works at the edge, so we query the DB directly.
export const runtime = 'edge'
export const alt = 'Bilateral Debate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CONSERVATIVE = '#C1121F'
const LIBERAL = '#1B4FBE'
const PAPER = '#F5F5F0'

export default async function Image({ params }: { params: { id: string } }) {
  let headline = 'The argument behind every headline.'

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const isNumericId = /^\d+$/.test(params.id)
    const rows = isNumericId
      ? await sql`SELECT data FROM debates WHERE id = ${params.id} LIMIT 1`
      : await sql`SELECT data FROM debates WHERE slug = ${params.id} LIMIT 1`
    const debate: any = rows[0]?.data
    if (debate) {
      headline = debate.headline || headline
    }
  } catch (err) {
    console.error('OG image DB query failed for', params.id, err)
  }

  // Hard wrap display headline so the center of the card never overflows.
  const displayHeadline = headline.length > 140 ? headline.slice(0, 137) + '…' : headline
  const headlineSize = displayHeadline.length > 100 ? 64 : displayHeadline.length > 70 ? 76 : 86

  const [frauncesMedium, frauncesBold] = await Promise.all([
    loadFraunces(500, false),
    loadFraunces(700, false),
  ])

  const fonts = [
    frauncesMedium && { name: 'Fraunces', data: frauncesMedium, weight: 500 as const, style: 'normal' as const },
    frauncesBold && { name: 'Fraunces', data: frauncesBold, weight: 700 as const, style: 'normal' as const },
  ].filter(Boolean) as Array<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }>

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
        {/* Red half */}
        <div style={{ flex: 1, background: CONSERVATIVE, display: 'flex' }} />
        {/* Blue half */}
        <div style={{ flex: 1, background: LIBERAL, display: 'flex' }} />

        {/* Headline overlaid across the split */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 80px 0',
          }}
        >
          <div
            style={{
              fontFamily: 'Fraunces',
              fontSize: headlineSize,
              fontWeight: 500,
              color: PAPER,
              textAlign: 'center',
              lineHeight: 1.08,
              letterSpacing: '-0.025em',
              textShadow: '0 2px 24px rgba(0,0,0,0.22)',
              maxWidth: 1040,
            }}
          >
            {displayHeadline}
          </div>
        </div>

        {/* Bottom wordmark — split bisects "bi" | "lateral" */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 48,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            fontFamily: 'Fraunces',
            fontSize: 56,
            fontWeight: 700,
            color: PAPER,
            letterSpacing: '-0.035em',
            lineHeight: 1,
          }}
        >
          <span style={{ display: 'flex' }}>bi</span>
          <span style={{ display: 'flex' }}>lateral</span>
        </div>

      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
