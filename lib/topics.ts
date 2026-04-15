// Topic clusters group debates under broad themes for SEO hub pages.
// Each topic is matched against the debate headline via case-insensitive
// keyword regex. A debate can belong to multiple topics.

export type Topic = {
  slug: string
  title: string
  description: string
  // Words/phrases that, if present in the headline, mark a debate as on-topic.
  // Use word boundaries — short tokens like "ai" need exact-word matching.
  keywords: string[]
}

export const TOPICS: Topic[] = [
  {
    slug: 'economy',
    title: 'Economy',
    description: 'Inflation, jobs, trade, taxes — the live arguments shaping the American economy.',
    keywords: ['economy', 'economic', 'inflation', 'tax', 'taxes', 'wage', 'wages', 'jobs', 'unemployment', 'tariff', 'trade', 'recession', 'fed', 'federal reserve', 'minimum wage', 'union'],
  },
  {
    slug: 'immigration',
    title: 'Immigration',
    description: 'Border, asylum, deportation, citizenship — every angle of the immigration debate.',
    keywords: ['immigration', 'immigrant', 'border', 'asylum', 'migrant', 'deportation', 'visa', 'green card', 'daca', 'refugee', 'ice'],
  },
  {
    slug: 'healthcare',
    title: 'Healthcare',
    description: 'Coverage, cost, care, abortion, drug pricing — the fights inside American healthcare.',
    keywords: ['healthcare', 'health care', 'medicare', 'medicaid', 'abortion', 'drug pricing', 'insurance', 'aca', 'affordable care', 'vaccine', 'obamacare', 'planned parenthood'],
  },
  {
    slug: 'foreign-policy',
    title: 'Foreign Policy',
    description: 'Israel, Ukraine, Russia, China, Iran — the global decisions debated at home.',
    keywords: ['israel', 'gaza', 'palestine', 'ukraine', 'russia', 'china', 'iran', 'nato', 'taiwan', 'foreign aid', 'sanctions', 'military aid', 'pentagon', 'syria', 'venezuela', 'cuba', 'north korea'],
  },
  {
    slug: 'criminal-justice',
    title: 'Criminal Justice',
    description: 'Policing, prisons, sentencing, guns, bail — debates over public safety and rights.',
    keywords: ['crime', 'criminal', 'police', 'policing', 'prison', 'gun', 'firearm', 'bail', 'sentencing', 'death penalty', 'incarceration', 'doj', 'fbi', 'second amendment'],
  },
  {
    slug: 'climate',
    title: 'Climate & Energy',
    description: 'Carbon, oil, renewables, EVs — the policy fight over the energy transition.',
    keywords: ['climate', 'carbon', 'emissions', 'renewable', 'oil', 'fossil', 'gas', 'pipeline', 'epa', 'ev', 'electric vehicle', 'coal', 'nuclear', 'green energy', 'paris agreement'],
  },
  {
    slug: 'politics',
    title: 'Politics & Elections',
    description: 'Congress, the courts, campaigns, the White House — the fights over American power.',
    keywords: ['election', 'congress', 'senate', 'house', 'supreme court', 'biden', 'trump', 'harris', 'republican', 'democrat', 'gop', 'speaker', 'filibuster', 'gerrymander', 'impeach', 'voting'],
  },
  {
    slug: 'tech',
    title: 'Tech & AI',
    description: 'AI, social media, antitrust, encryption, privacy — debates over the digital era.',
    keywords: ['artificial intelligence', 'ai regulation', 'social media', 'tiktok', 'meta', 'facebook', 'twitter', 'antitrust', 'big tech', 'encryption', 'privacy', 'section 230', 'crypto', 'cryptocurrency'],
  },
  {
    slug: 'education',
    title: 'Education',
    description: 'Schools, student loans, curriculum, vouchers — the fights over how America learns.',
    keywords: ['education', 'school', 'student loan', 'college', 'university', 'curriculum', 'voucher', 'teacher', 'tenure', 'campus', 'fafsa', 'critical race theory'],
  },
]

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug)
}

// Build a SQL ILIKE OR clause that matches a topic against the headline column.
export function topicMatchClause(topic: Topic): string {
  return topic.keywords
    .map((kw) => `LOWER(headline) LIKE '%${kw.toLowerCase().replace(/'/g, "''")}%'`)
    .join(' OR ')
}
