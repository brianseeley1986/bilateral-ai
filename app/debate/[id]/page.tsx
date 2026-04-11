import { getDebate } from '@/lib/store'
import { StoryExchange } from '@/components/StoryExchange'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
        <Link
          href="/"
          style={{ fontSize: '12px', color: '#6B6B6B', textDecoration: 'none' }}
        >
          ← Back to feed
        </Link>
      </header>
      <StoryExchange debate={debate} />
    </main>
  )
}
