'use client'
import { useState, useEffect } from 'react'
import { HeadlineInput } from '@/components/HeadlineInput'
import { SubscribeBlock } from '@/components/SubscribeBlock'
import { DebateStage } from '@/components/DebateStage'
import { dark, colors } from '@/lib/design'
import type { ZoneData, LibraryFeatured } from '@/lib/zones'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return text.slice(0, cut > 0 ? cut : max) + '...'
}

const FAULT_LINES = [
  'Immigration', 'Climate', 'Gun Rights', 'Education',
  'Healthcare', 'Taxes', 'Free Speech', 'Abortion',
  'National Security', 'Economics', 'Crime', 'Rights & Society',
]

/* ═══════════════════ MAIN ═══════════════════ */

export function HomeClient({
  zones,
}: {
  zones: ZoneData
  library?: LibraryFeatured[]
}) {
  const [urlMessage, setUrlMessage] = useState('')
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('confirmed') === 'true') setUrlMessage('Confirmed! Your first digest arrives tomorrow morning.')
    if (params.get('unsubscribed') === 'true') setUrlMessage("Unsubscribed. We\u2019ll miss you.")
  }, [])

  const allDebates = [...zones.national, ...zones.international]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const heroDebates = allDebates.slice(0, Math.min(4, allDebates.length))
  const todaysDebates = allDebates.slice(1) // skip the hero debate
  const heroDebate = heroDebates[heroIndex] || heroDebates[0]

  return (
    <>
      {/* ═══════════════ DARK HERO ═══════════════ */}
      <section style={{ background: dark.bg, paddingBottom: 40 }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px',
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.conservative }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF' }}>bilateral</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.liberal }} />
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/debates" style={{ fontSize: 12, color: dark.textMuted, textDecoration: 'none', fontWeight: 500 }}>Debates</a>
            <a href="/about" style={{ fontSize: 12, color: dark.textMuted, textDecoration: 'none', fontWeight: 500 }}>About</a>
            <a href="/feed" style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#FFFFFF', background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)', padding: '6px 14px',
              borderRadius: 999, textDecoration: 'none',
            }}>Start the feed &rarr;</a>
          </nav>
        </header>

        {urlMessage && (
          <div style={{ maxWidth: 600, margin: '0 auto 12px', background: '#166534', border: '1px solid #22c55e', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#FFFFFF', textAlign: 'center' }}>
            {urlMessage}
          </div>
        )}

        {/* ─── SINGLE HERO DEBATE — no scroll hijack ─── */}
        {heroDebate && (
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
            <div style={{
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)',
              height: 'min(70vh, 560px)',
            }}>
              <DebateStage key={heroDebate.id} debate={heroDebate} />
            </div>

            {/* Debate switcher — dots + arrows */}
            {heroDebates.length > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 16, padding: '16px 0 0',
              }}>
                <button
                  onClick={() => setHeroIndex(Math.max(0, heroIndex - 1))}
                  disabled={heroIndex === 0}
                  style={{
                    background: 'none', border: 'none', cursor: heroIndex === 0 ? 'default' : 'pointer',
                    color: heroIndex === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
                    fontSize: 18, padding: '4px 8px',
                  }}
                >
                  &#8592;
                </button>
                <div style={{ display: 'flex', gap: 6 }}>
                  {heroDebates.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      style={{
                        width: heroIndex === i ? 20 : 6, height: 6, borderRadius: 3,
                        border: 'none', cursor: 'pointer', padding: 0,
                        background: heroIndex === i ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                        transition: 'all 200ms ease',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setHeroIndex(Math.min(heroDebates.length - 1, heroIndex + 1))}
                  disabled={heroIndex === heroDebates.length - 1}
                  style={{
                    background: 'none', border: 'none',
                    cursor: heroIndex === heroDebates.length - 1 ? 'default' : 'pointer',
                    color: heroIndex === heroDebates.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
                    fontSize: 18, padding: '4px 8px',
                  }}
                >
                  &#8594;
                </button>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '24px 20px 0' }}>
          <a href="/feed" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
            color: '#FFFFFF', background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            padding: '14px 36px', borderRadius: 999, textDecoration: 'none',
          }}>
            Continue in the full feed &rarr;
          </a>
        </div>
      </section>

      {/* ═══════════════ TRANSITION ═══════════════ */}
      <div style={{
        height: 60,
        background: 'linear-gradient(to bottom, #0A0A0A, #FFFFFF)',
      }} />

      {/* ═══════════════ LIGHT EDITORIAL ═══════════════ */}
      <section style={{ background: '#FFFFFF', padding: '0 20px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* Subscribe */}
          <div style={{ marginBottom: 48 }}>
            <SubscribeBlock />
          </div>

          {/* ─── TODAY'S DEBATES — editorial newsstand ─── */}
          {todaysDebates.length > 0 && (
            <div style={{ marginBottom: 64 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: '#0A0A0A', margin: 0 }}>
                  Today&apos;s debates
                </h2>
                <a href="/debates" style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  View all &rarr;
                </a>
              </div>
              <div style={{ height: 2, background: '#0A0A0A', marginBottom: 24 }} />

              {/* Lead story */}
              {todaysDebates[0] && (
                <a
                  href={`/debate/${todaysDebates[0].slug || todaysDebates[0].id}`}
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 32 }}
                >
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.conservative }}>
                      {(todaysDebates[0].geographicScope || 'national').toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: '#BBB' }}>&middot;</span>
                    <span style={{ fontSize: 10, color: '#BBB' }}>{timeAgo(todaysDebates[0].createdAt)}</span>
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700,
                    lineHeight: 1.2, letterSpacing: '-0.025em', color: '#0A0A0A',
                    margin: 0, marginBottom: 12,
                  }}>
                    {todaysDebates[0].headline}
                  </h3>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1, borderLeft: `3px solid ${colors.conservative}`, paddingLeft: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.conservative, marginBottom: 4 }}>Conservative</div>
                      <div style={{ fontSize: 13, lineHeight: 1.45, color: '#555' }}>
                        {truncate(todaysDebates[0].conservativeOneLine || todaysDebates[0].conservativeFeedHook || '', 100)}
                      </div>
                    </div>
                    <div style={{ flex: 1, borderLeft: `3px solid ${colors.liberal}`, paddingLeft: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.liberal, marginBottom: 4 }}>Liberal</div>
                      <div style={{ fontSize: 13, lineHeight: 1.45, color: '#555' }}>
                        {truncate(todaysDebates[0].liberalOneLine || todaysDebates[0].liberalFeedHook || '', 100)}
                      </div>
                    </div>
                  </div>
                </a>
              )}

              {/* Secondary rows */}
              <div style={{ borderTop: '1px solid #E8E8E4' }}>
                {todaysDebates.slice(1, 6).map((d) => (
                  <a
                    key={d.id}
                    href={`/debate/${d.slug || d.id}`}
                    style={{
                      display: 'flex', gap: 16, alignItems: 'flex-start',
                      textDecoration: 'none', color: 'inherit',
                      padding: '18px 0', borderBottom: '1px solid #F0F0F0',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: 80, height: 80, borderRadius: 8, flexShrink: 0,
                      background: `linear-gradient(135deg, rgba(27,79,190,0.08) 0%, #F0F0EC 40%, #F0F0EC 60%, rgba(193,18,31,0.08) 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 20, height: 2, borderRadius: 1 }}>
                        <div style={{ display: 'flex' }}>
                          <div style={{ flex: 1, height: 2, background: colors.liberal, borderRadius: '1px 0 0 1px' }} />
                          <div style={{ flex: 1, height: 2, background: colors.conservative, borderRadius: '0 1px 1px 0' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#BBB', marginBottom: 4 }}>{timeAgo(d.createdAt)}</div>
                      <div style={{
                        fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600,
                        lineHeight: 1.3, letterSpacing: '-0.01em', color: '#0A0A0A', marginBottom: 8,
                      }}>
                        {d.headline}
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {(d.conservativeOneLine || d.conservativeFeedHook) && (
                          <div style={{ flex: 1, fontSize: 11, lineHeight: 1.35, color: '#888', borderLeft: `2px solid ${colors.conservative}`, paddingLeft: 8 }}>
                            {truncate(d.conservativeOneLine || d.conservativeFeedHook || '', 60)}
                          </div>
                        )}
                        {(d.liberalOneLine || d.liberalFeedHook) && (
                          <div style={{ flex: 1, fontSize: 11, lineHeight: 1.35, color: '#888', borderLeft: `2px solid ${colors.liberal}`, paddingLeft: 8 }}>
                            {truncate(d.liberalOneLine || d.liberalFeedHook || '', 60)}
                          </div>
                        )}
                      </div>
                    </div>

                    <span style={{ fontSize: 16, color: '#CCC', flexShrink: 0, paddingTop: 28 }}>&rarr;</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ─── TWO COLUMNS: readers + fault lines ─── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 48, marginBottom: 64,
          }}>
            {/* FROM READERS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0 }}>From readers</h2>
                <a href="/debates/readers" style={{ fontSize: 11, fontWeight: 600, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>View all &rarr;</a>
              </div>
              <div style={{ height: 2, background: '#0A0A0A', marginBottom: 16 }} />
              {zones.userSubmitted.length > 0 ? (
                <div>
                  {zones.userSubmitted.slice(0, 5).map((d, i) => (
                    <a
                      key={d.id}
                      href={`/debate/${d.slug || d.id}`}
                      style={{
                        display: 'flex', alignItems: 'baseline', gap: 10,
                        textDecoration: 'none', color: '#0A0A0A',
                        padding: '13px 0',
                        borderBottom: i < 4 ? '1px solid #F0F0F0' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 12, color: '#CCC', fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 500, lineHeight: 1.35 }}>
                        {d.headline}
                      </span>
                    </a>
                  ))}
                </div>
              ) : <p style={{ fontSize: 13, color: '#999' }}>No reader submissions yet.</p>}
            </div>

            {/* FAULT LINES */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0, marginBottom: 6 }}>The Fault Lines</h2>
              <div style={{ height: 2, background: '#0A0A0A', marginBottom: 16 }} />
              <p style={{ fontSize: 13, color: '#888', margin: 0, marginBottom: 16, lineHeight: 1.5 }}>
                The recurring fractures in American politics. Pick a topic to explore.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FAULT_LINES.map((topic) => (
                  <a
                    key={topic}
                    href={`/debates?topic=${encodeURIComponent(topic.toLowerCase())}`}
                    style={{
                      fontSize: 13, fontWeight: 500, color: '#0A0A0A',
                      background: '#F8F8F5', border: '1px solid #E4E4E0',
                      borderRadius: 999, padding: '9px 18px',
                      textDecoration: 'none', transition: 'all 120ms ease',
                    }}
                  >
                    {topic}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ─── SUBMIT ─── */}
          <div id="submit" style={{ marginBottom: 56 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#0A0A0A', margin: 0, marginBottom: 6 }}>Start a debate</h3>
            <div style={{ height: 2, background: '#0A0A0A', marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: '#888', margin: 0, marginBottom: 16 }}>Drop any headline. We&apos;ll build both sides.</p>
            <HeadlineInput />
          </div>

          {/* ─── FINAL CTA ─── */}
          <div style={{
            textAlign: 'center', padding: '40px 24px',
            marginBottom: 48, background: '#0A0A0A', borderRadius: 20,
          }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Ready to see both sides?
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              Jump into the feed and explore debates that challenge your perspective.
            </div>
            <a href="/feed" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 14, fontWeight: 700, letterSpacing: '0.04em',
              color: '#0A0A0A', background: '#FFFFFF',
              padding: '14px 32px', borderRadius: 999, textDecoration: 'none',
            }}>
              Start the feed &rarr;
            </a>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #E8E8E4', paddingTop: 24, paddingBottom: 32, fontSize: 12, color: '#BBB', textAlign: 'center', lineHeight: 1.8 }}>
            bilateral.news — two sides, every debate<br />AI-powered. Editorially neutral. Intellectually honest.
          </div>
        </div>
      </section>
    </>
  )
}
