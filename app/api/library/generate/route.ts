import { NextRequest, NextResponse } from 'next/server'
import {
  initDb,
  getPendingLibraryQuestions,
  setLibraryStatus,
  getLibraryStats,
  getLibraryQuestionBySlug,
} from '@/lib/db'
import { runDebatePipeline } from '@/lib/pipeline'
import { saveDebate } from '@/lib/store'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authOK(req: NextRequest): boolean {
  const token =
    req.headers.get('x-ingest-token') ||
    new URL(req.url).searchParams.get('token')
  return token === process.env.INGEST_SECRET_TOKEN
}

export async function POST(req: NextRequest) {
  if (!authOK(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  await initDb()

  let body: any = {}
  try {
    body = await req.json()
  } catch {}
  const count = Math.min(Math.max(1, parseInt(body.count ?? '3', 10)), 10)
  const targetSlug: string | undefined = body.slug

  const targets = targetSlug
    ? [await getLibraryQuestionBySlug(targetSlug)].filter(Boolean) as any[]
    : await getPendingLibraryQuestions(count)

  if (!targets.length) {
    const stats = await getLibraryStats()
    return NextResponse.json({ processed: 0, stats })
  }

  const results: Array<{
    slug: string
    status: 'published' | 'failed'
    debateId?: string
    error?: string
  }> = []

  for (const q of targets) {
    try {
      await setLibraryStatus(q.id, 'generating')
      const debate = await runDebatePipeline(q.question, 'library')
      ;(debate as any).librarySlug = q.slug
      ;(debate as any).libraryCategory = q.category
      await saveDebate(debate)
      await setLibraryStatus(q.id, 'published', { debate_id: debate.id })
      results.push({ slug: q.slug, status: 'published', debateId: debate.id })
    } catch (err: any) {
      console.error(`[library] generation failed for ${q.slug}:`, err)
      await setLibraryStatus(q.id, 'failed', {
        error_message: String(err?.message || err).slice(0, 500),
      })
      results.push({ slug: q.slug, status: 'failed', error: String(err?.message || err) })
    }
  }

  const stats = await getLibraryStats()
  return NextResponse.json({ processed: results.length, results, stats })
}
