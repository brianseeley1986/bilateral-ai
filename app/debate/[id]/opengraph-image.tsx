import { ImageResponse } from 'next/og'
import { neon } from '@neondatabase/serverless'
import { loadFraunces } from '@/lib/og-fonts'

export const runtime = 'edge'
export const alt = 'Bilateral Debate'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function smartTrim(text: string, max: number): string {
  const clean = text.trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?\s]+$/, '') + '…'
}

// Many news outlets return a generic site-logo image when a story has no
// dedicated photo. Detect the common patterns so we don't ship a logo as
// our "photo" — the no-photo fallback (plain dark banner) is preferable.
function isGenericShareImage(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    lower.includes('site_logo') ||
    lower.includes('site-logo') ||
    lower.includes('default-wide') ||
    lower.includes('facebook-default') ||
    lower.includes('twitter-default') ||
    lower.includes('og-default') ||
    /\/(logo|default-share|share-default)\.(png|jpe?g|svg|webp)/.test(lower)
  )
}

export default async function Image({ params }: { params: { id: string } }) {
  let headline = 'The debate behind every headline.'
  let shortHeadline: string | undefined
  let cQuote = ''
  let lQuote = ''
  let imageUrl: string | null = null
  let imageSource: string | null = null

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const isNumericId = /^\d+$/.test(params.id)
    const rows = isNumericId
      ? await sql`SELECT data FROM debates WHERE id = ${params.id} LIMIT 1`
      : await sql`SELECT data FROM debates WHERE slug = ${params.id} LIMIT 1`
    const debate: any = rows[0]?.data
    if (debate) {
      headline = debate.headline || headline
      shortHeadline = debate.shortHeadline || undefined
      cQuote = (debate.conservative?.previewLine || debate.conservativeFeedHook || '').trim()
      lQuote = (debate.liberal?.previewLine || debate.liberalFeedHook || '').trim()
      imageUrl = debate.imageUrl || null
      imageSource = debate.imageSource || null
    }
  } catch (err) {
    console.error('OG image DB query failed for', params.id, err)
  }

  const headerHeadline =
    shortHeadline || (headline.length > 80 ? headline.slice(0, 77) + '…' : headline)
  const lText = smartTrim(lQuote, 130) || 'See the liberal case'
  const cText = smartTrim(cQuote, 130) || 'See the conservative case'

  // Unified font size based on the LONGER of the two quotes. Taller photo
  // banner needs slightly smaller quotes so 4-5 wrapped lines fit cleanly.
  const maxLen = Math.max(lText.length, cText.length)
  const quoteSize = maxLen > 120 ? 28 : maxLen > 90 ? 34 : maxLen > 60 ? 40 : 46

  const usePhoto = imageUrl && !isGenericShareImage(imageUrl)

  const [frauncesMedium, frauncesBold] = await Promise.all([
    loadFraunces(500, false),
    loadFraunces(700, false),
  ])

  const fonts = [
    frauncesMedium && { name: 'Fraunces', data: frauncesMedium, weight: 500 as const, style: 'normal' as const },
    frauncesBold && { name: 'Fraunces', data: frauncesBold, weight: 700 as const, style: 'normal' as const },
  ].filter(Boolean) as Array<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }>

  const BLUE = '#1B4FBE'
  const RED = '#C1121F'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Fraunces, Georgia, serif',
        }}
      >
        {/* Photo banner with brand + headline overlay */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            height: 260,
            width: '100%',
            background: '#0A0A0A',
            borderBottom: '1px solid #2A2A2A',
            overflow: 'hidden',
          }}
        >
          {usePhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl as string}
              alt=""
              width={1200}
              height={260}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.55)',
              }}
            />
          )}
          {/* Dark gradient overlay so text stays readable on any photo */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'linear-gradient(to bottom, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.4) 50%, rgba(10,10,10,0.85) 100%)',
              display: 'flex',
            }}
          />
          {/* Brand + headline on top */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '22px 40px',
              width: '100%',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: RED, display: 'flex' }} />
              <span style={{ fontSize: 30, fontWeight: 700, color: '#F5F5F0', letterSpacing: '-0.03em' }}>
                bilateral
              </span>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: BLUE, display: 'flex' }} />
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                maxWidth: 1080,
                display: 'flex',
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
              }}
            >
              {headerHeadline}
            </div>
          </div>
          {/* Photo source attribution */}
          {usePhoto && imageSource && (
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                right: 12,
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.05em',
                display: 'flex',
                zIndex: 1,
              }}
            >
              Photo: {imageSource}
            </div>
          )}
        </div>

        {/* Split debate panels */}
        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          {/* Liberal panel */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '22px 48px',
              background: 'linear-gradient(135deg, #1A3478 0%, #0A1430 100%)',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.24em',
                color: '#9DB7E8',
                display: 'flex',
              }}
            >
              LIBERAL
            </div>
            <div
              style={{
                fontSize: quoteSize,
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.18,
                letterSpacing: '-0.015em',
                display: 'flex',
                maxWidth: 504,
              }}
            >
              {lText}
            </div>
            <div style={{ display: 'flex', height: 12 }} />
          </div>

          {/* Conservative panel */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '22px 48px',
              background: 'linear-gradient(135deg, #1A0606 0%, #5A1218 100%)',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.24em',
                color: '#E89DA5',
                alignSelf: 'flex-end',
                display: 'flex',
              }}
            >
              CONSERVATIVE
            </div>
            <div
              style={{
                fontSize: quoteSize,
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.18,
                letterSpacing: '-0.015em',
                alignSelf: 'flex-end',
                textAlign: 'right',
                display: 'flex',
                maxWidth: 504,
              }}
            >
              {cText}
            </div>
            <div style={{ display: 'flex', height: 12 }} />
          </div>

          {/* Center divider */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: 2,
              background: 'rgba(255,255,255,0.18)',
              transform: 'translateX(-1px)',
              display: 'flex',
            }}
          />
        </div>

        {/* CTA strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0A0A0A',
            borderTop: '1px solid #2A2A2A',
            height: 96,
            gap: 28,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#FFFFFF',
              display: 'flex',
            }}
          >
            {`WHO'S RIGHT?`}
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.65)',
              display: 'flex',
            }}
          >
            Read the full debate →
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
