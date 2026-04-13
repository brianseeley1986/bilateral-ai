import { NextRequest, NextResponse } from 'next/server'
import { runDebatePipeline } from '@/lib/pipeline'
import { saveDebate, getDebate, getAllDebates } from '@/lib/store'
import { checkDuplicate, registerStory } from '@/lib/deduplication'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

// Shared card formatter
function formatCard(d: any, viewCount?: number) {
  return {
    id: d.id,
    headline: d.headline,
    track: d.track,
    sourceType: d.sourceType,
    geographicScope: d.geographicScope,
    createdAt: d.createdAt,
    publishStatus: d.publishStatus || 'published',
    conservativeOneLine: d.conservative?.previewLine || d.satireExchanges?.[0]?.a || '',
    liberalOneLine: d.liberal?.previewLine || d.satireExchanges?.[0]?.b || '',
    conservativeFeedHook: d.conservativeFeedHook || null,
    liberalFeedHook: d.liberalFeedHook || null,
    leadingSide: d.leadingSide || null,
    suggestedHook: d.suggestedHook,
    exchanges: d.exchanges?.slice(0, 1),
    satireExchanges: d.satireExchanges?.slice(0, 1),
    factionAlert: d.factionAlert?.detected
      ? {
          detected: true,
          dividedSide: d.factionAlert.dividedSide,
          summary: d.factionAlert.summary,
          dominantPosition: d.factionAlert.dominantPosition,
        }
      : null,
    viewCount: viewCount ?? d.viewCount ?? 0,
    overallScore: d.qualityScore?.overallScore ?? null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { headline } = await req.json()
    if (!headline || typeof headline !== 'string') {
      return NextResponse.json({ error: 'headline required' }, { status: 400 })
    }

    const dedup = await checkDuplicate(headline)
    if (dedup.isDuplicate) {
      // Silently redirect to existing debate — user never sees an error
      if (dedup.existingDebateId) {
        const existing = await getDebate(dedup.existingDebateId)
        return NextResponse.json({
          id: dedup.existingDebateId,
          publishStatus: existing?.publishStatus || 'published',
          qualityScore: existing?.qualityScore,
          fromCache: true,
        })
      }
      return NextResponse.json({ duplicate: true, reason: dedup.reason }, { status: 409 })
    }

    try {
      const debate = await runDebatePipeline(headline)
      await saveDebate(debate)
      const firstC = debate.exchanges?.[0]?.c || debate.conservative?.previewLine
      registerStory(headline, debate.id, dedup.hash, firstC)
      return NextResponse.json({
        id: debate.id,
        publishStatus: debate.publishStatus,
        qualityScore: debate.qualityScore,
      })
    } catch (pipelineErr) {
      throw pipelineErr
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Pipeline failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { deleteDebate } = await import('@/lib/db')
  await deleteDebate(id)
  return NextResponse.json({ deleted: id })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sql = neon(process.env.DATABASE_URL!)

  // ---- ZONE VIEW ----
  if (searchParams.get('zoneView') === 'true') {
    const state = searchParams.get('state') || null

    // Each zone: fetch top 5 rows + total count in parallel
    const [natRows, natCount, intlRows, intlCount, stateRows, stateCount,
           localRows, localCount, userRows, userCount] = await Promise.all([
      // national rows
      sql`SELECT data, view_count FROM debates
          WHERE publish_status='published' AND track!='satire'
          AND geographic_scope NOT IN ('local','state','international')
          AND data->>'sourceType' IS DISTINCT FROM 'library'
          AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
          ORDER BY created_at DESC LIMIT 5`,
      // national count
      sql`SELECT COUNT(*)::int AS n FROM debates
          WHERE publish_status='published' AND track!='satire'
          AND geographic_scope NOT IN ('local','state','international')
          AND data->>'sourceType' IS DISTINCT FROM 'library'
          AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'`,
      // international rows
      sql`SELECT data, view_count FROM debates
          WHERE publish_status='published' AND track!='satire'
          AND geographic_scope='international'
          AND data->>'sourceType' IS DISTINCT FROM 'library'
          AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
          ORDER BY created_at DESC LIMIT 5`,
      // international count
      sql`SELECT COUNT(*)::int AS n FROM debates
          WHERE publish_status='published' AND track!='satire'
          AND geographic_scope='international'
          AND data->>'sourceType' IS DISTINCT FROM 'library'
          AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'`,
      // state rows (optionally filtered by state param)
      state
        ? sql`SELECT data, view_count FROM debates
              WHERE publish_status='published' AND track!='satire'
              AND geographic_scope='state'
              AND data->>'sourceType' IS DISTINCT FROM 'library'
              AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
              AND (state=${state} OR data->>'state'=${state})
              ORDER BY created_at DESC LIMIT 5`
        : sql`SELECT data, view_count FROM debates
              WHERE publish_status='published' AND track!='satire'
              AND geographic_scope='state'
              AND data->>'sourceType' IS DISTINCT FROM 'library'
              AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
              ORDER BY created_at DESC LIMIT 5`,
      // state count
      state
        ? sql`SELECT COUNT(*)::int AS n FROM debates
              WHERE publish_status='published' AND track!='satire'
              AND geographic_scope='state'
              AND data->>'sourceType' IS DISTINCT FROM 'library'
              AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
              AND (state=${state} OR data->>'state'=${state})`
        : sql`SELECT COUNT(*)::int AS n FROM debates
              WHERE publish_status='published' AND track!='satire'
              AND geographic_scope='state'
              AND data->>'sourceType' IS DISTINCT FROM 'library'
              AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'`,
      // local rows
      state
        ? sql`SELECT data, view_count FROM debates
              WHERE publish_status='published' AND track!='satire'
              AND geographic_scope='local'
              AND data->>'sourceType' IS DISTINCT FROM 'library'
              AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
              AND (state=${state} OR data->>'state'=${state})
              ORDER BY created_at DESC LIMIT 5`
        : sql`SELECT data, view_count FROM debates
              WHERE publish_status='published' AND track!='satire'
              AND geographic_scope='local'
              AND data->>'sourceType' IS DISTINCT FROM 'library'
              AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
              ORDER BY created_at DESC LIMIT 5`,
      // local count
      state
        ? sql`SELECT COUNT(*)::int AS n FROM debates
              WHERE publish_status='published' AND track!='satire'
              AND geographic_scope='local'
              AND data->>'sourceType' IS DISTINCT FROM 'library'
              AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
              AND (state=${state} OR data->>'state'=${state})`
        : sql`SELECT COUNT(*)::int AS n FROM debates
              WHERE publish_status='published' AND track!='satire'
              AND geographic_scope='local'
              AND data->>'sourceType' IS DISTINCT FROM 'library'
              AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'`,
      // user submitted rows
      sql`SELECT data, view_count FROM debates
          WHERE publish_status='published'
          AND data->>'sourceType'='user_submitted'
          ORDER BY created_at DESC LIMIT 50`,
      // user submitted count
      sql`SELECT COUNT(*)::int AS n FROM debates
          WHERE publish_status='published'
          AND data->>'sourceType'='user_submitted'`,
    ])

    return NextResponse.json({
      national:      natRows.map((r: any) => formatCard(r.data, r.view_count)),
      international: intlRows.map((r: any) => formatCard(r.data, r.view_count)),
      state:         stateRows.map((r: any) => formatCard(r.data, r.view_count)),
      local:         localRows.map((r: any) => formatCard(r.data, r.view_count)),
      userSubmitted: userRows.map((r: any) => formatCard(r.data, r.view_count)),
      counts: {
        national:      natCount[0]?.n ?? 0,
        international: intlCount[0]?.n ?? 0,
        state:         stateCount[0]?.n ?? 0,
        local:         localCount[0]?.n ?? 0,
        userSubmitted: userCount[0]?.n ?? 0,
      },
    })
  }

  // ---- LEGACY FEED (kept for backward compat) ----
  if (searchParams.get('feed') === 'true') {
    const state = searchParams.get('state')
    let debates: any[]

    if (state) {
      const rows = await sql`
        SELECT data FROM debates
        WHERE publish_status = 'published'
        AND (data->>'sourceType' != 'library' OR data->>'sourceType' IS NULL)
        AND (
          geographic_scope IN ('national', 'international')
          OR track = 'satire'
          OR (
            geographic_scope IN ('local', 'state')
            AND (state = ${state} OR data->>'state' = ${state})
          )
        )
        ORDER BY created_at DESC
        LIMIT 20
      `
      debates = rows.map((r: any) => r.data)
    } else {
      const all = await getAllDebates()
      debates = all.filter((d: any) => d.sourceType !== 'library')
    }

    return NextResponse.json(debates.map((d: any) => formatCard(d)))
  }

  // ---- GEO / SOURCE FILTERED (powers See all links) ----
  const geo = searchParams.get('geo')
  const source = searchParams.get('source')

  if (geo || source) {
    let rows: any[]
    if (source === 'user_submitted') {
      rows = await sql`
        SELECT data, view_count FROM debates
        WHERE publish_status = 'published'
        AND data->>'sourceType' = 'user_submitted'
        ORDER BY created_at DESC LIMIT 50
      `
    } else if (geo === 'national') {
      rows = await sql`
        SELECT data, view_count FROM debates
        WHERE publish_status = 'published'
        AND geographic_scope NOT IN ('local','state','international')
        AND data->>'sourceType' IS DISTINCT FROM 'library'
        AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
        ORDER BY created_at DESC LIMIT 50
      `
    } else if (geo === 'international') {
      rows = await sql`
        SELECT data, view_count FROM debates
        WHERE publish_status = 'published'
        AND geographic_scope = 'international'
        AND data->>'sourceType' IS DISTINCT FROM 'library'
        ORDER BY created_at DESC LIMIT 50
      `
    } else if (geo === 'state') {
      rows = await sql`
        SELECT data, view_count FROM debates
        WHERE publish_status = 'published'
        AND geographic_scope = 'state'
        AND data->>'sourceType' IS DISTINCT FROM 'library'
        ORDER BY created_at DESC LIMIT 50
      `
    } else if (geo === 'local') {
      rows = await sql`
        SELECT data, view_count FROM debates
        WHERE publish_status = 'published'
        AND geographic_scope = 'local'
        AND data->>'sourceType' IS DISTINCT FROM 'library'
        ORDER BY created_at DESC LIMIT 50
      `
    } else {
      rows = []
    }
    return NextResponse.json(rows.map((r: any) => formatCard(r.data, r.view_count)))
  }

  // ---- SINGLE DEBATE ----
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const debate = await getDebate(id)
  if (!debate) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(debate)
}
