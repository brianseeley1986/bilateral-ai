import { getDebate } from '@/lib/store'
import { getRelatedDebates } from '@/lib/db'
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
  // Canonical always points to the slug URL when one exists, so search engines
  // dedupe id-based and ?og-busted variants to the SEO-friendly slug version.
  const canonicalSlug = (debate as { slug?: string }).slug || params.id
  const canonicalUrl = `https://bilateral.news/debate/${canonicalSlug}`
  const imageUrl = `https://bilateral.news/debate/${params.id}/opengraph-image${og ? `?og=${encodeURIComponent(og)}` : ''}`

  return {
    title: `${debate.headline} — Bilateral`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: debate.headline,
      description,
      url: canonicalUrl,
      siteName: 'Bilateral',
      type: 'article',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      // X renders twitter:title as an overlay bar at the bottom of the card on
      // mobile. Since the headline is already inside the OG image, we use the
      // overlay as a universal CTA instead of duplicating content.
      title: 'The argument behind every headline.',
      description,
      site: '@bilateralnews',
      images: [imageUrl],
    },
  }
}

export default async function DebatePage({ params }: { params: { id: string } }) {
  const debate = await getDebate(params.id)
  if (!debate) notFound()
  const related = await getRelatedDebates(debate.id || params.id, 4)

  // Structured data: NewsArticle + Question/Answer so Google and AI search
  // engines can identify both the news context and the two-sided debate.
  const url = `https://bilateral.news/debate/${params.id}`
  const datePublished = debate.createdAt || new Date().toISOString()
  const cAnswer: string =
    debate.conservative?.argument || debate.conservative?.previewLine || debate.exchanges?.[0]?.c || ''
  const lAnswer: string =
    debate.liberal?.argument || debate.liberal?.previewLine || debate.exchanges?.[0]?.l || ''
  const description: string =
    debate.suggestedHook || debate.context?.whatHappened || ''

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: debate.headline,
      description,
      datePublished,
      dateModified: datePublished,
      url,
      image: `${url}/opengraph-image`,
      author: { '@type': 'Organization', name: 'Bilateral', url: 'https://bilateral.news' },
      publisher: {
        '@type': 'Organization',
        name: 'Bilateral',
        url: 'https://bilateral.news',
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Question',
      name: debate.headline,
      text: debate.headline,
      url,
      answerCount: (cAnswer ? 1 : 0) + (lAnswer ? 1 : 0),
      suggestedAnswer: [
        cAnswer && {
          '@type': 'Answer',
          text: cAnswer,
          author: { '@type': 'Person', name: 'Conservative analyst' },
        },
        lAnswer && {
          '@type': 'Answer',
          text: lAnswer,
          author: { '@type': 'Person', name: 'Liberal analyst' },
        },
      ].filter(Boolean),
    },
  ]

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
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

      {related.length > 0 && (
        <section
          style={{
            maxWidth: '720px',
            margin: '64px auto 0',
            paddingTop: '32px',
            borderTop: '1px solid #E5E5DD',
          }}
        >
          <h2
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#6B6B6B',
              margin: '0 0 20px',
            }}
          >
            More debates
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/debate/${r.slug || r.id}`}
                  style={{
                    display: 'block',
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#0A0A0A',
                    textDecoration: 'none',
                    lineHeight: 1.35,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {r.headline}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
    </>
  )
}
