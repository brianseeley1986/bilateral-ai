import { getDebate } from '@/lib/store'
import { getRelatedDebates } from '@/lib/db'
import { PERSONAS } from '@/lib/personas'
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
      author: [
        {
          '@type': 'Person',
          name: PERSONAS.researcher.name,
          jobTitle: PERSONAS.researcher.title,
          url: `https://bilateral.news/authors/${PERSONAS.researcher.slug}`,
        },
        {
          '@type': 'Person',
          name: PERSONAS.conservative.name,
          jobTitle: PERSONAS.conservative.title,
          url: `https://bilateral.news/authors/${PERSONAS.conservative.slug}`,
        },
        {
          '@type': 'Person',
          name: PERSONAS.liberal.name,
          jobTitle: PERSONAS.liberal.title,
          url: `https://bilateral.news/authors/${PERSONAS.liberal.slug}`,
        },
        {
          '@type': 'Person',
          name: PERSONAS.arbiter.name,
          jobTitle: PERSONAS.arbiter.title,
          url: `https://bilateral.news/authors/${PERSONAS.arbiter.slug}`,
        },
      ],
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
          author: {
            '@type': 'Person',
            name: PERSONAS.conservative.name,
            url: `https://bilateral.news/authors/${PERSONAS.conservative.slug}`,
          },
        },
        lAnswer && {
          '@type': 'Answer',
          text: lAnswer,
          author: {
            '@type': 'Person',
            name: PERSONAS.liberal.name,
            url: `https://bilateral.news/authors/${PERSONAS.liberal.slug}`,
          },
        },
      ].filter(Boolean),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Bilateral', item: 'https://bilateral.news' },
        { '@type': 'ListItem', position: 2, name: 'Debates', item: 'https://bilateral.news/topics' },
        { '@type': 'ListItem', position: 3, name: debate.headline, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', '.speakable-summary'],
      },
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
        fontFamily: 'var(--font-sans)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1100,
          margin: '0 auto',
          padding: '24px 24px 0',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#C1121F', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.035em',
              color: '#0A0A0A',
            }}
          >
            bilateral
          </span>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1B4FBE', flexShrink: 0 }} />
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/topics" style={{ fontSize: 13, color: '#6B6B6B', textDecoration: 'none' }}>
            Topics
          </Link>
          <a href="/about" style={{ fontSize: 13, color: '#6B6B6B', textDecoration: 'none' }}>
            About
          </a>
          <Link href="/" style={{ fontSize: 12, color: '#6B6B6B', textDecoration: 'none' }}>
            ← Feed
          </Link>
        </div>
      </header>

      {/* Cover hero — CSS-rendered red/blue split with headline */}
      <div
        style={{
          maxWidth: 900,
          margin: '32px auto 0',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1200 / 630',
            borderRadius: 16,
            overflow: 'hidden',
            background: 'linear-gradient(90deg, #C1121F 0%, #C1121F 50%, #1B4FBE 50%, #1B4FBE 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 48px 56px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 42,
              fontWeight: 500,
              color: '#F5F5F0',
              textAlign: 'center',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              textShadow: '0 2px 20px rgba(0,0,0,0.22)',
              maxWidth: 760,
            }}
          >
            {debate.headline}
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 16,
              display: 'flex',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 700,
              color: '#F5F5F0',
              letterSpacing: '-0.035em',
              lineHeight: 1,
            }}
          >
            <span>bi</span>
            <span>lateral</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 24px 96px' }}>
      {(debate.publishStatus === 'generating' ||
        debate.publishStatus === 'failed' ||
        (!debate.exchanges && !debate.satireExchanges)) ? (
        <PendingDebateView id={params.id} headline={debate.headline} />
      ) : (
        <>
          <div
            style={{
              maxWidth: 720,
              margin: '32px auto 28px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 14,
              fontSize: 13,
              color: '#6B6B6B',
            }}
          >
            <span style={{ fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 10 }}>
              By
            </span>
            {[PERSONAS.researcher, PERSONAS.conservative, PERSONAS.liberal, PERSONAS.arbiter].map((p, i) => (
              <Link
                key={p.slug}
                href={`/authors/${p.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#0A0A0A',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: p.color,
                    color: '#F5F5F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {p.initials}
                </span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                {i < 3 && <span style={{ color: '#C4C4BE', marginLeft: 4 }}>·</span>}
              </Link>
            ))}
          </div>
          <StoryExchange debate={debate} />
        </>
      )}

      {related.length > 0 && (
        <section
          style={{
            maxWidth: 720,
            margin: '64px auto 0',
            paddingTop: 32,
            borderTop: '1px solid #E5E5DD',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: '#0A0A0A',
              margin: '0 0 20px',
            }}
          >
            More debates
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/debate/${r.slug || r.id}`}
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 20,
                    fontWeight: 500,
                    color: '#0A0A0A',
                    textDecoration: 'none',
                    lineHeight: 1.3,
                    letterSpacing: '-0.015em',
                  }}
                >
                  {r.headline}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      </div>
    </main>
    </>
  )
}
