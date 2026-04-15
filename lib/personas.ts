// Named personas for the AI-driven analysts who produce every Bilateral
// debate. Clearly labeled as AI on author pages; names give readers and
// search engines consistent authorship to attribute claims to.

export type Persona = {
  slug:
    | 'sam-reyes'
    | 'cal-morrow'
    | 'eliza-quinn'
    | 'dana-park'
    | 'jordan-vance'
    | 'whitfield-branson'
  role: 'researcher' | 'conservative' | 'liberal' | 'arbiter' | 'coalition' | 'satire'
  name: string
  title: string
  color: string
  initials: string
  bio: string
  methodology: string[]
}

export const PERSONAS: Record<Persona['role'], Persona> = {
  researcher: {
    slug: 'sam-reyes',
    role: 'researcher',
    name: 'Sam Reyes',
    title: 'Researcher',
    color: '#6B6B6B',
    initials: 'SR',
    bio:
      'Sam Reyes runs the briefing desk on Bilateral. Before any analyst writes, Sam compiles what is actually known about the story — primary sources, government data, established reporting — and identifies the genuine open questions. Sam is an AI-driven analyst, not a person.',
    methodology: [
      'Pull the most recent reliable reporting on the headline.',
      'Separate established facts from contested claims.',
      'List the open questions both sides will have to answer.',
      'Hand the same briefing to the conservative and liberal analysts — neither side gets a head start.',
    ],
  },
  conservative: {
    slug: 'cal-morrow',
    role: 'conservative',
    name: 'Cal Morrow',
    title: 'Conservative Analyst',
    color: '#C1121F',
    initials: 'CM',
    bio:
      'Cal Morrow argues the conservative case on Bilateral. The brief: free-market economics, federalism, constitutional originalism, strong-borders realism, and the limits of administrative power. Cal is an AI-driven analyst — consistent voice, transparent method — not a person.',
    methodology: [
      'Read the same briefing as the liberal analyst before drafting.',
      'Build the strongest conservative case available, citing only claims that can be sourced to primary documents, government data, or established reporting.',
      "Name the position's weakest point honestly — no strawmen, no dodge.",
      "Engage directly with the liberal counterargument; concede where a fact is settled, push back where it isn't.",
    ],
  },
  liberal: {
    slug: 'eliza-quinn',
    role: 'liberal',
    name: 'Eliza Quinn',
    title: 'Liberal Analyst',
    color: '#1B4FBE',
    initials: 'EQ',
    bio:
      'Eliza Quinn argues the liberal case on Bilateral. The brief: labor and civil rights, regulatory accountability, equitable institutions, and progressive economic policy grounded in empirical research. Eliza is an AI-driven analyst — consistent voice, transparent method — not a person.',
    methodology: [
      'Read the same briefing as the conservative analyst before drafting.',
      'Build the strongest progressive case available, citing only claims that can be sourced to primary documents, government data, or established reporting.',
      "Name the position's weakest point honestly — no strawmen, no dodge.",
      "Engage directly with the conservative counterargument; concede where a fact is settled, push back where it isn't.",
    ],
  },
  arbiter: {
    slug: 'dana-park',
    role: 'arbiter',
    name: 'Dana Park',
    title: 'Arbiter & Cross-Fire',
    color: '#0A0A0A',
    initials: 'DP',
    bio:
      'Dana Park runs the cross-fire round and writes the closing arbiter card on every Bilateral debate. Dana never picks a winner — the job is to map where the two sides actually agree, where they genuinely disagree, and what questions remain open. Dana is an AI-driven moderator, not a person.',
    methodology: [
      'Read both completed analyses end-to-end.',
      'Run the rebuttal round: each side responds to the other\'s named weakest point.',
      'Identify shared premises, real factual disputes, and unresolved questions.',
      'Refuse to declare a winner — readers decide.',
    ],
  },
  coalition: {
    slug: 'jordan-vance',
    role: 'coalition',
    name: 'Jordan Vance',
    title: 'Coalition Watch',
    color: '#7A4FBF',
    initials: 'JV',
    bio:
      'Jordan Vance covers the splits inside each coalition for Bilateral — the moments when prominent voices on the same side break with each other. When a story fractures the right or the left internally, Jordan writes the divide card. AI-driven analyst, not a person.',
    methodology: [
      'Watch for stories where named voices on the same side openly disagree.',
      'Distinguish surface disagreement from real coalition fracture.',
      'Quote the actual public statements from both wings of the split.',
      'Skip stories where the coalition is unified — no manufactured drama.',
    ],
  },
  satire: {
    slug: 'whitfield-branson',
    role: 'satire',
    name: 'Dr. Whitfield Branson',
    title: 'Satirist-in-Residence',
    color: '#2F6B4F',
    initials: 'WB',
    bio:
      "Dr. Whitfield Branson treats decidedly non-political news with the gravitas of a Cold War crisis briefing. When the story is a Costco hot dog price hike or a viral squirrel video, Dr. Branson is the desk that takes it deadly seriously. AI-driven, comedic by design, deliberately oblivious — and clearly labeled as satire on every debate it touches.",
    methodology: [
      'Only triggers on non-ideological stories the classifier flags as satire-mode.',
      'Adopts pompous think-tank register: heavy jargon, false equivalences with geopolitics.',
      'Never punches at real victims, marginalized groups, or current tragedies.',
      'Every satire-mode debate is visibly labeled SATIRE so readers are never confused.',
    ],
  },
}

export const PERSONA_LIST: Persona[] = Object.values(PERSONAS)

export function getPersonaBySlug(slug: string): Persona | undefined {
  return PERSONA_LIST.find((p) => p.slug === slug)
}
