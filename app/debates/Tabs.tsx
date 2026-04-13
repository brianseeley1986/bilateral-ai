'use client'
import Link from 'next/link'

export function DebatesTabs({ active }: { active: 'topic' | 'latest' }) {
  const tabStyle = (isActive: boolean) => ({
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    color: isActive ? '#0A0A0A' : '#6B6B6B',
    borderBottom: isActive ? '2px solid #0A0A0A' : '2px solid transparent',
    marginBottom: '-1px',
  })

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #E5E5DD',
        marginBottom: '32px',
      }}
    >
      <Link href="/debates" style={tabStyle(active === 'topic')}>
        By Topic
      </Link>
      <Link href="/debates/latest" style={tabStyle(active === 'latest')}>
        Latest
      </Link>
    </div>
  )
}
