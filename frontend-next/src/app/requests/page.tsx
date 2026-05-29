'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Request = {
  id: string; firstName: string; lastName: string
  email: string; phone: string; serviceType: string
  address: string; status: string; createdAt: string
  preferredDate: string | null; preferredTime: string | null
  notes: string | null; photoDataUrl: string | null; photoNote: string | null
  waiverSignature: string | null; waiverSignedAt: string | null; waiverAccepted: boolean | null
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

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'requests' | 'signature-log'>('requests')
  const [quoteRequest, setQuoteRequest] = useState<Request | null>(null)
  const [quoteForm, setQuoteForm] = useState({ total: '', status: 'sent' })
  const [quoteSaving, setQuoteSaving] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const [viewPhoto, setViewPhoto] = useState<Request | null>(null)
  const [viewSignature, setViewSignature] = useState<Request | null>(null)

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

  const signedRequests = requests.filter(r => r.waiverSignature && r.waiverAccepted)

  const pending = requests.filter(r => r.status === 'pending' || r.status === 'new').length

  // Check if waiverSignature is a canvas PNG (base64 image) or plain text
  const isSignatureImage = (sig: string | null) =>
    sig ? sig.startsWith('data:image') : false

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

      {/* Photo Lightbox */}
      {viewPhoto && (
        <div
          onClick={() => setViewPhoto(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                {viewPhoto.firstName} {viewPhoto.lastName} — {viewPhoto.serviceType}
              </div>
              <button onClick={() => setViewPhoto(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <img
              src={viewPhoto.photoDataUrl!}
              alt="Client uploaded photo"
              style={{ width: '100%', borderRadius: 12, maxHeight: '70vh', objectFit: 'contain', background: '#111' }}
            />
            {viewPhoto.photoNote && (
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.75rem 1rem', color: 'white', fontSize: '0.85rem' }}>
                <strong>Client note:</strong> {viewPhoto.photoNote}
              </div>
            )}
            <div style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center' }}>Click anywhere outside to close</div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {viewSignature && (
        <div style={{ ...modalOverlay, zIndex: 200 }} onClick={() => setViewSignature(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 520,
            boxShadow: '0 20px 60px rgba(14,17,23,0.25)', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1f6132, #124d83)' }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'white' }}>Signed Agreement</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Service Agreement & Liability Waiver</div>
              </div>
              <button onClick={() => setViewSignature(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem' }}>Close</button>
            </div>

            {/* Client info */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fbff', borderBottom: '1px solid #dde4ef', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#8494b0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</div>
                <div style={{ fontWeight: 600, color: '#0e1117', fontSize: '0.9rem' }}>{viewSignature.firstName} {viewSignature.lastName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#8494b0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service</div>
                <div style={{ fontWeight: 500, color: '#3a4660', fontSize: '0.85rem' }}>{viewSignature.serviceType}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#8494b0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
                <div style={{ color: '#3a4660', fontSize: '0.85rem' }}>{viewSignature.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#8494b0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signed At</div>
                <div style={{ color: '#3a4660', fontSize: '0.85rem' }}>
                  {viewSignature.waiverSignedAt
                    ? new Date(viewSignature.waiverSignedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                    : fmtDate(viewSignature.createdAt)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#8494b0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</div>
                <div style={{ color: '#3a4660', fontSize: '0.85rem' }}>{viewSignature.address || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#8494b0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agreement Status</div>
                <div style={{ color: '#1a7a3c', fontWeight: 600, fontSize: '0.85rem' }}>✓ Accepted</div>
              </div>
            </div>

            {/* Signature */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#3a4660', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Client Signature
              </div>
              {isSignatureImage(viewSignature.waiverSignature) ? (
                <div style={{ border: '1.5px solid #dde4ef', borderRadius: 10, padding: '0.75rem', background: '#fafbfc' }}>
                  <img
                    src={viewSignature.waiverSignature!}
                    alt="Client signature"
                    style={{ width: '100%', maxHeight: 160, objectFit: 'contain', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ border: '1.5px solid #dde4ef', borderRadius: 10, padding: '1rem 1.25rem', background: '#fafbfc' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#0e1117', fontStyle: 'italic' }}>
                    {viewSignature.waiverSignature}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#b0bfd0', marginTop: 4 }}>Text signature (pre-canvas)</div>
                </div>
              )}
              <div style={{ marginTop: 10, padding: '0.65rem 0.85rem', background: '#eaf7ef', borderRadius: 8, border: '1px solid #c2edcf', fontSize: '0.78rem', color: '#1a4d28' }}>
                This signature was collected as part of the NMD Pressure Washing Service Agreement & Liability Waiver, which includes acknowledgment that estimates and quotes are not guaranteed final prices.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Quote Modal */}
      {quoteRequest && (
        <div style={modalOverlay}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(14,17,23,0.2)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Create Quote</div>
              <button onClick={() => setQuoteRequest(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>×</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: '1rem 1.5rem', background: '#f8fbff', borderBottom: '1px solid #dde4ef' }}>
                <div style={{ fontSize: '0.8rem', color: '#5a6a88', marginBottom: 4 }}>Creating quote for</div>
                <div style={{ fontWeight: 700, color: '#0e1117', fontFamily: 'Syne, sans-serif' }}>{quoteRequest.firstName} {quoteRequest.lastName}</div>
                <div style={{ fontSize: '0.82rem', color: '#5a6a88', marginTop: 2 }}>{quoteRequest.serviceType} · {quoteRequest.address}</div>
                {quoteRequest.preferredDate && (
                  <div style={{ fontSize: '0.78rem', color: '#8494b0', marginTop: 2 }}>Preferred: {fmtDate(quoteRequest.preferredDate)}{quoteRequest.preferredTime ? ` · ${quoteRequest.preferredTime}` : ''}</div>
                )}
                {quoteRequest.notes && (
                  <div style={{ fontSize: '0.78rem', color: '#5a6a88', marginTop: 6, background: 'white', borderRadius: 6, padding: '0.5rem 0.75rem', border: '1px solid #dde4ef' }}>
                    <strong>Notes:</strong> {quoteRequest.notes}
                  </div>
                )}
              </div>

              {quoteRequest.photoDataUrl && (
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #dde4ef' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#3a4660', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Photo</div>
                  <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                    <img
                      src={quoteRequest.photoDataUrl}
                      alt="Client photo"
                      style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, border: '1px solid #dde4ef', cursor: 'zoom-in' }}
                      onClick={() => setViewPhoto(quoteRequest)}
                    />
                    <div
                      onClick={() => setViewPhoto(quoteRequest)}
                      style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 6, cursor: 'zoom-in' }}
                    >
                      View Full
                    </div>
                  </div>
                  {quoteRequest.photoNote && (
                    <div style={{ fontSize: '0.78rem', color: '#5a6a88', marginTop: 6, fontStyle: 'italic' }}>"{quoteRequest.photoNote}"</div>
                  )}
                </div>
              )}

              <form onSubmit={handleCreateQuote} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {quoteError && <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>{quoteError}</div>}
                <div>
                  <label style={labelStyle}>Quote Total ($) *</label>
                  <input
                    style={inputStyle} type="number" value={quoteForm.total}
                    onChange={e => setQuoteForm(p => ({ ...p, total: e.target.value }))}
                    placeholder="0.00" min="0" step="0.01" required autoFocus
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
        </div>
      )}

      <SectionHeader
        title="Service Requests"
        sub={`${requests.length} total · ${pending} pending review · ${signedRequests.length} signed`}
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search requests..." />}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '2px solid #dde4ef' }}>
        {([
          { key: 'requests', label: `Requests (${requests.length})` },
          { key: 'signature-log', label: `Signature Log (${signedRequests.length})` },
        ] as { key: typeof activeTab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.65rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.875rem', color: activeTab === tab.key ? '#1f6132' : '#8494b0',
              borderBottom: `2px solid ${activeTab === tab.key ? '#1f6132' : 'transparent'}`,
              marginBottom: -2, transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {/* Requests Tab */}
      {!loading && !error && activeTab === 'requests' && (
        <DataTable
          headers={['Client', 'Service', 'Contact', 'Preferred Date', 'Status', 'Received', '']}
          emptyMessage="No service requests yet."
          rows={filtered.map(r => [
            <div key="name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {r.photoDataUrl && (
                <img
                  src={r.photoDataUrl}
                  alt="preview"
                  onClick={() => setViewPhoto(r)}
                  style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1.5px solid #dde4ef', cursor: 'zoom-in', flexShrink: 0 }}
                />
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</div>
                {r.waiverAccepted && (
                  <div style={{ fontSize: '0.7rem', color: '#1a7a3c', fontWeight: 500 }}>✓ Waiver signed</div>
                )}
              </div>
            </div>,
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
              {r.waiverSignature && (
                <button
                  onClick={() => setViewSignature(r)}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: '1px solid #dde4ef', background: 'white', color: '#3a4660', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Signature
                </button>
              )}
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

      {/* Signature Log Tab */}
      {!loading && !error && activeTab === 'signature-log' && (
        <div>
          {signedRequests.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', padding: '3rem', textAlign: 'center', color: '#8494b0', fontSize: '0.9rem' }}>
              No signed agreements yet. Signatures appear here when clients sign the waiver during estimate submission.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {signedRequests.map((r, i) => (
                <div key={r.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', overflow: 'hidden' }}>
                  {/* Row header */}
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0e1117', fontSize: '0.9rem' }}>{r.firstName} {r.lastName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#5a6a88' }}>{r.serviceType} · {r.address}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#8494b0' }}>Signed</div>
                        <div style={{ fontSize: '0.82rem', color: '#3a4660', fontWeight: 500 }}>
                          {r.waiverSignedAt
                            ? new Date(r.waiverSignedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                            : fmtDate(r.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#eaf7ef', borderRadius: 20, padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: '#1a7a3c', fontWeight: 600 }}>
                        ✓ Waiver Accepted
                      </div>
                      <button
                        onClick={() => setViewSignature(r)}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: 6, border: '1px solid #dde4ef', background: 'white', color: '#3a4660', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        View Signature
                      </button>
                    </div>
                  </div>

                  {/* Inline signature preview */}
                  <div style={{ padding: '0 1.25rem 1rem', borderTop: '1px solid #f0f3f8' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: '0.72rem', color: '#8494b0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Signature</div>
                        {isSignatureImage(r.waiverSignature) ? (
                          <div
                            style={{ border: '1px solid #dde4ef', borderRadius: 8, padding: '0.5rem', background: '#fafbfc', cursor: 'zoom-in', maxWidth: 280 }}
                            onClick={() => setViewSignature(r)}
                          >
                            <img
                              src={r.waiverSignature!}
                              alt="Signature"
                              style={{ width: '100%', maxHeight: 70, objectFit: 'contain', display: 'block' }}
                            />
                          </div>
                        ) : (
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#0e1117', fontStyle: 'italic', padding: '0.5rem 0' }}>
                            {r.waiverSignature}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: '0.72rem', color: '#8494b0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Contact</div>
                        <div style={{ fontSize: '0.82rem', color: '#3a4660' }}>{r.email || '—'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#8494b0' }}>{r.phone || '—'}</div>
                      </div>
                      <div style={{ minWidth: 100 }}>
                        <div style={{ fontSize: '0.72rem', color: '#8494b0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Request Status</div>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PortalShell>
  )
}