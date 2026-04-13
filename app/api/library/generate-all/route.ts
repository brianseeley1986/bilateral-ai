import { NextRequest, NextResponse } from 'next/server'
import { initDb, getLibraryStats, getPendingLibraryQuestions } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authOK(req: NextRequest): boolean {
  const token =
    req.headers.get('x-ingest-token') ||
    new URL(req.url).searchParams.get('token')
  return token === process.env.INGEST_SECRET_TOKEN
}

// Kicks off generation by repeatedly calling /api/library/generate.
// Fire-and-forget: returns immediately with initial stats.
export async function POST(req: NextRequest) {
  if (!authOK(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  await initDb()

  let body: any = {}
  try {
    body = await req.json()
  } catch {}
  const batchSize = Math.min(Math.max(1, parseInt(body.batchSize ?? '3', 10)), 5)
  const maxBatches = Math.min(Math.max(1, parseInt(body.maxBatches ?? '60', 10)), 100)

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
    `https://${req.headers.get('host')}`
  const token = process.env.INGEST_SECRET_TOKEN || ''

  // Fire-and-forget orchestrator
  ;(async () => {
    for (let i = 0; i < maxBatches; i++) {
      const pending = await getPendingLibraryQuestions(1)
      if (!pending.length) break
      try {
        const r = await fetch(`${baseUrl}/api/library/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-ingest-token': token },
          body: JSON.stringify({ count: batchSize }),
        })
        if (!r.ok) {
          console.error('[library/generate-all] batch failed:', r.status)
          break
        }
      } catch (e) {
        console.error('[library/generate-all] batch error:', e)
        break
      }
    }
  })()

  const stats = await getLibraryStats()
  return NextResponse.json({
    started: true,
    batchSize,
    maxBatches,
    initialStats: stats,
  })
}
