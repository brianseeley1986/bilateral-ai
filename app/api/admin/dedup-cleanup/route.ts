import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function aggressiveNormalize(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// POST with ?dryRun=true (default) returns a report without deleting.
// POST with ?dryRun=false actually deletes.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') || req.headers.get('x-admin-key') || ''
  const secret = process.env.ADMIN_SECRET || ''
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = searchParams.get('dryRun') !== 'false'
  const days = Number(searchParams.get('days') || '7')

  const sql = neon(process.env.DATABASE_URL!)

  const rows = await sql`
    SELECT id, headline, created_at
    FROM debates
    WHERE created_at > NOW() - (${days} || ' days')::interval
    ORDER BY created_at ASC
  `

  // Group rows by aggressive-normalized headline
  const groups = new Map<string, Array<{ id: string; headline: string; createdAt: string }>>()
  for (const r of rows) {
    const key = aggressiveNormalize(r.headline as string)
    if (!key) continue
    const list = groups.get(key) || []
    list.push({ id: r.id as string, headline: r.headline as string, createdAt: r.created_at as string })
    groups.set(key, list)
  }

  const duplicateGroups: Array<{
    normalizedKey: string
    keeping: { id: string; headline: string; createdAt: string }
    deleting: Array<{ id: string; headline: string; createdAt: string }>
  }> = []

  for (const [normalizedKey, list] of groups) {
    if (list.length < 2) continue
    const [keep, ...rest] = list // earliest first (ASC order above)
    duplicateGroups.push({ normalizedKey, keeping: keep, deleting: rest })
  }

  const toDelete = duplicateGroups.flatMap((g) => g.deleting.map((d) => d.id))

  let deleted = 0
  if (!dryRun && toDelete.length > 0) {
    const result = await sql`DELETE FROM debates WHERE id = ANY(${toDelete})`
    deleted = Array.isArray(result) ? result.length : toDelete.length
  }

  return NextResponse.json({
    dryRun,
    windowDays: days,
    scannedRows: rows.length,
    duplicateGroupCount: duplicateGroups.length,
    totalDuplicateRowsToDelete: toDelete.length,
    deleted: dryRun ? 0 : deleted,
    groups: duplicateGroups,
  })
}
