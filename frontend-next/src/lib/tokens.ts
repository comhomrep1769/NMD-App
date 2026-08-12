import type { CSSProperties } from 'react'

// Single source of truth for portal styling.
// Before this file, 19 pages each declared their own inputStyle constant and
// the values had drifted: three different input font sizes, ten different
// border radii. Import from here instead of redeclaring.

export const color = {
  brand: '#0B5D52',
  brandHover: '#094A42',
  brandTint: '#E7F0ED',
  accent: '#A85A2C',
  accentTint: '#FAF0E9',

  page: '#F5F3EF',
  surface: '#FFFFFF',
  surfaceMuted: '#FAF9F6',

  border: '#DDD8CF',
  borderStrong: '#C7C1B5',

  text: '#0C1614',
  textSecondary: '#4A4741',
  textMuted: '#6E6A62',

  danger: '#A32D2D',
  dangerTint: '#FCEBEB',
  success: '#0B5D52',
  successTint: '#E7F0ED',
  warning: '#8A5A0B',
  warningTint: '#FBF1DF',
} as const

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

export const font = {
  family: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  caption: '0.75rem',
  small: '0.8125rem',
  // 16px. Anything smaller makes iOS Safari zoom the page when a field is
  // focused, which shifts the whole layout mid-typing.
  body: '1rem',
  h3: '1.125rem',
  h2: '1.375rem',
  h1: '1.75rem',
} as const

export const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '0.6rem 0.85rem',
  borderRadius: radius.md,
  border: `1.5px solid ${color.border}`,
  fontSize: font.body,
  fontFamily: font.family,
  color: color.text,
  background: color.surface,
  outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: font.small,
  fontWeight: 600,
  color: color.textSecondary,
  marginBottom: space.xs + 2,
}

export const cardStyle: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.md,
  padding: space.xl,
}

const buttonBase: CSSProperties = {
  minHeight: 44,
  padding: '0.6rem 1.15rem',
  borderRadius: radius.md,
  fontFamily: font.family,
  fontSize: font.small,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid transparent',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: space.sm,
}

export const buttonPrimary: CSSProperties = {
  ...buttonBase,
  background: color.brand,
  color: '#FFFFFF',
}

export const buttonSecondary: CSSProperties = {
  ...buttonBase,
  background: color.surface,
  color: color.textSecondary,
  borderColor: color.border,
}

export const buttonDanger: CSSProperties = {
  ...buttonBase,
  background: color.surface,
  color: color.danger,
  borderColor: '#F0C6C6',
}

export function badgeStyle(tone: 'brand' | 'accent' | 'danger' | 'warning' | 'neutral' = 'neutral'): CSSProperties {
  const map = {
    brand: [color.brandTint, color.brand],
    accent: [color.accentTint, '#8A4A24'],
    danger: [color.dangerTint, color.danger],
    warning: [color.warningTint, color.warning],
    neutral: ['#EFEDE7', color.textSecondary],
  } as const
  const [background, textColor] = map[tone]
  return {
    display: 'inline-block',
    background,
    color: textColor,
    fontSize: font.caption,
    fontWeight: 600,
    padding: '0.25rem 0.6rem',
    borderRadius: radius.sm,
  }
}