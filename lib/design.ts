/**
 * Bilateral design tokens.
 * The one place to edit colors, type scale, spacing, radii.
 * Import from components with: `import { tokens } from '@/lib/design'`.
 */

export const colors = {
  ink: '#0A0A0A',
  paper: '#F5F5F0',
  surface: '#FFFFFF',

  conservative: '#C1121F',
  conservativeWash: '#FFF0F0',
  conservativeInk: '#7F1D1D',

  liberal: '#1B4FBE',
  liberalWash: '#F0F4FF',
  liberalInk: '#1E3A5F',

  neutral: {
    50: '#FAFAF8',
    100: '#ECECE6',
    200: '#DCDCD6',
    300: '#C4C4BE',
    400: '#757571',
    500: '#6B6B6B',
    600: '#3A3A3A',
    700: '#1F1F1F',
  },

  accent: {
    satire: '#FEF3C7',
    satireInk: '#92400E',
    library: '#F0F4FF',
    libraryInk: '#1E3A8A',
    success: '#166534',
    successBg: '#F0FDF4',
  },

  line: '#E0E0DC',
  lineSoft: '#EBEBE6',
} as const

export const type = {
  display: 'var(--font-serif)',
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  size: {
    hero: 48,
    display: 36,
    title: 24,
    headline: 20,
    body: 16,
    small: 13,
    micro: 11,
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  leading: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.65,
  },
  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.05em',
    wider: '0.12em',
  },
} as const

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const

export const shadow = {
  none: 'none',
  card: '0 1px 2px rgba(10,10,10,0.04), 0 1px 1px rgba(10,10,10,0.03)',
  lift: '0 4px 12px rgba(10,10,10,0.06), 0 2px 4px rgba(10,10,10,0.04)',
  hero: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
} as const

export const dark = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceLight: '#1C1C1C',
  border: '#2A2A2A',
  text: '#F5F5F0',
  textMuted: '#999999',
  textDim: '#666666',
  glowRed: 'rgba(193,18,31,0.15)',
  glowBlue: 'rgba(27,79,190,0.15)',
  glowRedStrong: 'rgba(193,18,31,0.3)',
  glowBlueStrong: 'rgba(27,79,190,0.3)',
} as const

export const tokens = { colors, type, space, radius, shadow, dark }
