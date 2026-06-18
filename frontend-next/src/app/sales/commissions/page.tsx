'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Commission = {
  id: string; invoiceId: string; invoiceNumber: number; clientName: string
  commissionType: string; rate: number; subtotal: number; amount: number
  tier: number; status: string; notes: string | null; createdAt: string
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

export default function SalesCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const API = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/sales/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setCommissions(d.commissions || []); setLoading(false) })
      .catch(() => { setError('Could not load commissions.'); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? commissions : commissions.filter(c => c.status === filter)
  const totals = {
    paid: commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0),
    approved: commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0),
    pending: commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0),
  }

  return (
    <PortalShell requiredRole="sales">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Sales Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Commissions</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Full history of your commission earnings.</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <>
          {/* Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Paid Out', value: money(totals.paid), color: '#1f6132' },
              { label: 'Approved', value: money(totals.approved), color: '#124d83' },
              { label: 'Pending', value: money(totals.pending), color: '#e67e22' },
            ].map(c => (
              <div key={c.label} style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 12, padding: '1rem', borderTop: `3px solid ${c.color}` }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'approved', 'paid'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{ padding: '0.35rem 0.85rem', borderRadius: 20, border: `1.5px solid ${filter === s ? '#124d83' : '#dde4ef'}`, background: filter === s ? '#e8f3fd' : 'white', color: filter === s ? '#124d83' : '#5a6a88', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? commissions.length : commissions.filter(c => c.status === s).length})
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8494b0', padding: '3rem', fontSize: '0.875rem' }}>No commissions found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f4f7fb', borderBottom: '1.5px solid #dde4ef' }}>
                      {['Invoice', 'Client', 'Type', 'Tier', 'Rate', 'Subtotal', 'Commission', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f0f4f9' }}>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#124d83' }}>#{c.invoiceNumber}</td>
                        <td style={{ padding: '0.65rem 1rem', color: '#0e1117' }}>{c.clientName}</td>
                        <td style={{ padding: '0.65rem 1rem', color: '#5a6a88', textTransform: 'capitalize' }}>{c.commissionType.replace('_', ' ')}</td>
                        <td style={{ padding: '0.65rem 1rem', color: '#5a6a88' }}>Tier {c.tier}</td>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: '#1f6132' }}>{(c.rate * 100).toFixed(1)}%</td>
                        <td style={{ padding: '0.65rem 1rem', color: '#5a6a88' }}>{money(c.subtotal)}</td>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#1f6132' }}>{money(c.amount)}</td>
                        <td style={{ padding: '0.65rem 1rem' }}><span style={statusStyle(c.status)}>{c.status}</span></td>
                        <td style={{ padding: '0.65rem 1rem', color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
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