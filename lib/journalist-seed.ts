import { addJournalist } from './db'

const JOURNALISTS = [
  // ── Economics & Finance ──
  {
    name: 'Claudia Sahm',
    substack_url: 'https://stayathomemacro.substack.com',
    rss_url: 'https://stayathomemacro.substack.com/feed',
    beats: ['economics', 'fed', 'monetary_policy'],
    geographic_focus: ['national'],
    credibility_score: 0.94,
    former_outlet: 'Federal Reserve',
    tier: 1,
    notes: 'Former Fed economist, creator of Sahm Rule',
  },
  {
    name: 'Noah Smith',
    substack_url: 'https://noahpinion.substack.com',
    rss_url: 'https://noahpinion.substack.com/feed',
    beats: ['economics', 'technology', 'foreign_policy', 'climate'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.90,
    former_outlet: 'Bloomberg Opinion',
    tier: 1,
  },
  {
    name: 'Matt Yglesias',
    substack_url: 'https://www.slowboring.com',
    rss_url: 'https://www.slowboring.com/feed',
    beats: ['politics', 'economics', 'housing', 'immigration', 'policy'],
    geographic_focus: ['national'],
    credibility_score: 0.90,
    former_outlet: 'Vox',
    tier: 1,
  },
  {
    name: 'Joe Weisenthal',
    substack_url: 'https://joeweisenthal.substack.com',
    beats: ['economics', 'markets', 'finance'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.92,
    former_outlet: 'Bloomberg',
    tier: 1,
    notes: 'No working RSS — Substack feed returns 404',
  },
  // ── Politics & Elections ──
  {
    name: 'Josh Kraushaar',
    substack_url: 'https://joshkraushaar.substack.com',
    rss_url: 'https://joshkraushaar.substack.com/feed',
    beats: ['politics', 'elections', 'congress'],
    geographic_focus: ['national'],
    credibility_score: 0.91,
    former_outlet: 'National Journal',
    tier: 1,
  },
  {
    name: 'Heather Cox Richardson',
    substack_url: 'https://heathercoxrichardson.substack.com',
    rss_url: 'https://heathercoxrichardson.substack.com/feed',
    beats: ['politics', 'history', 'elections', 'democracy'],
    geographic_focus: ['national'],
    credibility_score: 0.91,
    former_outlet: 'Boston College',
    tier: 1,
    notes: 'Historian, 250k+ Substack subscribers',
  },
  {
    name: 'Tangle News',
    substack_url: 'https://www.readtangle.com',
    rss_url: 'https://www.readtangle.com/feed',
    beats: ['politics', 'elections', 'policy'],
    geographic_focus: ['national'],
    credibility_score: 0.92,
    tier: 1,
    notes: 'Explicitly nonpartisan — summarizes left and right takes. Perfect Bilateral alignment.',
  },
  // ── Legal & Supreme Court ──
  {
    name: 'Mark Joseph Stern',
    substack_url: 'https://markjosephstern.substack.com',
    beats: ['legal', 'supreme_court', 'civil_rights'],
    geographic_focus: ['national'],
    credibility_score: 0.91,
    former_outlet: 'Slate',
    tier: 1,
    notes: 'No working RSS',
  },
  {
    name: 'Raffi Melkonian',
    substack_url: 'https://raffimelkonian.substack.com',
    beats: ['legal', 'supreme_court', 'appellate'],
    geographic_focus: ['national'],
    credibility_score: 0.90,
    former_outlet: 'Wright Close & Barger',
    tier: 1,
    notes: 'No working RSS',
  },
  // ── Technology & AI ──
  {
    name: 'Platformer',
    substack_url: 'https://www.platformer.news',
    rss_url: 'https://www.platformer.news/feed',
    beats: ['technology', 'social_media', 'ai', 'big_tech'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.93,
    former_outlet: 'The Verge',
    tier: 1,
  },
  {
    name: 'Gary Marcus',
    substack_url: 'https://garymarcus.substack.com',
    rss_url: 'https://garymarcus.substack.com/feed',
    beats: ['technology', 'ai', 'science'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.90,
    former_outlet: 'NYU',
    tier: 1,
  },
  // ── Immigration ──
  {
    name: 'Dara Lind',
    substack_url: 'https://daralind.substack.com',
    rss_url: 'https://daralind.substack.com/feed',
    beats: ['immigration', 'border', 'asylum'],
    geographic_focus: ['national'],
    credibility_score: 0.92,
    former_outlet: 'ProPublica',
    tier: 1,
  },
  // ── Climate & Energy ──
  {
    name: 'David Roberts',
    substack_url: 'https://www.volts.wtf',
    rss_url: 'https://www.volts.wtf/feed',
    beats: ['climate', 'energy', 'environment', 'policy'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.91,
    former_outlet: 'Vox',
    tier: 1,
  },
  // ── Education ──
  {
    name: 'Jennifer Berkshire',
    substack_url: 'https://jenniferberkshire.substack.com',
    beats: ['education', 'school_choice', 'teachers'],
    geographic_focus: ['national'],
    credibility_score: 0.89,
    former_outlet: 'Have You Heard Podcast',
    tier: 1,
    notes: 'No working RSS',
  },
  // ── Healthcare ──
  {
    name: 'Tradeoffs',
    substack_url: 'https://tradeoffs.substack.com',
    rss_url: 'https://tradeoffs.substack.com/feed',
    beats: ['healthcare', 'health_policy', 'insurance', 'medicaid'],
    geographic_focus: ['national'],
    credibility_score: 0.91,
    former_outlet: 'Kaiser Health News',
    tier: 1,
  },
  // ── Criminal Justice ──
  {
    name: 'The Marshall Project',
    substack_url: 'https://themarshallproject.substack.com',
    beats: ['criminal_justice', 'prisons', 'policing', 'legal'],
    geographic_focus: ['national'],
    credibility_score: 0.94,
    former_outlet: 'Marshall Project',
    tier: 1,
    notes: 'No working RSS from Substack',
  },
  // ── Investigative / Wire ──
  {
    name: 'ProPublica',
    rss_url: 'https://feeds.propublica.org/propublica/main',
    beats: ['criminal_justice', 'healthcare', 'politics', 'environment', 'financial'],
    geographic_focus: ['national'],
    credibility_score: 0.95,
    tier: 1,
    notes: 'Nonprofit investigative journalism, Pulitzer winners',
  },
  {
    name: 'The Intercept',
    rss_url: 'https://theintercept.com/feed/?rss',
    beats: ['national_security', 'criminal_justice', 'politics', 'environment'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.87,
    tier: 1,
    notes: 'Investigative, left-leaning but original reporting with primary sources',
  },
  {
    name: 'Axios',
    rss_url: 'https://www.axios.com/feeds/feed.rss',
    beats: ['politics', 'technology', 'economics', 'healthcare', 'national_security'],
    geographic_focus: ['national'],
    credibility_score: 0.89,
    tier: 1,
    notes: 'Smart brevity format, broad beat coverage',
  },
  // ── Ideological Balance ──
  {
    name: 'Reason',
    rss_url: 'https://reason.com/feed/',
    beats: ['politics', 'economics', 'legal', 'technology', 'civil_liberties'],
    geographic_focus: ['national'],
    credibility_score: 0.87,
    tier: 1,
    notes: 'Libertarian — covers stories neither left nor right mainstream touches',
  },
  {
    name: 'The Dispatch',
    rss_url: 'https://thedispatch.com/feed/',
    beats: ['politics', 'foreign_policy', 'elections', 'conservative'],
    geographic_focus: ['national'],
    credibility_score: 0.90,
    former_outlet: 'Weekly Standard',
    tier: 1,
    notes: 'Conservative but rigorous, good for intellectually honest conservative perspective',
  },
  // ── Underrepresented Perspectives ──
  {
    name: 'The 19th',
    rss_url: 'https://19thnews.org/feed/',
    beats: ['gender', 'politics', 'healthcare', 'education', 'elections'],
    geographic_focus: ['national'],
    credibility_score: 0.88,
    tier: 1,
    notes: 'Nonprofit newsroom covering gender and politics',
  },
  // ── State & Local Policy ──
  {
    name: 'Stateline',
    rss_url: 'https://stateline.org/feed/',
    beats: ['local', 'politics', 'healthcare', 'education', 'criminal_justice'],
    geographic_focus: ['national', 'local'],
    credibility_score: 0.90,
    tier: 1,
    notes: 'Pew Charitable Trusts state policy reporting — local stories with national dimensions',
  },
  // ── Florida ──
  {
    name: 'Florida Phoenix',
    rss_url: 'https://floridaphoenix.com/feed/',
    beats: ['politics', 'education', 'healthcare', 'environment', 'local'],
    geographic_focus: ['florida', 'local'],
    credibility_score: 0.88,
    former_outlet: 'Florida Phoenix',
    tier: 1,
    notes: 'Florida nonprofit newsroom',
  },
  {
    name: 'WUSF News',
    beats: ['local', 'education', 'healthcare', 'environment'],
    geographic_focus: ['florida', 'tampa', 'local'],
    credibility_score: 0.87,
    former_outlet: 'WUSF Public Media',
    tier: 1,
    notes: 'No working RSS — Tampa Bay NPR affiliate',
  },
]

export async function seedJournalistRegistry(): Promise<number> {
  let seeded = 0
  for (const j of JOURNALISTS) {
    try {
      await addJournalist(j)
      seeded++
    } catch (err: any) {
      console.error(`Failed to seed ${j.name}:`, err?.message?.slice(0, 80))
    }
  }
  console.log(`Seeded/updated ${seeded} journalists`)
  return seeded
}
