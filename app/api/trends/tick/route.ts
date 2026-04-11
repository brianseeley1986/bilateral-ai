import { NextResponse } from 'next/server'
import { ingestTrends } from '@/lib/trends'

export const maxDuration = 300

export async function POST() {
  try {
    const result = await ingestTrends()
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('trends tick failed', err)
    return NextResponse.json({ error: err?.message || 'tick failed' }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
