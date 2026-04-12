import { NextRequest, NextResponse } from 'next/server'
import {
  getDeduplicationStats,
  getRecentStories,
  compareHeadlines,
  clearStoryIndex,
} from '@/lib/deduplication'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    stats: getDeduplicationStats(),
    recentStories: getRecentStories(10),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { a, b } = body
  if (typeof a !== 'string' || typeof b !== 'string') {
    return NextResponse.json({ error: 'a and b required (strings)' }, { status: 400 })
  }
  return NextResponse.json({ similarity: compareHeadlines(a, b) })
}

export async function DELETE() {
  const cleared = clearStoryIndex()
  return NextResponse.json({ cleared })
}
