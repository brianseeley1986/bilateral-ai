// Quick test — run via: node --experimental-vm-modules scripts/test-debate.mjs
// Uses ts-node/esm via tsx

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const headline = 'Trump DOJ Colony Ridge settlement excludes victim compensation'

const code = `
import { runDebatePipeline } from './lib/pipeline'

const headline = '${headline}'
console.log('[TEST] Running pipeline...')

runDebatePipeline(headline, 'user_submitted').then((debate) => {
  console.log('\\n=== RESEARCH: conservativePositions.dominantArgument ===')
  console.log(debate.conservative?.argument?.slice(0, 200) || '(none)')

  // We need the raw research — but pipeline returns DebateOutput not research
  // Log what we can from the debate output
  console.log('\\n=== CONSERVATIVE: opening (first 2 sentences) ===')
  const arg = debate.conservative?.argument || ''
  const sentences = arg.match(/[^.!?]+[.!?]+/g) || []
  console.log(sentences.slice(0, 2).join(' '))

  console.log('\\n=== CONSERVATIVE: weakestPoint ===')
  console.log(debate.conservative?.weakestPoint || '(none)')

  console.log('\\n=== ARBITER: verdict summary ===')
  console.log(JSON.stringify(debate.verdict, null, 2))

  console.log('\\n=== QUALITY SCORE ===')
  console.log(JSON.stringify(debate.qualityScore, null, 2))

  console.log('\\n=== EXCHANGES (first exchange) ===')
  console.log(JSON.stringify(debate.exchanges?.[0], null, 2))

  writeFileSync('/tmp/test-debate-output.json', JSON.stringify(debate, null, 2))
  console.log('\\n[TEST] Full output saved to /tmp/test-debate-output.json')
  process.exit(0)
}).catch((err) => {
  console.error('[TEST] FAILED:', err)
  process.exit(1)
})
`

writeFileSync('/tmp/test-debate-runner.ts', code)

try {
  execSync('npx tsx /tmp/test-debate-runner.ts', {
    cwd: '/Users/brian/bilateral-ai',
    stdio: 'inherit',
    env: { ...process.env },
    timeout: 300000,
  })
} catch (e) {
  process.exit(1)
}
