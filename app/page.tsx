import { fetchZoneData, fetchLibraryFeatured } from '@/lib/zones'
import { HomeClient } from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [zones, library] = await Promise.all([
    fetchZoneData(),
    fetchLibraryFeatured(),
  ])

  return (
    <main style={{ minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* HomeClient manages its own layout — dark hero + light sections */}
      <HomeClient zones={zones} library={library} />
    </main>
  )
}
