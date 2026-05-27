'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Quote = {
  id: string; quoteNumber: number; clientName: string; clientId?: string
  serviceType: string; total: number; status: string
  convertedInvoiceId?: string | null; acceptedAt: string | null; createdAt: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
  border: '1.5px solid #dde4ef', fontSize: '0.875rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
  background: '#f4f7fb', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 500, color: '#3a4660', display: 'block', marginBottom: 4,
}
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.6)',
  zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
}
const modalBox: React.CSSProperties = {
  background: 'white', borderRadius: 16, width: '100%', maxWidth: 480,
  boxShadow: '0 20px 60px rgba(14,17,23,0.2)', overflow: 'hidden'
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ clientName: '', serviceType: '', total: '', status: 'draft' })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteQuote, setDeleteQuote] = useState<Quote | null>(null)
  const [deleting, setDeleting] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const load = () => {
    const token = getNmdToken()
    fetch(`${API}/api/quotes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setQuotes(d.quotes || []); setLoading(false) })
      .catch(() => { setError('Could not load quotes.'); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const filtered = quotes.filter(q =>
    `${q.quoteNumber} ${q.clientName} ${q.serviceType} ${q.status}`.toLowerCase().includes(search.toLowerCase())
  )

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.clientName || !form.serviceType) { setFormError('Client name and service type are required.'); return }
    setSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientName: form.clientName.trim(), serviceType: form.serviceType.trim(), total: parseFloat(form.total) || 0, status: form.status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create quote')
      setQuotes(p => [data.quote, ...p])
      setShowCreate(false)
      setForm({ clientName: '', serviceType: '', total: '', status: 'draft' })
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed to create quote') }
    setSaving(false)
  }

  const handleAccept = async (q: Quote) => {
    setActionLoading(q.id + '-accept')
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes/${q.id}/accept`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuotes(p => p.map(x => x.id === q.id ? data.quote : x))
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setActionLoading(null)
  }

  const handleDecline = async (q: Quote) => {
    setActionLoading(q.id + '-decline')
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'declined' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuotes(p => p.map(x => x.id === q.id ? data.quote : x))
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setActionLoading(null)
  }

  const handleConvert = async (q: Quote) => {
    if (!confirm(`Convert Quote #${q.quoteNumber} to an invoice?`)) return
    setActionLoading(q.id + '-convert')
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes/${q.id}/convert-to-invoice`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuotes(p => p.map(x => x.id === q.id ? { ...x, convertedInvoiceId: data.invoice.id } : x))
      alert(`Invoice #${data.invoice.invoiceNumber} created successfully.`)
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setActionLoading(null)
  }

  const handleDelete = async () => {
    if (!deleteQuote) return
    setDeleting(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes/${deleteQuote.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to delete')
      setQuotes(p => p.filter(x => x.id !== deleteQuote.id))
      setDeleteQuote(null)
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setDeleting(false)
  }

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>

      {showCreate && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Create Quote</div>
              <button onClick={() => { setShowCreate(false); setFormError('') }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>x</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>{formError}</div>}
              <div>
                <label style={labelStyle}>Client Name *</label>
                <input style={inputStyle} value={form.clientName} onChange={e => update('clientName', e.target.value)} placeholder="John Smith" required />
              </div>
              <div>
                <label style={labelStyle}>Service Type *</label>
                <input style={inputStyle} value={form.serviceType} onChange={e => update('serviceType', e.target.value)} placeholder="House Washing" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Total ($)</label>
                  <input style={inputStyle} type="number" value={form.total} onChange={e => update('total', e.target.value)} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={form.status} onChange={e => update('status', e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="sent">Send to Client</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowCreate(false); setFormError('') }} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteQuote && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: 420 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Delete Quote</div>
              <button onClick={() => setDeleteQuote(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>x</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#3a4660', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>Quote #{deleteQuote.quoteNumber}</strong> for {deleteQuote.clientName}? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteQuote(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: 'none', background: '#e74c3c', color: 'white', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="Quotes"
        sub={`${quotes.length} total quotes`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search quotes..." />
            <button onClick={() => setShowCreate(true)} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
              + Create Quote
            </button>
          </div>
        }
      />
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Quote #', 'Client', 'Service', 'Total', 'Status', 'Created', '']}
          emptyMessage="No quotes found."
          rows={filtered.map(q => [
            <span key="num" style={{ fontWeight: 700, color: '#124d83' }}>#{q.quoteNumber}</span>,
            <span key="client" style={{ fontWeight: 500 }}>{q.clientName || '—'}</span>,
            <span key="svc" style={{ color: '#5a6a88' }}>{q.serviceType || '—'}</span>,
            <span key="total" style={{ fontWeight: 600 }}>{money(q.total)}</span>,
            <StatusBadge key="status" status={q.status} />,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(q.createdAt)}</span>,
            <div key="actions" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {q.status === 'sent' && (
                <>
                  <button onClick={() => handleAccept(q)} disabled={actionLoading === q.id + '-accept'} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#e8f5e9', color: '#1f6132', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    {actionLoading === q.id + '-accept' ? '...' : 'Accept'}
                  </button>
                  <button onClick={() => handleDecline(q)} disabled={actionLoading === q.id + '-decline'} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#e74c3c', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    {actionLoading === q.id + '-decline' ? '...' : 'Decline'}
                  </button>
                </>
              )}
              {q.status === 'accepted' && !q.convertedInvoiceId && (
                <button onClick={() => handleConvert(q)} disabled={actionLoading === q.id + '-convert'} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#e8f0fe', color: '#124d83', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {actionLoading === q.id + '-convert' ? '...' : 'Convert to Invoice'}
                </button>
              )}
              {q.convertedInvoiceId && (
                <span style={{ fontSize: '0.75rem', color: '#1f6132', fontWeight: 600 }}>Invoiced</span>
              )}
              <button onClick={() => setDeleteQuote(q)} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#e74c3c', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Delete</button>
            </div>
          ])}
        />
      )}
    </PortalShell>
  )
}
