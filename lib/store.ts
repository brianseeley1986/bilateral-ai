import {
  saveDebate as dbSave,
  getDebate as dbGet,
  getRecentDebates as dbGetRecent,
  hasRecentHeadline as dbHasRecent,
  initDb,
} from './db'
import type { DebateOutput } from '@/types/debate'

let initialized = false
let initPromise: Promise<void> | null = null

async function ensureInit() {
  if (initialized) return
  if (!initPromise) {
    initPromise = initDb().then(() => {
      initialized = true
    })
  }
  await initPromise
}

export async function saveDebate(debate: DebateOutput): Promise<void> {
  await ensureInit()
  await dbSave(debate)
}

export async function getDebate(id: string): Promise<DebateOutput | undefined> {
  await ensureInit()
  const result = await dbGet(id)
  return result || undefined
}

export async function getRecentDebates(limit: number = 20): Promise<DebateOutput[]> {
  await ensureInit()
  return dbGetRecent(limit)
}

export async function getAllDebates(): Promise<DebateOutput[]> {
  await ensureInit()
  return dbGetRecent(1000)
}

export async function hasRecentDebate(
  headline: string,
  withinMs = 24 * 60 * 60 * 1000
): Promise<boolean> {
  await ensureInit()
  const hours = Math.max(1, Math.round(withinMs / (60 * 60 * 1000)))
  return dbHasRecent(headline, hours)
}
