'use client'
import { useState } from 'react'
import { cleanHeadline } from '@/lib/headline'
import { colors, type as T, radius, shadow } from '@/lib/design'

export interface DebateCardData {
  id: string
  headline: string
  track: string
  sourceType?: string
  geographicScope: string
  createdAt: string
  publishStatus: string
  conservativeOneLine?: string
  liberalOneLine?: string
  conservativeFeedHook?: string | null
  liberalFeedHook?: string | null
  shortHeadline?: string | null
  suggestedHook?: string
  overallScore?: number | null
}

interface Props {
  debate: DebateCardData
  hideBadge?: boolean
  showScore?: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function badgeFor(d: DebateCardData): { label: string; bg: string; color: string } | null {
  if (d.sourceType === 'library') return { label: 'LIBRARY', bg: colors.accent.library, color: colors.accent.libraryInk }
  if (d.track === 'satire') return { label: 'SATIRE', bg: colors.accent.satire, color: colors.accent.satireInk }
  if (d.geographicScope === 'local') return { label: 'LOCAL', bg: '#DBEAFE', color: '#1E3A5F' }
  if (d.geographicScope === 'state') return { label: 'STATE', bg: '#E0F2FE', color: '#0C4A6E' }
  if (d.geographicScope === 'international') return { label: 'WORLD', bg: '#F3F4F6', color: '#374151' }
  return { label: 'NATIONAL', bg: colors.accent.successBg, color: colors.accent.success }
}


export function DebateCard({ debate, hideBadge, showScore }: Props) {
  const [copied, setCopied] = useState(false)
  const isSatire = debate.track === 'satire'
  const badge = hideBadge ? null : badgeFor(debate)

  const cLine = debate.conservativeFeedHook || debate.conservativeOneLine || ''
  const lLine = debate.liberalFeedHook || debate.liberalOneLine || ''

  const timestamp =
    showScore && debate.overallScore != null
      ? `${debate.overallScore.toFixed(1)} · ${timeAgo(debate.createdAt)}`
      : timeAgo(debate.createdAt)

  const conservativeLabel = isSatire ? 'Side A' : 'Conservative'
  const liberalLabel = isSatire ? 'Side B' : 'Liberal'

  const onOpen = () => {
    window.location.href = `/debate/${debate.id}`
  }

  return (
    <article
      onClick={onOpen}
      style={{
        background: colors.surface,
        borderRadius: radius.lg,
        boxShadow: shadow.card,
        overflow: 'hidden',
        cursor: 'pointer',
        marginBottom: 16,
        transition: 'box-shadow 150ms ease, transform 150ms ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = shadow.lift
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = shadow.card
      }}
    >
      <div style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {badge && (
            <span
              style={{
                fontSize: T.size.micro,
                fontWeight: T.weight.semibold,
                padding: '3px 9px',
                borderRadius: radius.sm,
                background: badge.bg,
                color: badge.color,
                letterSpacing: T.tracking.wide,
              }}
            >
              {badge.label}
            </span>
          )}
          <span style={{ fontSize: T.size.micro, color: colors.neutral[400] }}>{timestamp}</span>
        </div>

        <h3
          style={{
            fontFamily: T.display,
            fontWeight: T.weight.medium,
            fontSize: 22,
            lineHeight: T.leading.snug,
            letterSpacing: T.tracking.tight,
            color: colors.ink,
            margin: 0,
            marginBottom: debate.suggestedHook ? 10 : 16,
          }}
        >
          {cleanHeadline(debate.headline)}
        </h3>

        {debate.suggestedHook && (
          <p
            style={{
              fontSize: T.size.small,
              color: colors.neutral[500],
              fontStyle: 'italic',
              lineHeight: T.leading.relaxed,
              margin: 0,
              marginBottom: 16,
            }}
          >
            {debate.suggestedHook}
          </p>
        )}

        {(cLine || lLine) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                background: isSatire ? colors.neutral[50] : colors.conservativeWash,
                borderRadius: radius.md,
                padding: '12px 14px',
                minHeight: 72,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: T.weight.bold,
                  color: isSatire ? colors.neutral[600] : colors.conservative,
                  textTransform: 'uppercase',
                  letterSpacing: T.tracking.wider,
                  marginBottom: 6,
                }}
              >
                {conservativeLabel}
              </div>
              <div style={{ fontSize: T.size.small, lineHeight: T.leading.normal, color: colors.neutral[700] }}>
                {cLine || '—'}
              </div>
            </div>
            <div
              style={{
                background: isSatire ? colors.neutral[50] : colors.liberalWash,
                borderRadius: radius.md,
                padding: '12px 14px',
                minHeight: 72,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: T.weight.bold,
                  color: isSatire ? colors.neutral[600] : colors.liberal,
                  textTransform: 'uppercase',
                  letterSpacing: T.tracking.wider,
                  marginBottom: 6,
                }}
              >
                {liberalLabel}
              </div>
              <div style={{ fontSize: T.size.small, lineHeight: T.leading.normal, color: colors.neutral[700] }}>
                {lLine || '—'}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: T.size.micro,
            color: colors.neutral[500],
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard
                .writeText(
                  `https://bilateral.news/debate/${debate.id}?h=${encodeURIComponent(debate.headline)}`,
                )
                .then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                })
                .catch(() => {})
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: T.size.micro,
              color: colors.neutral[500],
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: T.tracking.wide,
              textTransform: 'uppercase',
              fontWeight: T.weight.semibold,
            }}
          >
            {copied ? 'Copied' : 'Share'}
          </button>
          <span style={{ color: colors.ink, fontWeight: T.weight.semibold, letterSpacing: T.tracking.wide, textTransform: 'uppercase' }}>
            Read the debate →
          </span>
        </div>
      </div>
    </article>
  )
}
