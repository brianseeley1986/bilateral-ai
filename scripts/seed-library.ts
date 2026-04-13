import { readFileSync } from 'fs'
import { resolve } from 'path'

// Minimal .env.local loader (avoids dotenv dependency)
try {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
} catch {}

import { initDb, upsertLibraryQuestion, getLibraryStats } from '../lib/db'
import { LIBRARY_QUESTIONS, LIBRARY_CATEGORIES, slugify } from '../lib/library-questions'

async function main() {
  await initDb()
  console.log(`Seeding ${LIBRARY_QUESTIONS.length} library questions...`)

  const slugSeen = new Set<string>()
  const collisions: string[] = []

  for (const q of LIBRARY_QUESTIONS) {
    let slug = slugify(q.question)
    if (slugSeen.has(slug)) {
      collisions.push(`${slug} <- ${q.question}`)
      slug = `${slug}-${q.category}`
    }
    slugSeen.add(slug)
    await upsertLibraryQuestion({
      question: q.question,
      category: q.category,
      slug,
      hook: q.hook,
      tier: q.tier,
    })
  }

  if (collisions.length) {
    console.log(`Slug collisions resolved with category suffix:`)
    collisions.forEach((c) => console.log(`  ${c}`))
  }

  const stats = await getLibraryStats()
  console.log('\nLibrary stats:', stats)

  console.log('\nPer category (from seed):')
  for (const cat of LIBRARY_CATEGORIES) {
    const count = LIBRARY_QUESTIONS.filter((q) => q.category === cat.id).length
    console.log(`  ${cat.label}: ${count}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
