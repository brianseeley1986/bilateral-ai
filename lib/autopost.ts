import type { CampaignPackage } from '@/types/debate'

export const AUTO_POST_ENABLED = false

const g = globalThis as unknown as { __bilateralAutoPostToggle?: boolean }
if (g.__bilateralAutoPostToggle === undefined) g.__bilateralAutoPostToggle = false

export function getAutoPostToggle(): boolean {
  return g.__bilateralAutoPostToggle!
}

export function setAutoPostToggle(val: boolean): void {
  g.__bilateralAutoPostToggle = val
}

export interface QueueResult {
  queued: boolean
  timing?: string
  reason?: string
}

export async function queueCampaign(
  campaign: CampaignPackage,
  debateId: string
): Promise<QueueResult> {
  if (AUTO_POST_ENABLED || campaign.autoPost) {
    console.log('AUTO-POST QUEUED:', {
      debateId,
      timing: campaign.timing,
      hook: campaign.hook,
      platforms: Object.keys(campaign.posts),
    })
    return { queued: true, timing: campaign.timing }
  }
  return { queued: false, reason: 'auto-post disabled' }
}

export async function postToX(text: string): Promise<void> {
  console.log('POST TO X:', text)
}

export async function postToLinkedIn(text: string): Promise<void> {
  console.log('POST TO LINKEDIN:', text)
}

export async function postToReddit(subreddit: string, text: string): Promise<void> {
  console.log('POST TO REDDIT:', subreddit, text)
}

export async function postToFacebook(text: string): Promise<void> {
  console.log('POST TO FACEBOOK:', text)
}

export async function postToInstagram(caption: string): Promise<void> {
  console.log('POST TO INSTAGRAM:', caption)
}
