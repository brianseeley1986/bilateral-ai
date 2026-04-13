import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

function sql() {
  return neon(process.env.DATABASE_URL!)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') || req.headers.get('x-admin-key') || ''
  const secret = process.env.ADMIN_SECRET || ''

  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = sql()

  const [
    topLine,
    bySource,
    mostViewed,
    recentUserSubmitted,
    qualityDist,
    subscribers,
    byGeo,
    dailyVolume,
    factionStats,
    needsReview,
  ] = await Promise.all([
    // 1. Top-line metrics
    db`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE publish_status = 'published') AS published,
        COUNT(*) FILTER (WHERE created_at > NOW() - interval '24 hours') AS today,
        COUNT(*) FILTER (WHERE created_at > NOW() - interval '7 days') AS this_week,
        COALESCE(SUM(view_count), 0) AS total_views
      FROM debates
    `.then(r => r[0]),

    // 2. Debates by source type
    db`
      SELECT
        COALESCE(data->>'sourceType', 'unknown') AS source_type,
        COUNT(*) AS count
      FROM debates
      WHERE publish_status = 'published'
      GROUP BY source_type
      ORDER BY count DESC
    `,

    // 3. Most viewed
    db`
      SELECT id, headline, view_count, created_at, track, geographic_scope
      FROM debates
      WHERE publish_status = 'published'
      ORDER BY view_count DESC NULLS LAST
      LIMIT 10
    `,

    // 4. Recent user-submitted
    db`
      SELECT id, headline, created_at,
             (data->'qualityScore'->>'overallScore')::float AS score,
             data->'qualityScore'->>'classification' AS classification,
             publish_status
      FROM debates
      WHERE data->>'sourceType' = 'user_submitted'
      ORDER BY created_at DESC
      LIMIT 15
    `,

    // 5. Quality distribution
    db`
      SELECT
        data->'qualityScore'->>'classification' AS classification,
        COUNT(*) AS count,
        ROUND(AVG((data->'qualityScore'->>'overallScore')::float)::numeric, 1) AS avg_score
      FROM debates
      WHERE data->'qualityScore' IS NOT NULL
        AND publish_status = 'published'
      GROUP BY classification
      ORDER BY count DESC
    `,

    // 6. Subscribers
    db`
      SELECT
        id, email, topics, city, region, confirmed,
        created_at, last_digest_at, unsubscribed_at
      FROM subscribers
      ORDER BY created_at DESC
      LIMIT 100
    `,

    // 7. By geography
    db`
      SELECT
        geographic_scope,
        COUNT(*) AS count
      FROM debates
      WHERE publish_status = 'published'
      GROUP BY geographic_scope
      ORDER BY count DESC
    `,

    // 8. Daily volume — last 14 days
    db`
      SELECT
        date_trunc('day', created_at AT TIME ZONE 'America/New_York') AS day,
        COUNT(*) AS count
      FROM debates
      WHERE created_at > NOW() - interval '14 days'
      GROUP BY day
      ORDER BY day ASC
    `,

    // 9. Faction detection stats
    db`
      SELECT
        COUNT(*) FILTER (WHERE data->'factionAlert'->>'detected' = 'true') AS detected,
        COUNT(*) FILTER (WHERE data->'factionAlert'->>'dividedSide' = 'conservative') AS conservative_divided,
        COUNT(*) FILTER (WHERE data->'factionAlert'->>'dividedSide' = 'liberal') AS liberal_divided,
        COUNT(*) FILTER (WHERE data->'factionAlert'->>'dividedSide' = 'both') AS both_divided,
        COUNT(*) AS total_checked
      FROM debates
      WHERE publish_status = 'published'
        AND data->'factionAlert' IS NOT NULL
    `.then(r => r[0]),

    // 10. Recent review/held debates
    db`
      SELECT id, headline, created_at, publish_status,
             (data->'qualityScore'->>'overallScore')::float AS score,
             data->'qualityScore'->>'classification' AS classification,
             data->'qualityScore'->>'scoringNotes' AS notes,
             data->'qualityScore'->>'weakestDimension' AS weakest
      FROM debates
      WHERE publish_status IN ('review', 'held')
      ORDER BY created_at DESC
      LIMIT 20
    `,
  ])

  // Also get subscriber summary counts
  const subStats = await db`
    SELECT
      COUNT(*) FILTER (WHERE confirmed = true AND unsubscribed_at IS NULL) AS active,
      COUNT(*) FILTER (WHERE confirmed = false) AS pending,
      COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL) AS unsubscribed
    FROM subscribers
  `.then(r => r[0])

  return NextResponse.json({
    topLine: {
      total: parseInt(topLine.total),
      published: parseInt(topLine.published),
      today: parseInt(topLine.today),
      thisWeek: parseInt(topLine.this_week),
      totalViews: parseInt(topLine.total_views),
      activeSubscribers: parseInt(subStats.active),
      pendingSubscribers: parseInt(subStats.pending),
      unsubscribed: parseInt(subStats.unsubscribed),
    },
    bySource,
    mostViewed,
    recentUserSubmitted,
    qualityDist,
    subscribers,
    byGeo,
    dailyVolume: dailyVolume.map((r: any) => ({
      day: r.day,
      count: parseInt(r.count),
    })),
    factionStats: {
      detected: parseInt(factionStats.detected),
      conservativeDivided: parseInt(factionStats.conservative_divided),
      liberalDivided: parseInt(factionStats.liberal_divided),
      bothDivided: parseInt(factionStats.both_divided),
      totalChecked: parseInt(factionStats.total_checked),
    },
    needsReview,
  })
}
