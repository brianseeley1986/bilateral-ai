import { addJournalist } from './db'

const JOURNALISTS = [
  {
    name: 'Claudia Sahm',
    substack_url: 'https://stayathomemacro.substack.com',
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
    beats: ['economics', 'technology', 'foreign_policy', 'climate'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.90,
    former_outlet: 'Bloomberg Opinion',
    tier: 1,
  },
  {
    name: 'Josh Kraushaar',
    substack_url: 'https://joshkraushaar.substack.com',
    beats: ['politics', 'elections', 'congress'],
    geographic_focus: ['national'],
    credibility_score: 0.91,
    former_outlet: 'National Journal',
    tier: 1,
  },
  {
    name: 'Mark Joseph Stern',
    substack_url: 'https://markjosephstern.substack.com',
    beats: ['legal', 'supreme_court', 'civil_rights'],
    geographic_focus: ['national'],
    credibility_score: 0.91,
    former_outlet: 'Slate',
    tier: 1,
  },
  {
    name: 'Gary Marcus',
    substack_url: 'https://garymarcus.substack.com',
    beats: ['technology', 'ai', 'science'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.90,
    former_outlet: 'NYU',
    tier: 1,
  },
  {
    name: 'Dara Lind',
    substack_url: 'https://daralind.substack.com',
    beats: ['immigration', 'border', 'asylum'],
    geographic_focus: ['national'],
    credibility_score: 0.92,
    former_outlet: 'ProPublica',
    tier: 1,
  },
  {
    name: 'David Roberts',
    substack_url: 'https://www.volts.wtf',
    beats: ['climate', 'energy', 'environment', 'policy'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.91,
    former_outlet: 'Vox',
    tier: 1,
  },
  {
    name: 'Jennifer Berkshire',
    substack_url: 'https://jenniferberkshire.substack.com',
    beats: ['education', 'school_choice', 'teachers'],
    geographic_focus: ['national'],
    credibility_score: 0.89,
    former_outlet: 'Have You Heard Podcast',
    tier: 1,
  },
  {
    name: 'Platformer',
    substack_url: 'https://www.platformer.news',
    beats: ['technology', 'social_media', 'ai', 'big_tech'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.93,
    former_outlet: 'The Verge',
    tier: 1,
  },
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
    rss_url: 'https://wusfnews.wusf.usf.edu/feed',
    beats: ['local', 'education', 'healthcare', 'environment'],
    geographic_focus: ['florida', 'tampa', 'local'],
    credibility_score: 0.87,
    former_outlet: 'WUSF Public Media',
    tier: 1,
    notes: 'Tampa Bay NPR affiliate',
  },
  {
    name: 'Joe Weisenthal',
    substack_url: 'https://joeweisenthal.substack.com',
    beats: ['economics', 'markets', 'finance'],
    geographic_focus: ['national', 'international'],
    credibility_score: 0.92,
    former_outlet: 'Bloomberg',
    tier: 1,
  },
  {
    name: 'Raffi Melkonian',
    substack_url: 'https://raffimelkonian.substack.com',
    beats: ['legal', 'supreme_court', 'appellate'],
    geographic_focus: ['national'],
    credibility_score: 0.90,
    former_outlet: 'Wright Close & Barger',
    tier: 1,
  },
  {
    name: 'Tradeoffs',
    substack_url: 'https://tradeoffs.substack.com',
    beats: ['healthcare', 'health_policy', 'insurance', 'medicaid'],
    geographic_focus: ['national'],
    credibility_score: 0.91,
    former_outlet: 'Kaiser Health News',
    tier: 1,
  },
  {
    name: 'The Marshall Project',
    substack_url: 'https://themarshallproject.substack.com',
    beats: ['criminal_justice', 'prisons', 'policing', 'legal'],
    geographic_focus: ['national'],
    credibility_score: 0.94,
    former_outlet: 'Marshall Project',
    tier: 1,
  },
]

export async function seedJournalistRegistry(): Promise<number> {
  let seeded = 0
  for (const j of JOURNALISTS) {
    try {
      await addJournalist(j)
      seeded++
    } catch (err: any) {
      if (!err?.message?.includes('duplicate')) {
        console.error(`Failed to seed ${j.name}:`, err)
      }
    }
  }
  console.log(`Seeded ${seeded} journalists`)
  return seeded
}
