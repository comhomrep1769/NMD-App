'use client'

import { useState } from 'react'

// ─── Status Badge ───
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  paid: { bg: '#eaf7ef', color: '#1a4d28' },
  unpaid: { bg: '#fcebeb', color: '#a32d2d' },
  accepted: { bg: '#eaf7ef', color: '#1a4d28' },
  sent: { bg: '#e8f3fd', color: '#0c447c' },
  draft: { bg: '#f4f7fb', color: '#5a6a88' },
  pending: { bg: '#faeeda', color: '#633806' },
  reviewed: { bg: '#e8f3fd', color: '#0c447c' },
  scheduled: { bg: '#eeedfe', color: '#534ab7' },
  completed: { bg: '#eaf7ef', color: '#1a4d28' },
  declined: { bg: '#fcebeb', color: '#a32d2d' },
  active: { bg: '#eaf7ef', color: '#1a4d28' },
  inactive: { bg: '#f4f7fb', color: '#5a6a88' },
  overdue: { bg: '#fcebeb', color: '#a32d2d' },
  cancelled: { bg: '#fcebeb', color: '#a32d2d' },
  new: { bg: '#faeeda', color: '#633806' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase()
  const style = STATUS_COLORS[s] || { bg: '#f4f7fb', color: '#5a6a88' }
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px',
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
      background: 'white', border: '1.5px solid #dde4ef',
      borderRadius: 12, padding: '1.25rem',
      borderTop: accent ? `3px solid ${accent}` : undefined,
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#8494b0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#8494b0', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Section Header ───
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>NMD Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: sub ? 6 : 0 }}>{title}</h1>
        {sub && <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Table ───
export function DataTable({
  headers, rows, emptyMessage = 'No records found.'
}: {
  headers: string[]
  rows: React.ReactNode[][]
  emptyMessage?: string
}) {
  return (
    <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f7fb', borderBottom: '1px solid #dde4ef' }}>
              {headers.map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#8494b0', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: '3rem', textAlign: 'center', color: '#8494b0', fontSize: '0.875rem' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #f0f4f9' : 'none' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: '#0e1117', verticalAlign: 'middle' }}>
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
    <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #dde4ef', borderTopColor: '#1f6132', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: '0.875rem', color: '#8494b0' }}>Loading...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Error State ───
export function ErrorCard({ message }: { message: string }) {
  return (
    <div style={{ background: '#fcebeb', border: '1.5px solid #f09595', borderRadius: 14, padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: '0.875rem', color: '#a32d2d' }}>{message}</div>
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
        padding: '0.55rem 0.85rem', borderRadius: 8,
        border: '1.5px solid #dde4ef', fontSize: '0.875rem',
        outline: 'none', fontFamily: 'DM Sans, sans-serif',
        color: '#0e1117', background: '#f4f7fb', width: 240,
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
