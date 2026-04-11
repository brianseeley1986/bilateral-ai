import { HeadlineInput } from '@/components/HeadlineInput'
import { NewsFeed } from '@/components/NewsFeed'

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F5F0',
        padding: '24px 24px 80px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '10px',
          marginBottom: '96px',
          maxWidth: '1100px',
          margin: '0 auto 96px',
        }}
      >
        <div
          style={{
            fontSize: '17px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#0A0A0A',
          }}
        >
          bilateral
        </div>
        <div style={{ fontSize: '12px', color: '#6B6B6B', letterSpacing: '0.02em' }}>
          bilateral.news
        </div>
      </header>
      <HeadlineInput />
      <NewsFeed />
    </main>
  )
}
