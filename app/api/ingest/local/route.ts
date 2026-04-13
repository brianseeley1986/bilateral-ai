import { NextRequest, NextResponse } from 'next/server'
import {
  ingestLocalStoriesForAllSubscribers,
  generateSignupLocalDebates,
  ingestNextDefaultCity,
  ingestSpecificCity,
} from '@/lib/local-ingestion'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get('x-ingest-token') || req.nextUrl.searchParams.get('token')
  return token === process.env.INGEST_SECRET_TOKEN
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))

    if (body.subscriberId) {
      const sql = neon(process.env.DATABASE_URL!)
      const rows = await sql`
        SELECT id, city, region, zip, county FROM subscribers
        WHERE id = ${body.subscriberId} AND confirmed = true LIMIT 1
      `
      if (rows.length === 0) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
      const stats = await generateSignupLocalDebates({ id: rows[0].id, city: rows[0].city, region: rows[0].region, zip: rows[0].zip, county: rows[0].county })
      return NextResponse.json({ success: true, stats })
    }

    if (body.city && body.state) {
      const stats = await ingestSpecificCity(body.city, body.state, body.maxPerLocation || 2)
      return NextResponse.json({ success: true, stats })
    }

    if (body.nextCity) {
      const result = await ingestNextDefaultCity(body.maxPerLocation || 2)
      return NextResponse.json({ success: true, result })
    }

    const stats = await ingestLocalStoriesForAllSubscribers(body.maxPerLocation || 2)
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('Local ingestion error:', err)
    return NextResponse.json({ error: 'Local ingestion failed' }, { status: 500 })
  }
}
