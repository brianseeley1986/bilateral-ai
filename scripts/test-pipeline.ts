import { runDebatePipeline } from '../lib/pipeline'
import { writeFileSync } from 'fs'

const headline = 'Trump DOJ Colony Ridge settlement excludes victim compensation'

async function main() {
  console.log('[TEST] Running pipeline for:', headline)

  const debate = await runDebatePipeline(headline, 'user_submitted')

  console.log('\n=== CONSERVATIVE: opening (first 2 sentences) ===')
  const arg = debate.conservative?.argument || ''
  const sentences = arg.match(/[^.!?]+[.!?]+/g) || []
  console.log(sentences.slice(0, 2).join(' ').trim())

  console.log('\n=== CONSERVATIVE: weakestPoint ===')
  console.log(debate.conservative?.weakestPoint || '(none)')

  console.log('\n=== FAULT LINES (from exchanges[0] context) ===')
  console.log(JSON.stringify(debate.exchanges?.[0], null, 2))

  console.log('\n=== ARBITER VERDICT ===')
  console.log(JSON.stringify(debate.verdict, null, 2))

  console.log('\n=== QUALITY SCORE ===')
  console.log(JSON.stringify(debate.qualityScore, null, 2))

  writeFileSync('/tmp/test-debate.json', JSON.stringify(debate, null, 2))
  console.log('\n[TEST] Full output → /tmp/test-debate.json')
}

main().catch((e) => {
  console.error('[TEST FAILED]', e)
  process.exit(1)
})
