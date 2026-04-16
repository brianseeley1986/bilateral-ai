import { NextRequest, NextResponse } from 'next/server'
import { confirmSubscriber } from '@/lib/db'
import { neon } from '@neondatabase/serverless'
import { generateSignupLocalDebates } from '@/lib/local-ingestion'
import { Resend } from 'resend'

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
        SELECT id, topics, zip, latitude, city, region, county
        FROM subscribers
        WHERE confirmation_token IS NULL
        AND confirmed = true
        ORDER BY created_at DESC
        LIMIT 1
      `

      if (rows.length > 0) {
        const sub = rows[0]

        // Fire-and-forget admin notification. Don't block the redirect.
        const notifyTo = process.env.ADMIN_NOTIFICATION_EMAIL
        if (notifyTo && process.env.RESEND_API_KEY) {
          const fullRows = await sql`
            SELECT email, topics, city, region, zip FROM subscribers WHERE id = ${sub.id}
          `
          const full = fullRows[0] as any
          const resend = new Resend(process.env.RESEND_API_KEY)
          resend.emails
            .send({
              from: 'Bilateral News <digest@bilateral.news>',
              to: notifyTo,
              subject: `New Bilateral subscriber: ${full?.email ?? '(unknown)'}`,
              html: `
                <div style="font-family: system-ui; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
                  <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">New confirmed subscriber</div>
                  <div style="font-size: 13px; color: #6B6B6B; margin-bottom: 20px;">bilateral.news</div>
                  <table style="font-size: 14px; line-height: 1.6;">
                    <tr><td style="color:#6B6B6B;padding-right:12px;">Email</td><td>${full?.email ?? ''}</td></tr>
                    <tr><td style="color:#6B6B6B;padding-right:12px;">Topics</td><td>${(full?.topics ?? []).join(', ') || '—'}</td></tr>
                    <tr><td style="color:#6B6B6B;padding-right:12px;">Location</td><td>${[full?.city, full?.region, full?.zip].filter(Boolean).join(', ') || '—'}</td></tr>
                  </table>
                </div>
              `,
            })
            .catch((err) => console.error('Admin notification email failed:', err))
        }

        const hasLocal = Array.isArray(sub.topics) && sub.topics.includes('local')
        const hasLocation = sub.zip || sub.latitude || sub.city || sub.region

        if (hasLocal && hasLocation) {
          generateSignupLocalDebates({
            id: sub.id,
            city: sub.city,
            region: sub.region,
            zip: sub.zip,
            county: sub.county,
          })
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
