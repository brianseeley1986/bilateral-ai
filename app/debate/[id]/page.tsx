import { getDebate } from '@/lib/store'
import { StoryExchange } from '@/components/StoryExchange'
import { PendingDebateView } from '@/components/PendingDebateView'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params, searchParams }: { params: { id: string }; searchParams: { og?: string } }
): Promise<Metadata> {
  const debate = await getDebate(params.id)
  if (!debate) return {}
  const rawDescription =
    debate.suggestedHook ||
    debate.context?.whatHappened ||
    'Two minds. Full depth. You decide.'
  const description =
    rawDescription.length > 160 ? rawDescription.slice(0, 157) + '...' : rawDescription

  // Propagate the ?og= cache-buster from the page URL into the image URL so X's
  // image cache (keyed by image URL) refetches when the design changes.
  const og = searchParams?.og
  const imageUrl = `https://bilateral.news/debate/${params.id}/opengraph-image${og ? `?og=${encodeURIComponent(og)}` : ''}`

  return {
    title: `${debate.headline} — Bilateral`,
    description,
    openGraph: {
      title: debate.headline,
      description,
      url: `https://bilateral.news/debate/${params.id}`,
      siteName: 'Bilateral',
      type: 'article',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      // X renders twitter:title as an overlay bar at the bottom of the card on
      // mobile. Since the headline is already inside the OG image, we use the
      // overlay as a universal CTA instead of duplicating content.
      title: 'See the full debate →',
      description,
      site: '@bilateralnews',
      images: [imageUrl],
    },
  }
}

export default async function DebatePage({ params }: { params: { id: string } }) {
  const debate = await getDebate(params.id)
  if (!debate) notFound()

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F5F0',
        padding: '24px 24px 96px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '56px',
          maxWidth: '1100px',
          margin: '0 auto 56px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
          }}
        >
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#C1121F', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#0A0A0A',
            }}
          >
            bilateral
          </span>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1B4FBE', flexShrink: 0 }} />
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a
            href="/about"
            style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}
          >
            About
          </a>
          <Link
            href="/"
            style={{ fontSize: '12px', color: '#6B6B6B', textDecoration: 'none' }}
          >
            ← Back to feed
          </Link>
        </div>
      </header>
      {(debate.publishStatus === 'generating' ||
        debate.publishStatus === 'failed' ||
        (!debate.exchanges && !debate.satireExchanges)) ? (
        <PendingDebateView id={params.id} headline={debate.headline} />
      ) : (
        <StoryExchange debate={debate} />
      )}
    </main>
  )
}
