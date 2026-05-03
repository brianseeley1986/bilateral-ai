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
          const slug: string = debate.slug || id
          const link = `${baseUrl}/debate/${slug}`
          const imageUrl = `${baseUrl}/debate/${slug}/opengraph-image`

          return `
<div style="padding: 24px 0; border-bottom: 1px solid #F0F0F0;">
  <a href="${link}" style="text-decoration: none; color: inherit; display: block;">
    <img src="${imageUrl}" alt="${escapeHtml(headline)}" style="width: 100%; border-radius: 10px; margin-bottom: 14px; display: block;" />
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <span style="font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 4px; background: ${badgeBg}; color: ${badgeColor}; letter-spacing: 0.06em; text-transform: uppercase;">${badge}</span>
    </div>
    <div style="font-size: 18px; font-weight: 600; line-height: 1.35; margin-bottom: 8px; color: #0A0A0A;">${escapeHtml(headline)}</div>
    ${hook ? `<div style="font-size: 14px; color: #666666; margin-bottom: 12px; line-height: 1.55;">${escapeHtml(hook)}</div>` : ''}
    <div style="display: flex; gap: 8px;">
      ${cLine ? `<div style="flex: 1; border-left: 3px solid #C1121F; padding: 8px 12px; background: #FAFAFA; border-radius: 0 6px 6px 0;">
        <div style="font-size: 9px; font-weight: 700; color: #C1121F; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Conservative</div>
        <div style="font-size: 12px; line-height: 1.45; color: #333333;">${escapeHtml(cLine.length > 100 ? cLine.slice(0, 97) + '...' : cLine)}</div>
      </div>` : ''}
      ${lLine ? `<div style="flex: 1; border-left: 3px solid #1B4FBE; padding: 8px 12px; background: #FAFAFA; border-radius: 0 6px 6px 0;">
        <div style="font-size: 9px; font-weight: 700; color: #1B4FBE; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Liberal</div>
        <div style="font-size: 12px; line-height: 1.45; color: #333333;">${escapeHtml(lLine.length > 100 ? lLine.slice(0, 97) + '...' : lLine)}</div>
      </div>` : ''}
    </div>
    <div style="margin-top: 12px; font-size: 12px; font-weight: 600; color: #0A0A0A;">Read the debate →</div>
  </a>
</div>`
        })
        .join('')

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #FFFFFF; font-family: system-ui, -apple-system, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #F0F0F0;">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #C1121F; display: inline-block;"></span>
        <span style="font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #0A0A0A;">bilateral</span>
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #1B4FBE; display: inline-block;"></span>
      </div>
      <div style="font-size: 13px; color: #999999;">${date}</div>
    </div>
    ${debateCards}
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #F0F0F0; font-size: 12px; color: #999999; text-align: center; line-height: 2;">
      <a href="${baseUrl}" style="color: #666666; text-decoration: none; font-weight: 500;">bilateral.news</a> · The debate behind every headline.
      <br />
      <a href="${unsubUrl}" style="color: #BBBBBB; text-decoration: none;">Unsubscribe</a>
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
