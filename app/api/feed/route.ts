import { NextResponse } from 'next/server'
import { getAllDebates } from '@/lib/store'

export const dynamic = 'force-dynamic'

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
      d.conservative?.previewLine ||
      d.satireExchanges?.[0]?.a ||
      '',
    liberalOneLine:
      d.liberal?.previewLine ||
      d.satireExchanges?.[0]?.b ||
      '',
    suggestedHook: d.suggestedHook,
  }))
  return NextResponse.json(cards)
}
