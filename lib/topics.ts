// Topic clusters group debates under broad themes for SEO hub pages.
// Each topic is matched against the debate headline via case-insensitive
// keyword regex. A debate can belong to multiple topics.

export type Topic = {
  slug: string
  title: string
  description: string
  // Longer-form intro shown at the top of the topic hub page. Gives Google
  // ranking-worthy prose for the broad term and tells human readers what
  // they're looking at.
  intro: string
  // Words/phrases that, if present in the headline, mark a debate as on-topic.
  // Use word boundaries — short tokens like "ai" need exact-word matching.
  keywords: string[]
}

export const TOPICS: Topic[] = [
  {
    slug: 'economy',
    title: 'Economy',
    description: 'Inflation, jobs, trade, taxes — the live arguments shaping the American economy.',
    intro:
      'Few subjects produce sharper division than the American economy. Conservatives argue that tax cuts, deregulation, and free trade unleash growth that lifts every income tier; liberals counter that decades of those policies hollowed out the middle class and demand stronger labor protections, antitrust enforcement, and progressive taxation. Bilateral runs both cases at full depth — wages, inflation, tariffs, the Fed, the deficit — so readers can see the actual shape of the disagreement instead of the cable-news caricature.',
    keywords: ['economy', 'economic', 'inflation', 'tax', 'taxes', 'wage', 'wages', 'jobs', 'unemployment', 'tariff', 'trade', 'recession', 'fed', 'federal reserve', 'minimum wage', 'union'],
  },
  {
    slug: 'immigration',
    title: 'Immigration',
    description: 'Border, asylum, deportation, citizenship — every angle of the immigration debate.',
    intro:
      'Immigration is the policy area where elite consensus has collapsed fastest. The conservative argument centers on enforcement of existing law, border security, and the strain unauthorized migration places on labor markets and public services. The liberal argument centers on asylum obligations under U.S. and international law, the economic contribution of immigrants, and the moral cost of mass deportation. Bilateral covers the live questions — border policy, asylum eligibility, sanctuary jurisdictions, the H-1B program, citizenship pathways — without the rhetorical heat that usually swallows the substance.',
    keywords: ['immigration', 'immigrant', 'border', 'asylum', 'migrant', 'deportation', 'visa', 'green card', 'daca', 'refugee', 'ice'],
  },
  {
    slug: 'healthcare',
    title: 'Healthcare',
    description: 'Coverage, cost, care, abortion, drug pricing — the fights inside American healthcare.',
    intro:
      'Healthcare in America is the policy domain where everyone agrees something is broken and almost no one agrees on the fix. Conservatives push for market competition, price transparency, and restraint on federal spending. Liberals push for universal coverage, drug-price negotiation, and stronger consumer protection. Bilateral runs the actual mechanics: Medicare and Medicaid funding, the ACA marketplaces, abortion access after Dobbs, drug pricing reform, vaccine mandates, and the long-term fiscal pressure of an aging population.',
    keywords: ['healthcare', 'health care', 'medicare', 'medicaid', 'abortion', 'drug pricing', 'insurance', 'aca', 'affordable care', 'vaccine', 'obamacare', 'planned parenthood'],
  },
  {
    slug: 'foreign-policy',
    title: 'Foreign Policy',
    description: 'Israel, Ukraine, Russia, China, Iran — the global decisions debated at home.',
    intro:
      'American foreign policy is the rare arena where the conservative–liberal divide cuts across both parties. Realists, neoconservatives, restrainers, and progressive internationalists all argue past each other on the same questions: how to deter Russia, contain China, support or condition aid to Israel, manage Iran, navigate Taiwan. Bilateral covers each major decision with the strongest version of the case for action and the strongest case for restraint, so readers can see which assumptions actually drive the disagreement.',
    keywords: ['israel', 'gaza', 'palestine', 'ukraine', 'russia', 'china', 'iran', 'nato', 'taiwan', 'foreign aid', 'sanctions', 'military aid', 'pentagon', 'syria', 'venezuela', 'cuba', 'north korea'],
  },
  {
    slug: 'criminal-justice',
    title: 'Criminal Justice',
    description: 'Policing, prisons, sentencing, guns, bail — debates over public safety and rights.',
    intro:
      'The criminal justice debate balances two values that everyone says they support: public safety and individual rights. The conservative case emphasizes deterrence, victim protection, and the social cost of weak prosecution. The liberal case emphasizes due process, racial disparities in enforcement, and the failures of mass incarceration. Bilateral runs the live arguments — bail reform, gun control, the death penalty, sentencing guidelines, qualified immunity — without retreating to slogans on either side.',
    keywords: ['crime', 'criminal', 'police', 'policing', 'prison', 'gun', 'firearm', 'bail', 'sentencing', 'death penalty', 'incarceration', 'doj', 'fbi', 'second amendment'],
  },
  {
    slug: 'climate',
    title: 'Climate & Energy',
    description: 'Carbon, oil, renewables, EVs — the policy fight over the energy transition.',
    intro:
      "The climate debate has shifted: the question is no longer whether the climate is changing but what to do about it, how fast, and who pays. Conservatives stress energy security, grid reliability, and the economic cost of an accelerated transition. Liberals stress the physical costs of delay, the geopolitics of fossil fuel dependence, and the industrial opportunity of clean energy. Bilateral covers the policy fights — carbon pricing, EV mandates, pipeline approvals, nuclear permitting, the Inflation Reduction Act — at the level of actual mechanism.",
    keywords: ['climate', 'carbon', 'emissions', 'renewable', 'oil', 'fossil', 'gas', 'pipeline', 'epa', 'ev', 'electric vehicle', 'coal', 'nuclear', 'green energy', 'paris agreement'],
  },
  {
    slug: 'politics',
    title: 'Politics & Elections',
    description: 'Congress, the courts, campaigns, the White House — the fights over American power.',
    intro:
      "Politics is the meta-debate that contains the others — about how decisions get made, who gets to make them, and what counts as legitimate use of power. Conservatives argue for federalism, original constitutional design, and restraint on executive overreach. Liberals argue for institutional reform, voting access, and structural fixes to a system that doesn't scale to the modern country. Bilateral covers the live institutional fights: Supreme Court legitimacy, Senate procedure, election integrity, executive orders, congressional dysfunction.",
    keywords: ['election', 'congress', 'senate', 'house', 'supreme court', 'biden', 'trump', 'harris', 'republican', 'democrat', 'gop', 'speaker', 'filibuster', 'gerrymander', 'impeach', 'voting'],
  },
  {
    slug: 'tech',
    title: 'Tech & AI',
    description: 'AI, social media, antitrust, encryption, privacy — debates over the digital era.',
    intro:
      "Tech policy is where every other political debate eventually arrives. Conservatives argue against speech regulation by platforms and federal agencies, and against premature AI rules that lock in incumbents. Liberals argue for antitrust enforcement, content accountability, and aggressive guardrails on AI systems that affect employment, civil rights, and elections. Bilateral covers the actual policy mechanisms — Section 230, antitrust filings, AI executive orders, privacy law, encryption mandates, the TikTok question — without falling into either techno-optimism or moral panic.",
    keywords: ['artificial intelligence', 'ai regulation', 'social media', 'tiktok', 'meta', 'facebook', 'twitter', 'antitrust', 'big tech', 'encryption', 'privacy', 'section 230', 'crypto', 'cryptocurrency'],
  },
  {
    slug: 'education',
    title: 'Education',
    description: 'Schools, student loans, curriculum, vouchers — the fights over how America learns.',
    intro:
      "The education debate has moved from sleepy local school boards to the center of national politics. Conservatives push parental rights, school choice, curriculum transparency, and skepticism of campus orthodoxy. Liberals push public school funding, teacher pay, student loan reform, and inclusive curriculum standards. Bilateral covers the substantive fights — vouchers, FAFSA, accreditation, university admissions, K-12 curriculum standards, student debt cancellation — at the level of who actually wins and loses under each policy.",
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
