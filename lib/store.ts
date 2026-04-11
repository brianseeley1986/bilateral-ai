import type { DebateOutput } from '@/types/debate'

const g = globalThis as unknown as { __bilateralStore?: Map<string, DebateOutput> }
const store: Map<string, DebateOutput> = g.__bilateralStore ?? (g.__bilateralStore = new Map())

export function saveDebate(debate: DebateOutput) {
  store.set(debate.id, debate)
}

export function getDebate(id: string): DebateOutput | undefined {
  return store.get(id)
}

export function getAllDebates(): DebateOutput[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function hasRecentDebate(headline: string, withinMs = 24 * 60 * 60 * 1000): boolean {
  const norm = headline.trim().toLowerCase()
  const cutoff = Date.now() - withinMs
  for (const d of store.values()) {
    if (
      d.headline.trim().toLowerCase() === norm &&
      new Date(d.createdAt).getTime() > cutoff
    ) {
      return true
    }
  }
  return false
}
