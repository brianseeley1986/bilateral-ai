import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'
import { cleanHeadline } from './headline'

const TOPIC_KEYWORDS: Record<string, string[]> = {
  economics: ['economy', 'economic', 'fed', 'federal reserve', 'inflation', 'tariff', 'trade', 'budget', 'debt', 'market', 'wage', 'tax'],
  foreign_policy: ['iran', 'ukraine', 'russia', 'china', 'nato', 'war', 'ceasefire', 'military', 'sanctions', 'international', 'treaty', 'diplomacy'],
  immigration: ['immigration', 'immigrant', 'border', 'asylum', 'deportation', 'ice', 'migrant', 'visa', 'daca'],
  politics: ['congress', 'senate', 'house', 'president', 'election', 'vote', 'democrat', 'republican', 'policy', 'legislation', 'bill', 'law'],
  education: ['school', 'education', 'student', 'teacher', 'curriculum', 'university', 'college', 'board'],
  healthcare: ['health', 'hospital', 'medical', 'drug', 'insurance', 'medicare', 'medicaid', 'abortion'],
  technology: ['tech', 'ai', 'artificial intelligence', 'social media', 'privacy', 'data', 'cyber'],
  climate: ['climate', 'energy', 'environment', 'carbon', 'renewable', 'oil', 'gas', 'emission'],
  legal: ['court', 'supreme court', 'ruling', 'judge', 'constitutional', 'law', 'legal', 'rights'],
  criminal_justice: ['police', 'crime', 'prison', 'criminal', 'justice', 'sentencing', 'prosecution'],
  local: [],
}

function debateMatchesTopics(headline: string, topics: string[]): boolean {
  const h = headline.toLowerCase()
  for (const topic of topics) {
    if (topic === 'local') continue
    const keywords = TOPIC_KEYWORDS[topic] || []
    for (const kw of keywords) {
      if (h.includes(kw)) return true
    }
  }
  return false
}

function truncateAtWord(str: string, max: number): string {
  if (str.length <= max) return str
  const truncated = str.slice(0, max)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...'
}

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

export async function sendDailyDigests(): Promise<{
  sent: number
  failed: number
  skipped: number
  totalSubscribers: number
  recentDebatesCount: number
}> {
  const sql = neon(process.env.DATABASE_URL!)
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const stats = { sent: 0, failed: 0, skipped: 0, totalSubscribers: 0, recentDebatesCount: 0 }

  const recentDebates = await sql`
    SELECT data, headline, geographic_scope, city, state, track
    FROM debates
    WHERE publish_status = 'published'
    AND created_at > NOW() - INTERVAL '24 hours'
    AND (data->>'sourceType' = 'rss' OR data->>'sourceType' = 'trending' OR data->>'sourceType' = 'journalist')
    ORDER BY created_at DESC
    LIMIT 50
  `
  stats.recentDebatesCount = recentDebates.length

  if (recentDebates.length === 0) {
    console.log('[digest] No recent debates — skipping run')
    return stats
  }

  const subscribers = await sql`
    SELECT id, email, topics, city, region, latitude, longitude
    FROM subscribers
    WHERE confirmed = true AND unsubscribed_at IS NULL
  `
  stats.totalSubscribers = subscribers.length

  console.log(`[digest] ${subscribers.length} subscribers, ${recentDebates.length} recent debates`)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bilateral.news'
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  for (const sub of subscribers) {
    try {
      const topics: string[] = sub.topics || []
      const hasLocal = topics.includes('local')

      const matched = recentDebates
        .filter((d: any) => {
          const headline: string = d.headline || d.data?.headline || ''
          const geoScope: string = d.geographic_scope || d.data?.geographicScope || 'national'

          if (geoScope === 'local' || geoScope === 'state') {
            if (!hasLocal) return false
            if (!sub.region) return false
            const debateState = d.state || d.data?.state
            return debateState === sub.region
          }

          return debateMatchesTopics(headline, topics)
        })
        .slice(0, 5)

      if (matched.length === 0) {
        stats.skipped++
        continue
      }

      const unsubUrl = `${baseUrl}/api/subscribe/unsubscribe?token=${generateUnsubToken(sub.id)}`

      const firstHeadlineRaw = matched[0].headline || matched[0].data?.headline || "Today's debates"
      const firstHeadline = cleanHeadline(firstHeadlineRaw)
      const subject = truncateAtWord(`Today on Bilateral — ${firstHeadline}`, 80)

      const debateCards = matched
        .map((d: any) => {
          const debate = d.data || d
          const rawHeadline: string = d.headline || debate.headline || ''
          const headline = cleanHeadline(rawHeadline)
          const id: string = debate.id || d.id
          const cLine: string = debate.conservative?.previewLine || debate.conservativeFeedHook || ''
          const lLine: string = debate.liberal?.previewLine || debate.liberalFeedHook || ''
          const hook: string = debate.suggestedHook || ''
          const geoScope: string = d.geographic_scope || debate.geographicScope || 'national'
          const track: string = d.track || debate.track || 'serious'

          const badge =
            track === 'satire'
              ? 'SATIRE'
              : geoScope === 'local'
                ? 'LOCAL'
                : geoScope === 'state'
                  ? 'STATE'
                  : geoScope === 'international'
                    ? 'WORLD'
                    : 'BREAKING'
          const badgeBg = badge === 'SATIRE' ? '#fef3c7' : badge === 'LOCAL' || badge === 'STATE' ? '#dbeafe' : '#fee2e2'
          const badgeColor = badge === 'SATIRE' ? '#92400e' : badge === 'LOCAL' || badge === 'STATE' ? '#1e3a5f' : '#7f1d1d'
          const link = `${baseUrl}/debate/${id}?h=${encodeURIComponent(headline)}`

          return `
<div style="padding: 20px 0; border-bottom: 0.5px solid #e8e8e4;">
  <div style="margin-bottom: 8px;">
    <span style="font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: ${badgeBg}; color: ${badgeColor}; letter-spacing: 0.05em; text-transform: uppercase;">${badge}</span>
  </div>
  <div style="font-size: 17px; font-weight: 500; line-height: 1.4; margin-bottom: 8px; color: #0A0A0A;">${escapeHtml(headline)}</div>
  ${hook ? `<div style="font-size: 13px; color: #6B6B6B; font-style: italic; margin-bottom: 10px; line-height: 1.6;">${escapeHtml(hook)}</div>` : ''}
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
      <div style="font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; color: #0A0A0A;">bilateral</div>
      <div style="font-size: 12px; color: #9B9B9B;">${date} · Every satisfying political debate.</div>
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
        matched
          .map((d: any) => {
            const headline = cleanHeadline(d.headline || d.data?.headline || '')
            const id = d.data?.id || d.id
            return `${headline}\n${baseUrl}/debate/${id}`
          })
          .join('\n\n') + `\n\n—\nUnsubscribe: ${unsubUrl}`

      await resend.emails.send({
        from: 'Bilateral News <digest@bilateral.news>',
        to: sub.email,
        subject,
        html,
        text,
      })

      stats.sent++
      console.log(`[digest] sent → ${sub.email} (${matched.length} debates)`)
    } catch (err) {
      stats.failed++
      console.error(`[digest] failed → ${sub.email}:`, err)
    }
  }

  console.log('[digest] complete', stats)
  return stats
}
