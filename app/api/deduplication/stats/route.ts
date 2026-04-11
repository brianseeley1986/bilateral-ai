import { NextResponse } from 'next/server'
import { getDeduplicationStats } from '@/lib/deduplication'

export async function GET() {
  return NextResponse.json(getDeduplicationStats())
}
