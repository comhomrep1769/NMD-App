'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'
import Link from 'next/link'

type Commission = {
  id: string; invoiceId: string; invoiceNumber: number; clientName: string
  commissionType: string; rate: number; subtotal: number; amount: number
  tier: number; status: string; notes: string | null; createdAt: string
}

type Summary = {
  totalEarned: number; totalPending: number; totalApproved: number; totalCommissions: number
}

function money(n: number) { return `$${Number(n).toFixed(2)}` }
function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusStyle = (s: string): React.CSSProperties => {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    pending:  { color: '#7a5c00', bg: '#fff9e6', border: '#f5e6a0' },
    approved: { color: '#124d83', bg: '#e8f3fd', border: '#96c8f5' },
    paid:     { color: '#1f6132', bg: '#f0fff4', border: '#c0dd97' },
  }
  const st = map[s] || map.pending
  return { fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 100, color: st.color, background: st.bg, border: `1px solid ${st.border}` }
}

const TIER_RATES = [
  { tier: 1, rates: [{ type: 'Single Service', rate: '2.5%' }, { type: 'Package', rate: '5%' }, { type: 'Premium', rate: '7.5%' }] },
  { tier: 2, rates: [{ type: 'Single Service', rate: '3%' }, { type: 'Package', rate: '5.5%' }, { type: 'Premium', rate: '8%' }] },
  { tier: 3, rates: [{ type: 'Single Service', rate: '3.5%' }, { type: 'Package', rate: '6%' }, { type: 'Premium', rate: '8.5%' }] },
]

export default function SalesDashboardPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const API = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/sales/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setCommissions(d.commissions || []); setSummary(d.summary || null); setLoading(false) })
      .catch(() => { setError('Could not load dashboard.'); setLoading(false) })
  }, [])

  return (
    <PortalShell requiredRole="sales">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Sales Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Dashboard</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Track your commissions, earnings, and performance.</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && summary && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Earned', value: money(summary.totalEarned), color: '#1f6132', note: 'paid out' },
              { label: 'Approved', value: money(summary.totalApproved), color: '#124d83', note: 'awaiting payment' },
              { label: 'Pending', value: money(summary.totalPending), color: '#e67e22', note: 'under review' },
              { label: 'Total Commissions', value: String(summary.totalCommissions), color: '#0e1117', note: 'all time' },
            ].map(c => (
              <div key={c.label} style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '1.25rem', borderTop: `3px solid ${c.color}` }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: '0.78rem', color: '#8494b0', marginTop: 4 }}>{c.note}</div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/sales/call-scripts" style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
              📞 Call Scripts
            </Link>
            <Link href="/sales/commissions" style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#3a4660', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
              💰 All Commissions
            </Link>
          </div>

          {/* Commission tier reference */}
          <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117', marginBottom: '1rem' }}>Your Commission Tiers</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {TIER_RATES.map(t => (
                <div key={t.tier} style={{ background: '#f4f7fb', borderRadius: 10, padding: '1rem', border: '1px solid #dde4ef' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0e1117', marginBottom: 8 }}>Tier {t.tier}</div>
                  {t.rates.map(r => (
                    <div key={r.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#5a6a88', marginBottom: 4 }}>
                      <span>{r.type}</span>
                      <span style={{ fontWeight: 700, color: '#1f6132' }}>{r.rate}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: '0.78rem', color: '#8494b0', lineHeight: 1.6 }}>
              Base pay: $17/hr · Commission paid on collected subtotal only (excludes tax, fees, discounts, refunds) · When commission exceeds hourly, paid as performance bonus
            </div>
          </div>

          {/* Recent commissions */}
          <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117', marginBottom: '1rem' }}>Recent Commissions</div>
            {commissions.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8494b0', padding: '2rem', fontSize: '0.875rem' }}>No commissions yet. Close your first deal to get started!</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #dde4ef' }}>
                      {['Invoice', 'Client', 'Type', 'Rate', 'Subtotal', 'Commission', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.slice(0, 10).map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f0f4f9' }}>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#124d83' }}>#{c.invoiceNumber}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#0e1117' }}>{c.clientName}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#5a6a88', textTransform: 'capitalize' }}>{c.commissionType.replace('_', ' ')}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#1f6132', fontWeight: 600 }}>{(c.rate * 100).toFixed(1)}%</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#5a6a88' }}>{money(c.subtotal)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#1f6132' }}>{money(c.amount)}</td>
                        <td style={{ padding: '0.65rem 0.75rem' }}><span style={statusStyle(c.status)}>{c.status}</span></td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PortalShell>
  )
}