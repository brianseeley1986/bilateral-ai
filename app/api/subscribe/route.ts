import { NextRequest, NextResponse } from 'next/server'
import { createSubscriber } from '@/lib/db'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { email, topics, city, region, zip, latitude, longitude } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'Select at least one topic' }, { status: 400 })
    }

    let resolvedCity = city
    let resolvedRegion = region

    if (zip && (!city || !region)) {
      try {
        const zipRes = await fetch(`https://api.zippopotam.us/us/${zip}`)
        if (zipRes.ok) {
          const zipData = await zipRes.json()
          const place = zipData.places?.[0]
          if (place) {
            resolvedCity = resolvedCity || place['place name']
            resolvedRegion = resolvedRegion || place['state']
          }
        }
      } catch {}
    }

    const { confirmationToken } = await createSubscriber({
      email,
      topics,
      city: resolvedCity,
      region: resolvedRegion,
      zip,
      latitude,
      longitude,
    })

    const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/subscribe/confirm?token=${confirmationToken}`

    await resend.emails.send({
      from: 'Bilateral News <digest@bilateral.news>',
      to: email,
      subject: 'Confirm your Bilateral digest',
      html: `
        <div style="font-family: system-ui; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">bilateral</div>
          <div style="font-size: 14px; color: #6B6B6B; margin-bottom: 32px;">Every satisfying political debate.</div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Click below to confirm your digest. You'll start receiving your personalized debate briefing tomorrow morning.
          </p>
          <a href="${confirmUrl}" style="display: inline-block; background: #0A0A0A; color: #F5F5F0; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
            Confirm my digest
          </a>
          <p style="font-size: 12px; color: #9B9B9B; margin-top: 32px;">If you didn't sign up for this, ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }
}
