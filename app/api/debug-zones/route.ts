import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)
  const national = await sql`
    SELECT id, headline, geographic_scope, publish_status, track,
           data->>'sourceType' as source_type, created_at
    FROM debates
    WHERE publish_status='published' AND track!='satire'
      AND geographic_scope NOT IN ('local','state','international')
      AND data->>'sourceType' IS DISTINCT FROM 'library'
      AND data->>'sourceType' IS DISTINCT FROM 'user_submitted'
    ORDER BY created_at DESC LIMIT 5
  `
  return NextResponse.json({ national, dbUrl: process.env.DATABASE_URL?.slice(0, 40) + '...' })
}
