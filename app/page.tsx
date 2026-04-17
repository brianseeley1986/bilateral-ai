import { fetchZoneData, fetchLibraryFeatured } from '@/lib/zones'
import { HomeClient } from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [zones, library] = await Promise.all([
    fetchZoneData(),
    fetchLibraryFeatured(),
  ])

  return (
    <main style={{ minHeight: '100vh', background: '#F5F5F0', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Top nav — server rendered, visible to crawlers */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <a href="/debates" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
            Debates
          </a>
          <a href="/about" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none' }}>
            About
          </a>
        </div>

        {/* Client island — handles all interactive state */}
        <HomeClient zones={zones} library={library} />
      </div>
    </main>
  )
}
