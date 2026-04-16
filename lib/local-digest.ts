import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import { cleanHeadline } from './headline'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function generateUnsubToken(id: string): string {
  return Buffer.from(id).toString('base64')
}

function truncateAtWord(str: string, max: number): string {
  if (str.length <= max) return str
  const truncated = str.slice(0, max)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...'
}

export function generateLocalDigestHTML(params: {
  debates: any[]
  subscriberCity: string | null
  subscriberState: string | null
  date: string
  baseUrl: string
  unsubUrl: string
}): { html: string; text: string; subject: string } {
  const { debates, subscriberCity, subscriberState, date, baseUrl, unsubUrl } = params
  const locationLabel = subscriberCity || subscriberState || 'your area'

  const subject = truncateAtWord(
    `This week near ${locationLabel} — ${cleanHeadline(debates[0]?.headline || 'Local debates')}`,
    70
  )

  const debateCards = debates
    .map((d: any) => {
      const debate = d.data || d
      const headline = escapeHtml(cleanHeadline(d.headline || debate.headline || ''))
      const id: string = debate.id || d.id
      const cLine: string = debate.conservative?.previewLine || ''
      const lLine: string = debate.liberal?.previewLine || ''
      const cityState = [d.city || debate.city, d.state || debate.state].filter(Boolean).join(', ')
      const link = `${baseUrl}/debate/${id}?h=${encodeURIComponent(cleanHeadline(d.headline || debate.headline || ''))}`

      return `
<div style="padding: 20px 0; border-bottom: 0.5px solid #e8e8e4;">
  <div style="margin-bottom: 8px;">
    <span style="font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: #dbeafe; color: #1e3a5f; letter-spacing: 0.05em; text-transform: uppercase;">LOCAL</span>
    ${cityState ? `<span style="font-size: 11px; color: #9B9B9B; margin-left: 8px;">${escapeHtml(cityState)}</span>` : ''}
  </div>
  <div style="font-size: 17px; font-weight: 500; line-height: 1.4; margin-bottom: 8px; color: #0A0A0A;">${headline}</div>
  ${cLine ? `<div style="background: #fff0f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;">
    <div style="font-size: 9px; font-weight: 700; color: #C1121F; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 4px;">Conservative</div>
    <div style="font-size: 13px; line-height: 1.5; color: #1a1a1a;">${escapeHtml(cLine)}</div>
  </div>` : ''}
  ${lLine ? `<div style="background: #f0f4ff; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
    <div style="font-size: 9px; font-weight: 700; color: #1B4FBE; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 4px;">Liberal</div>
    <div style="font-size: 13px; line-height: 1.5; color: #1a1a1a;">${escapeHtml(lLine)}</div>
  </div>` : ''}
  <a href="${link}" style="font-size: 12px; color: #0A0A0A; text-decoration: none; font-weight: 500;">Read the debate →</a>
</div>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #F5F5F0; font-family: system-ui, -apple-system, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
    <div style="margin-bottom: 28px;">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #C1121F;"></span>
        <span style="font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #0A0A0A;">bilateral</span>
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #1B4FBE;"></span>
      </div>
      <div style="font-size: 12px; color: #9B9B9B;">${date} · Local debates near ${escapeHtml(locationLabel)}</div>
    </div>
    <div style="background: white; border-radius: 12px; padding: 0 20px; margin-bottom: 24px;">${debateCards}</div>
    <div style="font-size: 11px; color: #9B9B9B; text-align: center; line-height: 1.8;">
      <a href="${baseUrl}" style="color: #6B6B6B; text-decoration: none;">bilateral.news</a> ·
      <a href="${unsubUrl}" style="color: #9B9B9B; text-decoration: none;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`

  const text =
    debates
      .map((d: any) => {
        const headline = cleanHeadline(d.headline || d.data?.headline || '')
        const id = d.data?.id || d.id
        return `${headline}\n${baseUrl}/debate/${id}`
      })
      .join('\n\n') + `\n\n—\nUnsubscribe: ${unsubUrl}`

  return { html, text, subject }
}

export async function sendLocalWeeklyDigests(): Promise<{
  sent: number
  failed: number
  skipped: number
  totalSubscribers: number
}> {
  const stats = { sent: 0, failed: 0, skipped: 0, totalSubscribers: 0 }
  const sql = neon(process.env.DATABASE_URL!)
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const subscribers = await sql`
    SELECT id, email, city, region, county
    FROM subscribers
    WHERE confirmed = true
    AND unsubscribed_at IS NULL
    AND 'local' = ANY(topics)
    AND (city IS NOT NULL OR region IS NOT NULL OR zip IS NOT NULL)
  `
  stats.totalSubscribers = subscribers.length
  console.log(`[local-digest] ${subscribers.length} local subscribers`)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bilateral.news'
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  for (const sub of subscribers) {
    try {
      const subState: string | null = sub.region || null
      const subCity: string | null = sub.city || null

      // Find local debates from this subscriber's state in the last 7 days
      const stateFilter = subState
      const recentLocal = stateFilter
        ? await sql`
            SELECT data, headline, city, state
            FROM debates
            WHERE publish_status = 'published'
            AND geographic_scope = 'local'
            AND created_at > NOW() - INTERVAL '7 days'
            AND state = ${stateFilter}
            ORDER BY created_at DESC
            LIMIT 8
          `
        : []

      if (recentLocal.length === 0) {
        stats.skipped++
        continue
      }

      const unsubUrl = `${baseUrl}/api/subscribe/unsubscribe?token=${generateUnsubToken(sub.id)}`
      const { html, text, subject } = generateLocalDigestHTML({
        debates: recentLocal,
        subscriberCity: subCity,
        subscriberState: subState,
        date,
        baseUrl,
        unsubUrl,
      })

      await resend.emails.send({
        from: 'Bilateral News <digest@bilateral.news>',
        to: sub.email,
        subject,
        html,
        text,
      })

      stats.sent++
      console.log(`[local-digest] sent → ${sub.email} (${recentLocal.length} debates)`)
    } catch (err) {
      stats.failed++
      console.error(`[local-digest] failed → ${sub.email}:`, err)
    }
  }

  console.log('[local-digest] complete', stats)
  return stats
}
