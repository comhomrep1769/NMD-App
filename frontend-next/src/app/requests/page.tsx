'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Request = {
  id: string; firstName: string; lastName: string
  email: string; phone: string; serviceType: string
  address: string; status: string; createdAt: string
  preferredDate: string | null; preferredTime: string | null
  notes: string | null
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
  background: 'white', borderRadius: 16, width: '100%', maxWidth: 500,
  boxShadow: '0 20px 60px rgba(14,17,23,0.2)', overflow: 'hidden'
}

export default function RequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [quoteRequest, setQuoteRequest] = useState<Request | null>(null)
  const [quoteForm, setQuoteForm] = useState({ total: '', status: 'sent' })
  const [quoteSaving, setQuoteSaving] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [statusLoading, setStatusLoading] = useState<string | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRequests(d.requests || []); setLoading(false) })
      .catch(() => { setError('Could not load service requests.'); setLoading(false) })
  }, [])

  const filtered = requests.filter(r =>
    `${r.firstName} ${r.lastName} ${r.email} ${r.serviceType} ${r.status}`.toLowerCase().includes(search.toLowerCase())
  )

  const pending = requests.filter(r => r.status === 'pending' || r.status === 'new').length

  const openQuoteModal = (r: Request) => {
    setQuoteRequest(r)
    setQuoteForm({ total: '', status: 'sent' })
    setQuoteError('')
  }

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quoteRequest) return
    setQuoteError('')
    setQuoteSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientName: `${quoteRequest.firstName} ${quoteRequest.lastName}`.trim(),
          serviceType: quoteRequest.serviceType,
          total: parseFloat(quoteForm.total) || 0,
          status: quoteForm.status
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create quote')

      await fetch(`${API}/api/requests/${quoteRequest.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'reviewed' })
      })

      setRequests(p => p.map(r => r.id === quoteRequest.id ? { ...r, status: 'reviewed' } : r))
      setQuoteRequest(null)

      if (quoteForm.status === 'sent') {
        alert(`Quote #${data.quote.quoteNumber} created and sent to ${quoteRequest.firstName}.`)
      } else {
        alert(`Quote #${data.quote.quoteNumber} saved as draft.`)
      }
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Failed to create quote')
    }
    setQuoteSaving(false)
  }

  const handleStatusChange = async (r: Request, status: string) => {
    setStatusLoading(r.id)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/requests/${r.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update status')
      setRequests(p => p.map(x => x.id === r.id ? { ...x, status } : x))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    }
    setStatusLoading(null)
  }

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>

      {quoteRequest && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Create Quote</div>
              <button onClick={() => setQuoteRequest(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>x</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fbff', borderBottom: '1px solid #dde4ef' }}>
              <div style={{ fontSize: '0.8rem', color: '#5a6a88', marginBottom: 4 }}>Creating quote for</div>
              <div style={{ fontWeight: 700, color: '#0e1117', fontFamily: 'Syne, sans-serif' }}>{quoteRequest.firstName} {quoteRequest.lastName}</div>
              <div style={{ fontSize: '0.82rem', color: '#5a6a88', marginTop: 2 }}>{quoteRequest.serviceType} · {quoteRequest.address}</div>
              {quoteRequest.notes && <div style={{ fontSize: '0.78rem', color: '#8494b0', marginTop: 4, fontStyle: 'italic' }}>Notes: {quoteRequest.notes}</div>}
            </div>
            <form onSubmit={handleCreateQuote} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {quoteError && <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>{quoteError}</div>}
              <div>
                <label style={labelStyle}>Quote Total ($) *</label>
                <input
                  style={inputStyle} type="number" value={quoteForm.total}
                  onChange={e => setQuoteForm(p => ({ ...p, total: e.target.value }))}
                  placeholder="0.00" min="0" step="0.01" required
                />
              </div>
              <div>
                <label style={labelStyle}>Send to Client?</label>
                <select style={inputStyle} value={quoteForm.status} onChange={e => setQuoteForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="sent">Yes — Send quote to client now</option>
                  <option value="draft">No — Save as draft first</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setQuoteRequest(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button type="submit" disabled={quoteSaving} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, cursor: quoteSaving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: quoteSaving ? 0.7 : 1 }}>
                  {quoteSaving ? 'Creating...' : 'Create Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SectionHeader
        title="Service Requests"
        sub={`${requests.length} total · ${pending} pending review`}
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search requests..." />}
      />
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Client', 'Service', 'Contact', 'Preferred Date', 'Status', 'Received', '']}
          emptyMessage="No service requests yet."
          rows={filtered.map(r => [
            <span key="name" style={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</span>,
            <span key="svc" style={{ color: '#5a6a88' }}>{r.serviceType || '—'}</span>,
            <div key="contact">
              <div style={{ fontSize: '0.82rem' }}>{r.email || '—'}</div>
              <div style={{ fontSize: '0.78rem', color: '#8494b0' }}>{r.phone || '—'}</div>
            </div>,
            <span key="date" style={{ color: '#5a6a88', whiteSpace: 'nowrap' }}>
              {r.preferredDate ? fmtDate(r.preferredDate) : '—'}
              {r.preferredTime ? ` · ${r.preferredTime}` : ''}
            </span>,
            <div key="status" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StatusBadge status={r.status} />
              {statusLoading === r.id && <span style={{ fontSize: '0.75rem', color: '#8494b0' }}>...</span>}
            </div>,
            <span key="created" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</span>,
            <div key="actions" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(r.status === 'pending' || r.status === 'new') && (
                <button
                  onClick={() => openQuoteModal(r)}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Create Quote
                </button>
              )}
              {r.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(r, 'declined')}
                  disabled={statusLoading === r.id}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#e74c3c', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Decline
                </button>
              )}
              {r.status === 'reviewed' && (
                <span style={{ fontSize: '0.75rem', color: '#1f6132', fontWeight: 600 }}>Quoted</span>
              )}
            </div>
          ])}
        />
      )}
    </PortalShell>
  )
}
