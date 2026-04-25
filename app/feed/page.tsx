import { fetchZoneData } from '@/lib/zones'
import { FeedClient } from '@/components/FeedClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Feed — Bilateral',
  description: 'Swipe through the debate behind every headline. See both sides in 30 seconds.',
  openGraph: {
    title: 'Bilateral Feed',
    description: 'Swipe through the debate behind every headline.',
  },
}

export default async function FeedPage() {
  const zones = await fetchZoneData()

  // Combine national + international, sorted by recency
  const debates = [...zones.national, ...zones.international]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return <FeedClient debates={debates} />
}
