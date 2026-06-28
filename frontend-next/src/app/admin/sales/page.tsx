'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard, MetricCard, DataTable } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Commission = {
  id: string; salesRepId: string; salesRepName: string
  invoiceId: string; invoiceNumber: number; clientName: string
  commissionType: string; rate: number; subtotal: number; amount: number
  tier: number; status: string; notes: string | null; createdAt: string
}

type Rep = {
  id: string; display_name: string; email: string
  total_commissions: number; total_paid: number; total_pending: number; total_approved: number
}

type Invoice = { id: string; invoiceNumber: number; clientName: string; total: number; status: string }

function money(n: number) { return `$${Number(n || 0).toFixed(2)}` }
function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TIER_RATES: Record<number, Record<string, number>> = {
  1: { one_time: 0.025, package: 0.05, premium: 0.075 },
  2: { one_time: 0.03,  package: 0.055, premium: 0.08 },
  3: { one_time: 0.035, package: 0.06,  premium: 0.085 },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.9rem', borderRadius: 8,
  border: '1.5px solid #E5E7EB', fontSize: '0.875rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', color: '#111827', background: '#fff', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4,
}

const filterTabStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.35rem 0.85rem', borderRadius: 20,
  border: `1.5px solid ${active ? '#0F766E' : '#E5E7EB'}`,
  background: active ? '#F0FDF9' : 'white',
  color: active ? '#0F766E' : '#6B7280',
  fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
})

const statusColors: Record<string, { color: string; bg: string }> = {
  pending:  { color: '#92400E', bg: '#FEF9C3' },
  approved: { color: '#1D4ED8', bg: '#EFF6FF' },
  paid:     { color: '#059669', bg: '#F0FDF9' },
}

