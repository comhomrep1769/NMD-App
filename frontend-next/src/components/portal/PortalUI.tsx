'use client'

import { useEffect, useState } from 'react'

// ─── Status Badge ───
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  paid: { bg: '#F0FDF9', color: '#059669' },
  unpaid: { bg: '#FEF9C3', color: '#A16207' },
  accepted: { bg: '#F0FDF9', color: '#059669' },
  sent: { bg: '#EFF6FF', color: '#1D4ED8' },
  draft: { bg: '#F3F4F6', color: '#6B7280' },
  pending: { bg: '#FEF9C3', color: '#A16207' },
  reviewed: { bg: '#EFF6FF', color: '#1D4ED8' },
  scheduled: { bg: '#F5F3FF', color: '#6D28D9' },
  completed: { bg: '#F0FDF9', color: '#059669' },
  declined: { bg: '#FEF2F2', color: '#DC2626' },
  active: { bg: '#F0FDF9', color: '#059669' },
  inactive: { bg: '#F3F4F6', color: '#6B7280' },
  overdue: { bg: '#FEF2F2', color: '#DC2626' },
  cancelled: { bg: '#FEF2F2', color: '#DC2626' },
  new: { bg: '#FEF9C3', color: '#A16207' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase()
  const style = STATUS_COLORS[s] || { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '3px 10px',
      borderRadius: 100, background: style.bg, color: style.color,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

// ─── Metric Card ───
export function MetricCard({
  label, value, sub, accent
}: {
  label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB',
      borderRadius: 10, padding: '16px 18px', minWidth: 0,
      borderLeft: accent ? `3px solid ${accent}` : undefined,
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Section Header ───
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>NMD Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: sub ? 6 : 0 }}>{title}</h1>
        {sub && <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Table ───
// Below 640px, renders as stacked label/value cards instead of a cramped
// horizontally-scrolling table — a more native-feeling mobile pattern.
export function DataTable({
  headers, rows, emptyMessage = 'No records found.'
}: {
  headers: string[]
  rows: React.ReactNode[][]
  emptyMessage?: string
}) {
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (rows.length === 0) {
    return (
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
        {emptyMessage}
      </div>
    )
  }

  if (isNarrow) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {row.map((cell, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, paddingTop: 2 }}>{headers[j]}</span>
                <span style={{ fontSize: '13px', color: '#111827', textAlign: 'right', minWidth: 0 }}>{cell}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {headers.map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '11px 16px', fontSize: '13px', color: '#111827', verticalAlign: 'middle' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Loading State ───
export function LoadingCard() {
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#0F766E', margin: '0 auto 1rem', animation: 'nmdSpin 0.8s linear infinite' }} />
      <div style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</div>
      <style>{`@keyframes nmdSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Error State ───
export function ErrorCard({ message }: { message: string }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: '14px', color: '#B91C1C' }}>{message}</div>
    </div>
  )
}

// ─── Search Input ───
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'Search...'}
      style={{
        padding: '8px 14px', borderRadius: 7,
        border: '1px solid #E5E7EB', fontSize: '14px',
        outline: 'none', fontFamily: 'DM Sans, sans-serif',
        color: '#111827', background: 'white', width: 240,
        maxWidth: '100%', boxSizing: 'border-box',
      }}
    />
  )
}

// ─── Money formatter ───
export function money(val: number) {
  return `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Date formatter ───
export function fmtDate(val: string) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}