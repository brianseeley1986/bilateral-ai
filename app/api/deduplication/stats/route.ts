import { NextResponse } from 'next/server'
import { getDeduplicationStats } from '@/lib/deduplication'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(getDeduplicationStats())
}