export default function AdminSalesPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [reps, setReps] = useState<Rep[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'commissions' | 'reps' | 'add'>('commissions')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Add commission form
  const [form, setForm] = useState({ salesRepId: '', invoiceId: '', commissionType: 'one_time', tier: '1', subtotal: '', notes: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const load = async () => {
    const token = getNmdToken()
    try {
      const [commRes, repsRes, invRes] = await Promise.all([
        fetch(`${API}/api/sales/commissions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/sales/reps`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const [commData, repsData, invData] = await Promise.all([commRes.json(), repsRes.json(), invRes.json()])
      setCommissions(commData.commissions || [])
      setReps(repsData.reps || [])
      setInvoices((invData.invoices || []).filter((i: any) => i.status === 'paid'))
    } catch { setError('Could not load data.') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (commission: Commission, status: string) => {
    setUpdatingId(commission.id)
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/sales/commissions/${commission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCommissions(p => p.map(c => c.id === commission.id ? data.commission : c))
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setUpdatingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this commission?')) return
    const token = getNmdToken()
    try {
      await fetch(`${API}/api/sales/commissions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setCommissions(p => p.filter(c => c.id !== id))
    } catch { alert('Failed to delete') }
  }

  const computedRate = () => {
    const tier = parseInt(form.tier)
    return TIER_RATES[tier]?.[form.commissionType] || 0
  }

  const computedAmount = () => {
    const sub = parseFloat(form.subtotal) || 0
    return (sub * computedRate()).toFixed(2)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!form.salesRepId || !form.invoiceId || !form.subtotal) { setAddError('All fields are required.'); return }
    setAdding(true)
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/sales/commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          salesRepId: form.salesRepId,
          invoiceId: form.invoiceId,
          commissionType: form.commissionType,
          rate: computedRate(),
          subtotal: parseFloat(form.subtotal),
          tier: parseInt(form.tier),
          notes: form.notes || null,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCommissions(p => [data.commission, ...p])
      setForm({ salesRepId: '', invoiceId: '', commissionType: 'one_time', tier: '1', subtotal: '', notes: '' })
      setTab('commissions')
    } catch (err) { setAddError(err instanceof Error ? err.message : 'Failed') }
    setAdding(false)
  }

  const filtered = statusFilter === 'all' ? commissions : commissions.filter(c => c.status === statusFilter)
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0)
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0)
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0)

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>NMD Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>Sales &amp; Commissions</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{commissions.length} total commissions</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '1.5rem' }}>
            <MetricCard label="Paid Out" value={money(totalPaid)} accent="#0F766E" />
            <MetricCard label="Approved" value={money(totalApproved)} accent="#1D4ED8" />
            <MetricCard label="Pending" value={money(totalPending)} accent="#F59E0B" />
            <MetricCard label="Sales Reps" value={reps.length} accent="#6D28D9" />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', borderBottom: '1.5px solid #E5E7EB', paddingBottom: 0 }}>
            {[{ key: 'commissions', label: 'Commissions' }, { key: 'reps', label: 'Sales Reps' }, { key: 'add', label: '+ Add Commission' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                style={{ padding: '0.6rem 1.1rem', borderRadius: '8px 8px 0 0', border: `1.5px solid ${tab === t.key ? '#E5E7EB' : 'transparent'}`, borderBottom: tab === t.key ? '1.5px solid white' : '1.5px solid transparent', background: tab === t.key ? 'white' : 'transparent', color: tab === t.key ? '#0F766E' : '#6B7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginBottom: -1.5 }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Commissions tab */}
          {tab === 'commissions' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['all', 'pending', 'approved', 'paid'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={filterTabStyle(statusFilter === s)}>
                    {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? commissions.length : commissions.filter(c => c.status === s).length})
                  </button>
                ))}
              </div>

              <DataTable
                headers={['Rep', 'Invoice', 'Client', 'Type', 'Subtotal', 'Tier / Rate', 'Amount', 'Status', 'Date', '']}
                emptyMessage="No commissions found."
                rows={filtered.map(c => [
                  <span key="rep" style={{ fontWeight: 600, color: '#111827' }}>{c.salesRepName}</span>,
                  <span key="inv" style={{ fontWeight: 700, color: '#1D4ED8' }}>#{c.invoiceNumber}</span>,
                  <span key="client" style={{ color: '#6B7280' }}>
                    {c.clientName}
                    {c.notes && <span title={c.notes} style={{ marginLeft: 5, cursor: 'help' }}>📝</span>}
                  </span>,
                  <span key="type" style={{ color: '#6B7280', textTransform: 'capitalize' }}>{c.commissionType.replace('_', ' ')}</span>,
                  <span key="subtotal" style={{ color: '#6B7280' }}>{money(c.subtotal)}</span>,
                  <span key="tier" style={{ color: '#0F766E', fontWeight: 600 }}>T{c.tier} · {(c.rate * 100).toFixed(1)}%</span>,
                  <span key="amount" style={{ fontWeight: 700, color: '#059669' }}>{money(c.amount)}</span>,
                  <select key="status" value={c.status} onChange={e => handleStatusChange(c, e.target.value)} disabled={updatingId === c.id}
                    style={{
                      padding: '3px 8px', borderRadius: 6, border: 'none', fontSize: '0.78rem', fontWeight: 700,
                      fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                      background: statusColors[c.status]?.bg || statusColors.pending.bg,
                      color: statusColors[c.status]?.color || statusColors.pending.color,
                    }}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                  </select>,
                  <span key="date" style={{ color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</span>,
                  <button key="delete" onClick={() => handleDelete(c.id)}
                    style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Delete
                  </button>,
                ])}
              />
            </>
          )}

          {/* Reps tab */}
          {tab === 'reps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reps.length === 0 ? (
                <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👤</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#111827', marginBottom: 8 }}>No sales reps yet</div>
                  <div style={{ fontSize: '0.875rem' }}>Create a user with the "sales" role to add a sales rep.</div>
                </div>
              ) : reps.map(rep => (
                <div key={rep.id} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F766E', color: 'white', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {rep.display_name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{rep.display_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{rep.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Paid', value: money(rep.total_paid), color: '#059669' },
                        { label: 'Approved', value: money(rep.total_approved), color: '#1D4ED8' },
                        { label: 'Pending', value: money(rep.total_pending), color: '#92400E' },
                        { label: 'Total', value: money(rep.total_commissions), color: '#0F766E' },
                      ].map(m => (
                        <div key={m.label} style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '1rem', color: m.color }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add commission tab */}
          {tab === 'add' && (
            <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '1.5rem', maxWidth: 560 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '1.25rem' }}>Add Commission Entry</div>
              {addError && <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#B91C1C' }}>{addError}</div>}
              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Sales Rep *</label>
                  <select style={inputStyle} value={form.salesRepId} onChange={e => setForm(p => ({ ...p, salesRepId: e.target.value }))} required>
                    <option value="">Select rep...</option>
                    {reps.map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Paid Invoice *</label>
                  <select style={inputStyle} value={form.invoiceId} onChange={e => { const inv = invoices.find(i => i.id === e.target.value); setForm(p => ({ ...p, invoiceId: e.target.value, subtotal: inv ? String(inv.total) : p.subtotal })) }} required>
                    <option value="">Select invoice...</option>
                    {invoices.map(i => <option key={i.id} value={i.id}>#{i.invoiceNumber} — {i.clientName} ({money(i.total)})</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Commission Type *</label>
                    <select style={inputStyle} value={form.commissionType} onChange={e => setForm(p => ({ ...p, commissionType: e.target.value }))}>
                      <option value="one_time">One-time (Single Service)</option>
                      <option value="package">Package</option>
                      <option value="premium">Premium</option>
                      <option value="residual">Residual</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tier *</label>
                    <select style={inputStyle} value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))}>
                      <option value="1">Tier 1</option>
                      <option value="2">Tier 2</option>
                      <option value="3">Tier 3</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Collected Subtotal ($) *</label>
                  <input style={inputStyle} type="number" value={form.subtotal} onChange={e => setForm(p => ({ ...p, subtotal: e.target.value }))} placeholder="0.00" min="0" step="0.01" required />
                </div>
                <div style={{ background: '#F0FDF9', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#059669' }}>
                  Rate: <strong>{(computedRate() * 100).toFixed(1)}%</strong> · Commission amount: <strong>{money(parseFloat(computedAmount()))}</strong>
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <input style={inputStyle} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." />
                </div>
                <button type="submit" disabled={adding}
                  style={{ padding: '0.75rem', borderRadius: 8, border: 'none', background: adding ? '#E5E7EB' : '#0F766E', color: adding ? '#9CA3AF' : 'white', fontWeight: 700, fontSize: '0.9rem', cursor: adding ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {adding ? 'Adding...' : 'Add Commission'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </PortalShell>
  )
}