import Link from 'next/link'
import type { Metadata } from 'next'
import { PERSONA_LIST } from '@/lib/personas'

export const metadata: Metadata = {
  title: 'Authors — Bilateral',
  description:
    'The AI-driven analysts behind every Bilateral debate: researcher, conservative, liberal, arbiter, coalition watch, and satirist.',
  alternates: { canonical: 'https://bilateral.news/authors' },
}

export default function AuthorsIndex() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F5F0',
        padding: '24px 24px 96px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1100px',
          margin: '0 auto 56px',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#C1121F' }} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: '#0A0A0A' }}>bilateral</span>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1B4FBE' }} />
        </Link>
        <Link href="/" style={{ fontSize: 12, color: '#6B6B6B', textDecoration: 'none' }}>
          ← Back to feed
        </Link>
      </header>

      <section style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px' }}>Authors</h1>
        <p style={{ fontSize: 16, color: '#6B6B6B', margin: '0 0 32px', lineHeight: 1.5 }}>
          Every Bilateral debate is produced by a fixed cast of AI-driven analysts, each with a defined brief and method.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {PERSONA_LIST.map((p) => (
            <li key={p.slug} style={{ borderTop: '1px solid #E5E5DD', paddingTop: 18 }}>
              <Link
                href={`/authors/${p.slug}`}
                style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: '#0A0A0A' }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: p.color,
                    color: '#F5F5F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 17,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {p.initials}
                </div>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginTop: 2 }}>
                    {p.title}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
