'use client'
import { colors, dark } from '@/lib/design'

export type PerspectiveType = 'neutral' | 'conservative' | 'liberal'

interface PerspectivePanelProps {
  type: PerspectiveType
  headline: string
  /** Neutral: whatHappened context. Con/Lib: previewLine or feedHook */
  summary: string
  /** Longer supporting text — neutral: whyItMatters, con/lib: argument snippet */
  detail?: string | null
  /** Category badge text */
  category?: string
  /** e.g. "2h ago" */
  timeAgo?: string
  isActive: boolean
}

export function PerspectivePanel({
  type,
  headline,
  summary,
  detail,
  category,
  timeAgo,
  isActive,
}: PerspectivePanelProps) {
  const config = {
    neutral: {
      bg: dark.bg,
      accentColor: '#FFFFFF',
      label: null,
      labelBg: 'transparent',
      borderGlow: 'none',
    },
    conservative: {
      bg: dark.surface,
      accentColor: colors.conservative,
      label: 'CONSERVATIVE',
      labelBg: 'rgba(193,18,31,0.15)',
      borderGlow: `inset 0 0 60px ${dark.glowRed}, 0 0 30px ${dark.glowRed}`,
    },
    liberal: {
      bg: dark.surface,
      accentColor: colors.liberal,
      label: 'LIBERAL',
      labelBg: 'rgba(27,79,190,0.15)',
      borderGlow: `inset 0 0 60px ${dark.glowBlue}, 0 0 30px ${dark.glowBlue}`,
    },
  }[type]

  return (
    <div
      style={{
        flex: '0 0 100%',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 28px',
        boxSizing: 'border-box',
        background: config.bg,
        boxShadow: config.borderGlow,
        transition: 'opacity 200ms ease',
        opacity: isActive ? 1 : 0.6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Perspective label for con/lib */}
      {config.label && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: config.accentColor,
            background: config.labelBg,
            padding: '5px 14px',
            borderRadius: 999,
            marginBottom: 20,
            textTransform: 'uppercase',
          }}
        >
          {config.label}
        </div>
      )}

      {/* Category + time — neutral only */}
      {type === 'neutral' && (category || timeAgo) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
          }}
        >
          {category && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: dark.textMuted,
                background: dark.surfaceLight,
                padding: '4px 10px',
                borderRadius: 6,
              }}
            >
              {category}
            </span>
          )}
          {timeAgo && (
            <span style={{ fontSize: 11, color: dark.textDim }}>
              {timeAgo}
            </span>
          )}
        </div>
      )}

      {/* Headline — largest on neutral, smaller on perspectives */}
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: type === 'neutral' ? 30 : 26,
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: '-0.025em',
          color: type === 'neutral' ? '#FFFFFF' : config.accentColor,
          textAlign: 'center',
          margin: 0,
          marginBottom: type === 'neutral' ? 20 : 16,
          maxWidth: 520,
        }}
      >
        {type === 'neutral' ? headline : summary}
      </h2>

      {/* Summary / supporting text */}
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: dark.textMuted,
          textAlign: 'center',
          margin: 0,
          maxWidth: 440,
        }}
      >
        {type === 'neutral' ? summary : (detail || '')}
      </p>

      {/* Directional cues — neutral only */}
      {type === 'neutral' && (
        <>
          {/* Left cue — Liberal */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 60,
              background: `linear-gradient(to right, ${dark.glowBlueStrong}, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: colors.liberal,
                opacity: 0.7,
              }}
            >
              ← Liberal
            </span>
          </div>

          {/* Right cue — Conservative */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 60,
              background: `linear-gradient(to left, ${dark.glowRedStrong}, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                writingMode: 'vertical-rl',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: colors.conservative,
                opacity: 0.7,
              }}
            >
              Conservative →
            </span>
          </div>
        </>
      )}
    </div>
  )
}
