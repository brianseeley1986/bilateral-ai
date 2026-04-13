import { runDebatePipeline } from '../lib/pipeline'
import { writeFileSync } from 'fs'

const tests = [
  {
    label: 'TEST 1 — Factional story (expect DIVIDED RIGHT)',
    headline: 'Trump DOJ Colony Ridge settlement excludes victim compensation',
  },
  {
    label: 'TEST 2 — Clean binary story (expect NO faction)',
    headline: 'Should the federal minimum wage be raised to $15 per hour?',
  },
  {
    label: 'TEST 3 — Likely DIVIDED LEFT story',
    headline: 'US vetoes UN ceasefire resolution on Gaza',
  },
]

async function runTest(label: string, headline: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(label)
  console.log(`Headline: "${headline}"`)
  console.log('='.repeat(60))

  const debate = await runDebatePipeline(headline, 'user_submitted')

  console.log(`factionAlert.detected: ${debate.factionAlert?.detected}`)
  console.log(`factionAlert.dividedSide: ${debate.factionAlert?.dividedSide ?? 'null'}`)

  if (debate.factionAlert?.detected) {
    console.log(`factionAlert.summary: ${debate.factionAlert.summary}`)
    console.log(`dominantPosition.conservative: ${debate.factionAlert.dominantPosition?.conservative ?? 'null'}`)
    console.log(`dominantPosition.liberal: ${debate.factionAlert.dominantPosition?.liberal ?? 'null'}`)

    if (debate.factionAlert.conservativeFactions?.detected) {
      const cf = debate.factionAlert.conservativeFactions
      console.log(`\n  C faction1.label: ${cf.faction1?.label}`)
      console.log(`  C faction1.position: ${cf.faction1?.position}`)
      console.log(`  C faction2.label: ${cf.faction2?.label}`)
      console.log(`  C faction2.position: ${cf.faction2?.position}`)
    }
    if (debate.factionAlert.liberalFactions?.detected) {
      const lf = debate.factionAlert.liberalFactions
      console.log(`\n  L faction1.label: ${lf.faction1?.label}`)
      console.log(`  L faction1.position: ${lf.faction1?.position}`)
      console.log(`  L faction2.label: ${lf.faction2?.label}`)
      console.log(`  L faction2.position: ${lf.faction2?.position}`)
    }

    if (debate.divideCard) {
      console.log(`\ndivideCard.introLine: ${debate.divideCard.introLine}`)
      if (debate.divideCard.conservativeDivide?.show) {
        console.log(`divideCard.C faction1.quote: ${debate.divideCard.conservativeDivide.faction1?.quote ?? 'null'}`)
        console.log(`divideCard.C faction1.speaker: ${debate.divideCard.conservativeDivide.faction1?.speaker ?? 'null'}`)
      }
      if (debate.divideCard.liberalDivide?.show) {
        console.log(`divideCard.L faction1.quote: ${debate.divideCard.liberalDivide.faction1?.quote ?? 'null'}`)
        console.log(`divideCard.L faction1.speaker: ${debate.divideCard.liberalDivide.faction1?.speaker ?? 'null'}`)
      }
    }
  }

  console.log(`\nqualityScore: ${debate.qualityScore?.overallScore} — ${debate.qualityScore?.classification}`)
  return debate
}

async function main() {
  const results: Record<string, any> = {}

  for (const t of tests) {
    try {
      const debate = await runTest(t.label, t.headline)
      results[t.label] = {
        detected: debate.factionAlert?.detected,
        dividedSide: debate.factionAlert?.dividedSide,
        quality: debate.qualityScore?.overallScore,
        classification: debate.qualityScore?.classification,
      }
    } catch (err) {
      console.error(`FAILED: ${t.label}`, err)
      results[t.label] = { error: String(err) }
    }
    // small delay between tests
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\n\n=== SUMMARY ===')
  for (const [label, result] of Object.entries(results)) {
    console.log(`${label}:`, JSON.stringify(result))
  }

  writeFileSync('/tmp/faction-test-results.json', JSON.stringify(results, null, 2))
  console.log('\nFull results → /tmp/faction-test-results.json')
}

main().catch(e => {
  console.error('[FATAL]', e)
  process.exit(1)
})
