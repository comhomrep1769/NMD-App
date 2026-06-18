'use client'

import { useEffect, useState, useRef } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Quote = {
  id: string; quoteNumber: number; clientName: string; clientId?: string
  serviceType: string; total: number; status: string
  convertedInvoiceId?: string | null; acceptedAt: string | null; createdAt: string
}

type ClientOption = {
  id: string
  name: string
  email: string
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

function ClientSearchDropdown({
  clients, value, onChange, onSelect, selectedClient
}: {
  clients: ClientOption[]
  value: string
  onChange: (v: string) => void
  onSelect: (c: ClientOption) => void
  selectedClient: ClientOption | null
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = clients.filter(c =>
    `${c.name} ${c.email}`.toLowerCase().includes(value.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        style={{ ...inputStyle, borderColor: selectedClient ? '#1f6132' : '#dde4ef' }}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search registered clients..."
        autoComplete="off"
      />
      {selectedClient && (
        <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#1f6132', fontWeight: 500 }}>✓ {selectedClient.email}</div>
      )}
      {!selectedClient && value && (
        <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#e67e22' }}>⚠ No client selected — quote can be saved as draft only</div>
      )}
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'white', border: '1.5px solid #dde4ef', borderRadius: 8, boxShadow: '0 8px 24px rgba(14,17,23,0.12)', maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
          {filtered.map(c => (
            <div key={c.id} onMouseDown={() => { onSelect(c); setOpen(false) }}
              style={{ padding: '0.65rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f4fa', fontSize: '0.875rem', color: '#0e1117' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f4f7fb')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <span style={{ color: '#8494b0', marginLeft: 8, fontSize: '0.78rem' }}>{c.email}</span>
            </div>
          ))}
        </div>
      )}
      {open && value && filtered.length === 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'white', border: '1.5px solid #dde4ef', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#8494b0', marginTop: 2 }}>
          No registered clients found
        </div>
      )}
    </div>
  )
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ clientName: '', serviceType: '', total: '', status: 'draft' })
  const [createClientSearch, setCreateClientSearch] = useState('')
  const [createSelectedClient, setCreateSelectedClient] = useState<ClientOption | null>(null)

  // Link & Send modal (for existing drafts with no clientId)
  const [sendQuote, setSendQuote] = useState<Quote | null>(null)
  const [sendClientSearch, setSendClientSearch] = useState('')
  const [sendSelectedClient, setSendSelectedClient] = useState<ClientOption | null>(null)
  const [sendError, setSendError] = useState('')
  const [sending, setSending] = useState(false)

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteQuote, setDeleteQuote] = useState<Quote | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [clients, setClients] = useState<ClientOption[]>([])

  const [convertQuote, setConvertQuote] = useState<Quote | null>(null)
  const [uploadFile, setUploadFile] = useState<{ name: string; dataUrl: string } | null>(null)
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const load = () => {
    const token = getNmdToken()
    fetch(`${API}/api/quotes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setQuotes(d.quotes || []); setLoading(false) })
      .catch(() => { setError('Could not load quotes.'); setLoading(false) })
  }

  const loadClients = () => {
    const token = getNmdToken()
    fetch(`${API}/api/clients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setClients((d.clients || []).map((c: any) => ({
          id: c.id,
          name: `${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''}`.trim(),
          email: c.email || ''
        })))
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    loadClients()
    setShowCreate(true)
    setCreateSelectedClient(null)
    setCreateClientSearch('')
    setFormError('')
    setForm({ clientName: '', serviceType: '', total: '', status: 'draft' })
  }

  const openSend = (q: Quote) => {
    loadClients()
    setSendQuote(q)
    setSendSelectedClient(null)
    setSendClientSearch(q.clientName || '')
    setSendError('')
  }

  const filtered = quotes.filter(q =>
    `${q.quoteNumber} ${q.clientName} ${q.serviceType} ${q.status}`.toLowerCase().includes(search.toLowerCase())
  )

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.clientName || !form.serviceType) { setFormError('Client name and service type are required.'); return }
    if (form.status === 'sent' && !createSelectedClient) {
      setFormError('Please select a registered client to send the quote — we need their email address.')
      return
    }
    setSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientId: createSelectedClient?.id || null,
          clientName: form.clientName.trim(),
          serviceType: form.serviceType.trim(),
          total: parseFloat(form.total) || 0,
          status: form.status
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create quote')
      setQuotes(p => [data.quote, ...p])
      setShowCreate(false)
      setForm({ clientName: '', serviceType: '', total: '', status: 'draft' })
      setCreateSelectedClient(null)
      setCreateClientSearch('')
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed to create quote') }
    setSaving(false)
  }

  // Send button clicked — if quote already has clientId, send directly.
  // If not, open the Link & Send modal.
  const handleSendClick = (q: Quote) => {
    if (q.clientId) {
      handleSendDirect(q)
    } else {
      openSend(q)
    }
  }

  const handleSendDirect = async (q: Quote) => {
    setActionLoading(q.id + '-send')
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'sent' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuotes(p => p.map(x => x.id === q.id ? data.quote : x))
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setActionLoading(null)
  }

  // Link a client to an existing draft quote, then send it
  const handleLinkAndSend = async () => {
    if (!sendQuote) return
    if (!sendSelectedClient) { setSendError('Please select a registered client to send to.'); return }
    setSending(true)
    setSendError('')
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes/${sendQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientId: sendSelectedClient.id,
          clientName: sendSelectedClient.name,
          status: 'sent'
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuotes(p => p.map(x => x.id === sendQuote.id ? data.quote : x))
      setSendQuote(null)
      setSendSelectedClient(null)
      setSendClientSearch('')
    } catch (err) { setSendError(err instanceof Error ? err.message : 'Failed to send') }
    setSending(false)
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => setUploadFile({ name: file.name, dataUrl: e.target?.result as string })
    reader.readAsDataURL(file)
  }

  const handleConvertWithUpload = async () => {
    if (!convertQuote) return
    setConvertError('')
    setConverting(true)
    try {
      const token = getNmdToken()
      const convertRes = await fetch(`${API}/api/quotes/${convertQuote.id}/convert-to-invoice`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const convertData = await convertRes.json()
      if (!convertRes.ok) throw new Error(convertData.error)
      const invoiceId = convertData.invoice.id
      const invoiceNumber = convertData.invoice.invoiceNumber
      if (uploadFile) {
        const uploadRes = await fetch(`${API}/api/invoices/${invoiceId}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fileDataUrl: uploadFile.dataUrl, fileName: uploadFile.name })
        })
        if (!uploadRes.ok) throw new Error('Invoice created but file upload failed.')
      }
      setQuotes(p => p.map(x => x.id === convertQuote.id ? { ...x, convertedInvoiceId: invoiceId } : x))
      setConvertQuote(null)
      setUploadFile(null)
      alert(`Invoice #${invoiceNumber} created successfully.${uploadFile ? ' Client has been notified by email.' : ''}`)
    } catch (err) { setConvertError(err instanceof Error ? err.message : 'Failed') }
    setConverting(false)
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

      {/* ── Create Modal ── */}
      {showCreate && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Create Quote</div>
              <button onClick={() => { setShowCreate(false); setFormError('') }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>{formError}</div>}
              <div>
                <label style={labelStyle}>Client *</label>
                <ClientSearchDropdown
                  clients={clients}
                  value={createClientSearch}
                  onChange={v => { setCreateClientSearch(v); setForm(p => ({ ...p, clientName: v })); setCreateSelectedClient(null) }}
                  onSelect={c => { setCreateSelectedClient(c); setCreateClientSearch(c.name); setForm(p => ({ ...p, clientName: c.name })) }}
                  selectedClient={createSelectedClient}
                />
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
                    <option value="draft">Save as Draft</option>
                    <option value="sent">Send to Client</option>
                  </select>
                </div>
              </div>
              {form.status === 'sent' && !createSelectedClient && (
                <div style={{ background: '#fffbea', border: '1.5px solid #f6c90e', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#7a5c00' }}>
                  You must select a registered client to send a quote — we need their email on file.
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowCreate(false); setFormError('') }} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : form.status === 'sent' ? 'Create & Send Quote' : 'Create Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Link & Send Modal (existing drafts with no clientId) ── */}
      {sendQuote && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Send Quote to Client</div>
              <button onClick={() => setSendQuote(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>×</button>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f8fbff', borderBottom: '1px solid #dde4ef' }}>
              <div style={{ fontSize: '0.78rem', color: '#5a6a88', marginBottom: 2 }}>Sending quote</div>
              <div style={{ fontWeight: 700, color: '#0e1117', fontFamily: 'Syne, sans-serif' }}>Quote #{sendQuote.quoteNumber} — {sendQuote.clientName}</div>
              <div style={{ fontSize: '0.82rem', color: '#5a6a88', marginTop: 2 }}>{sendQuote.serviceType} · {money(sendQuote.total)}</div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sendError && <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>{sendError}</div>}

              <div>
                <label style={labelStyle}>Select registered client to send to *</label>
                <ClientSearchDropdown
                  clients={clients}
                  value={sendClientSearch}
                  onChange={v => { setSendClientSearch(v); setSendSelectedClient(null) }}
                  onSelect={c => { setSendSelectedClient(c); setSendClientSearch(c.name) }}
                  selectedClient={sendSelectedClient}
                />
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#8494b0', lineHeight: 1.5 }}>
                  The quote email will be sent to the selected client's email address on file.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setSendQuote(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button
                  onClick={handleLinkAndSend}
                  disabled={sending || !sendSelectedClient}
                  style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: sendSelectedClient && !sending ? 'linear-gradient(135deg, #1f6132, #124d83)' : '#dde4ef', color: sendSelectedClient && !sending ? 'white' : '#8494b0', fontWeight: 600, cursor: sendSelectedClient && !sending ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {sending ? 'Sending...' : '📤 Link Client & Send Quote'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Convert to Invoice Modal ── */}
      {convertQuote && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Convert to Invoice</div>
              <button onClick={() => { setConvertQuote(null); setUploadFile(null); setConvertError('') }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>×</button>
            </div>
            <div style={{ padding: '1rem 1.5rem', background: '#f8fbff', borderBottom: '1px solid #dde4ef', flexShrink: 0 }}>
              <div style={{ fontSize: '0.8rem', color: '#5a6a88', marginBottom: 2 }}>Creating invoice for</div>
              <div style={{ fontWeight: 700, color: '#0e1117', fontFamily: 'Syne, sans-serif' }}>{convertQuote.clientName}</div>
              <div style={{ fontSize: '0.82rem', color: '#5a6a88', marginTop: 2 }}>{convertQuote.serviceType} · ${convertQuote.total.toFixed(2)}</div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
              {convertError && <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>{convertError}</div>}
              <div>
                <label style={labelStyle}>Upload Invoice from Bank App (Optional)</label>
                <p style={{ fontSize: '0.78rem', color: '#8494b0', marginBottom: 8, lineHeight: 1.5 }}>
                  Upload the invoice PDF or image you generated from your bank app. The client will be notified by email when you upload.
                </p>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files)} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px dashed #b0c0d8', background: uploadFile ? '#f0fff4' : '#f4f7fb', color: uploadFile ? '#1f6132' : '#3a4660', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {uploadFile ? `Selected: ${uploadFile.name}` : '+ Select Invoice File (PDF or Image)'}
                </button>
                {uploadFile && (
                  <button type="button" onClick={() => setUploadFile(null)}
                    style={{ marginTop: 6, background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Remove file
                  </button>
                )}
              </div>
              <div style={{ background: '#f8fbff', borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid #dde4ef', fontSize: '0.78rem', color: '#5a6a88', lineHeight: 1.6 }}>
                {uploadFile ? 'The invoice will be created and the file will be attached. Client will receive an email notification.' : 'You can skip the upload now and upload the invoice file later from the Invoices page.'}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setConvertQuote(null); setUploadFile(null); setConvertError('') }}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button onClick={handleConvertWithUpload} disabled={converting}
                  style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, cursor: converting ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: converting ? 0.7 : 1 }}>
                  {converting ? 'Processing...' : uploadFile ? 'Create Invoice & Upload File' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteQuote && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: 420 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Delete Quote</div>
              <button onClick={() => setDeleteQuote(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#3a4660', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>Quote #{deleteQuote.quoteNumber}</strong> for {deleteQuote.clientName}? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteQuote(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: 'none', background: '#e74c3c', color: 'white', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: deleting ? 0.7 : 1 }}>
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
            <button onClick={openCreate} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
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
            <span key="client" style={{ fontWeight: 500 }}>
              {q.clientName || '—'}
              {!q.clientId && q.status === 'draft' && (
                <span style={{ fontSize: '0.7rem', color: '#e67e22', marginLeft: 6, fontWeight: 500 }}>· no client linked</span>
              )}
            </span>,
            <span key="svc" style={{ color: '#5a6a88' }}>{q.serviceType || '—'}</span>,
            <span key="total" style={{ fontWeight: 600 }}>{money(q.total)}</span>,
            <StatusBadge key="status" status={q.status} />,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(q.createdAt)}</span>,
            <div key="actions" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {q.status === 'draft' && (
                <button
                  onClick={() => handleSendClick(q)}
                  disabled={actionLoading === q.id + '-send'}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#e8f0fe', color: '#124d83', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {actionLoading === q.id + '-send' ? '...' : q.clientId ? 'Send' : '📤 Send'}
                </button>
              )}
              {q.status === 'sent' && (
                <>
                  <button onClick={() => handleAccept(q)} disabled={actionLoading === q.id + '-accept'}
                    style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#e8f5e9', color: '#1f6132', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    {actionLoading === q.id + '-accept' ? '...' : 'Accept'}
                  </button>
                  <button onClick={() => handleDecline(q)} disabled={actionLoading === q.id + '-decline'}
                    style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#e74c3c', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    {actionLoading === q.id + '-decline' ? '...' : 'Decline'}
                  </button>
                </>
              )}
              {q.status === 'accepted' && !q.convertedInvoiceId && (
                <button onClick={() => { setConvertQuote(q); setUploadFile(null); setConvertError('') }}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Convert to Invoice
                </button>
              )}
              {q.convertedInvoiceId && (
                <span style={{ fontSize: '0.75rem', color: '#1f6132', fontWeight: 600 }}>Invoiced</span>
              )}
              <button onClick={() => setDeleteQuote(q)}
                style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#e74c3c', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Delete
              </button>
            </div>
          ])}
        />
      )}
    </PortalShell>
  )
}