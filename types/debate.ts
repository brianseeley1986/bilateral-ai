export type EvidenceTag = 'hist' | 'data' | 'prec' | 'econ'
export type Track = 'serious' | 'local' | 'satire'
export type GeoScope = 'local' | 'state' | 'national' | 'international'
export type PublishStatus = 'published' | 'review' | 'held'

export interface Evidence {
  tag: EvidenceTag
  text: string
}

export interface Position {
  argument: string
  evidence: Evidence[]
  weakestPoint: string
}

export interface Rebuttal {
  conservative: string
  liberal: string
}

export interface Verdict {
  agreements: string[]
  conflicts: string[]
  openQuestions: string[]
}

export interface ContextBrief {
  whatHappened: string
  whyItMatters: string
  keyFacts: string[]
}

export interface TimelineEvent {
  year: string
  text: string
}

export interface LineByLineExchange {
  claim: string
  c: string
  l: string
  cRebuttal: string
  lClose: string
}

export interface SatireExchange {
  claim: string
  a: string
  b: string
  aRebuttal: string
  bRebuttal: string
}

export type CampaignStatus = 'pending' | 'approved' | 'posted' | 'skipped'

export interface CampaignPackage {
  hook: string
  posts: {
    xA: string
    xB: string
    xThread: string[]
    linkedin: string
    facebook: string
    reddit: string
    instagram: string
  }
  targeting: {
    subreddits: string[]
    xAccountTypes: string[]
    facebookGroups: string[]
    localFocus: string | null
  }
  influencerNote: string
  timing: string
  abVariants: {
    hookA: string
    hookB: string
  }
  hashtags: string[]
  status: CampaignStatus
  autoPost: boolean
  approvedAt?: string
  postedAt?: string
}

export interface QualityScore {
  scores: {
    argumentSpecificity: number
    evidenceQuality: number
    genuineTension: number
    intellectualHonesty: number
    depthBeyondHeadlines: number
  }
  overallScore: number
  classification: 'PUBLISH' | 'REVIEW' | 'HOLD'
  weakestDimension: string
  scoringNotes: string
  regenerationSuggestion?: string
}

export interface DebateOutput {
  id: string
  headline: string
  createdAt: string
  track: Track
  geographicScope: GeoScope
  suggestedHook: string
  context: ContextBrief
  timeline: TimelineEvent[]
  conservative?: Position
  liberal?: Position
  rebuttal?: Rebuttal
  verdict?: Verdict
  exchanges?: LineByLineExchange[]
  satireExchanges?: SatireExchange[]
  satireCloser?: string
  sourceType?: 'user_submitted' | 'trending' | 'rss'
  sources: string[]
  campaign?: CampaignPackage
  qualityScore?: QualityScore
  publishStatus?: PublishStatus
}
