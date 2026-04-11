import { NextResponse } from 'next/server'
import { getAllDebates } from '@/lib/store'

export async function GET() {
  const debates = getAllDebates().filter((d) => d.qualityScore)
  const total = debates.length

  if (total === 0) {
    return NextResponse.json({
      totalScored: 0,
      publishRate: 0,
      reviewRate: 0,
      holdRate: 0,
      averageScore: 0,
      averageByDimension: {
        argumentSpecificity: 0,
        evidenceQuality: 0,
        genuineTension: 0,
        intellectualHonesty: 0,
        depthBeyondHeadlines: 0,
      },
      lowestPerformingDimension: null,
    })
  }

  let publish = 0
  let review = 0
  let hold = 0
  let sumOverall = 0
  const dimSums = {
    argumentSpecificity: 0,
    evidenceQuality: 0,
    genuineTension: 0,
    intellectualHonesty: 0,
    depthBeyondHeadlines: 0,
  }

  for (const d of debates) {
    const q = d.qualityScore!
    if (q.classification === 'PUBLISH') publish++
    else if (q.classification === 'REVIEW') review++
    else hold++
    sumOverall += q.overallScore
    dimSums.argumentSpecificity += q.scores.argumentSpecificity
    dimSums.evidenceQuality += q.scores.evidenceQuality
    dimSums.genuineTension += q.scores.genuineTension
    dimSums.intellectualHonesty += q.scores.intellectualHonesty
    dimSums.depthBeyondHeadlines += q.scores.depthBeyondHeadlines
  }

  const averageByDimension = {
    argumentSpecificity: +(dimSums.argumentSpecificity / total).toFixed(2),
    evidenceQuality: +(dimSums.evidenceQuality / total).toFixed(2),
    genuineTension: +(dimSums.genuineTension / total).toFixed(2),
    intellectualHonesty: +(dimSums.intellectualHonesty / total).toFixed(2),
    depthBeyondHeadlines: +(dimSums.depthBeyondHeadlines / total).toFixed(2),
  }

  const lowestPerformingDimension = Object.entries(averageByDimension).sort(
    (a, b) => a[1] - b[1]
  )[0][0]

  return NextResponse.json({
    totalScored: total,
    publishRate: +((publish / total) * 100).toFixed(1),
    reviewRate: +((review / total) * 100).toFixed(1),
    holdRate: +((hold / total) * 100).toFixed(1),
    averageScore: +(sumOverall / total).toFixed(2),
    averageByDimension,
    lowestPerformingDimension,
  })
}
