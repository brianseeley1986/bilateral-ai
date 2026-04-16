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
  let scope: string | null = null

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const isNumericId = /^\d+$/.test(params.id)
    const rows = isNumericId
      ? await sql`SELECT data, geographic_scope FROM debates WHERE id = ${params.id} LIMIT 1`
      : await sql`SELECT data, geographic_scope FROM debates WHERE slug = ${params.id} LIMIT 1`
    const debate: any = rows[0]?.data
    if (debate) {
      headline = debate.headline || headline
      scope = rows[0]?.geographic_scope || debate.geographicScope || null
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

  const scopeLabel = scope
    ? scope === 'local'
      ? 'LOCAL'
      : scope === 'state'
        ? 'STATE'
        : scope === 'international'
          ? 'WORLD'
          : 'NATIONAL'
    : null

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
        <div
          style={{
            flex: 1,
            background: CONSERVATIVE,
            display: 'flex',
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
            CONSERVATIVE
          </span>
        </div>

        {/* Blue half */}
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

        {/* Headline panel overlaid across the split */}
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

        {/* Bottom wordmark + optional scope */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
          }}
        >
          <span
            style={{
              fontFamily: 'Fraunces',
              fontSize: 34,
              fontWeight: 700,
              color: PAPER,
              letterSpacing: '-0.03em',
            }}
          >
            bilateral
          </span>
          {scopeLabel && (
            <>
              <span style={{ fontSize: 22, color: 'rgba(245,245,240,0.55)' }}>·</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(245,245,240,0.75)',
                  letterSpacing: '0.22em',
                }}
              >
                {scopeLabel}
              </span>
            </>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Fraunces', data: frauncesMedium, weight: 500, style: 'normal' },
        { name: 'Fraunces', data: frauncesBold, weight: 700, style: 'normal' },
      ],
    },
  )
}
