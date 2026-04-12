import { NextResponse } from 'next/server'
import { getAllDebates } from '@/lib/store'

export const dynamic = 'force-dynamic'

function firstSentence(text?: string): string {
  if (!text) return ''
  const match = text.trim().match(/^[^.!?]+[.!?]/)
  return match ? match[0].trim() : text.trim().slice(0, 160)
}

export async function GET() {
  const debates = await getAllDebates()
  const cards = debates.map((d) => ({
    id: d.id,
    headline: d.headline,
    track: d.track,
    sourceType: d.sourceType,
    geographicScope: d.geographicScope,
    createdAt: d.createdAt,
    conservativeOneLine:
      firstSentence(d.conservative?.argument) ||
      firstSentence(d.satireExchanges?.[0]?.a) ||
      '',
    liberalOneLine:
      firstSentence(d.liberal?.argument) ||
      firstSentence(d.satireExchanges?.[0]?.b) ||
      '',
    suggestedHook: d.suggestedHook,
  }))
  return NextResponse.json(cards)
}
