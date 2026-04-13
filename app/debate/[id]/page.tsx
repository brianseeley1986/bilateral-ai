import { getDebate } from '@/lib/store'
import { StoryExchange } from '@/components/StoryExchange'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const debate = await getDebate(params.id)
  if (!debate) return {}
  const rawDescription =
    debate.suggestedHook ||
    debate.context?.whatHappened ||
    'Two minds. Full depth. You decide.'
  const description =
    rawDescription.length > 160 ? rawDescription.slice(0, 157) + '...' : rawDescription

  return {
    title: `${debate.headline} — Bilateral`,
    description,
    openGraph: {
      title: debate.headline,
      description,
      url: `https://bilateral.news/debate/${params.id}`,
      siteName: 'Bilateral',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: debate.headline,
      description,
      site: '@bilateralnews',
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
            alignItems: 'baseline',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
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
          <span style={{ fontSize: '12px', color: '#6B6B6B' }}>bilateral.news</span>
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
      <StoryExchange debate={debate} />
    </main>
  )
}
