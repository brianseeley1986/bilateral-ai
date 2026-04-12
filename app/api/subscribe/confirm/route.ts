import { NextRequest, NextResponse } from 'next/server'
import { confirmSubscriber } from '@/lib/db'
import { neon } from '@neondatabase/serverless'
import { ingestLocalStoriesForSubscriber } from '@/lib/local-ingestion'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/?confirmed=false', req.url))
  }

  const confirmed = await confirmSubscriber(token)

  if (confirmed) {
    try {
      const sql = neon(process.env.DATABASE_URL!)
      const rows = await sql`
        SELECT id, topics, zip, latitude
        FROM subscribers
        WHERE confirmation_token IS NULL
        AND confirmed = true
        ORDER BY created_at DESC
        LIMIT 1
      `

      if (rows.length > 0) {
        const sub = rows[0]
        const hasLocal = Array.isArray(sub.topics) && sub.topics.includes('local')
        const hasLocation = sub.zip || sub.latitude

        if (hasLocal && hasLocation) {
          ingestLocalStoriesForSubscriber(sub.id)
            .then((stats) => console.log('Local ingestion for new subscriber:', stats))
            .catch((err) => console.error('Local ingestion error:', err))
        }
      }
    } catch (err) {
      console.error('Post-confirmation check failed:', err)
    }
  }

  return NextResponse.redirect(
    new URL(confirmed ? '/?confirmed=true' : '/?confirmed=false', req.url)
  )
}
