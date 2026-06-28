'use client'

import { useEffect, useState, useRef } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, MetricCard, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Invoice = {
  id: string; invoiceNumber: number; clientName: string
  jobName: string; subtotal: number; total: number
  status: string; createdAt: string; paidAt: string | null
  uploadedInvoiceUrl: string | null; uploadedInvoiceName: string | null
  paymentLinkUrl: string | null; paymentStatus: string | null
}

type ClientOption = {
  id: string
  name: string
  email: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
  border: '1px solid #E5E7EB', fontSize: '0.875rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', color: '#111827',
  background: 'white', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4,
}
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.65)',
  zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
}
const modalBox: React.CSSProperties = {
  background: 'white', borderRadius: 14, width: '100%', maxWidth: 480,
  boxShadow: '0 20px 60px rgba(17,24,39,0.2)', overflow: 'hidden'
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'paid', label: 'Paid' },
]

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
        style={{ ...inputStyle, borderColor: selectedClient ? '#0F766E' : '#E5E7EB' }}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search client name..."
        autoComplete="off"
      />
      {selectedClient && (
        <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>✓ {selectedClient.email}</div>
      )}
      {open && value.length >= 1 && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(17,24,39,0.12)', maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
          {filtered.map(c => (
            <div key={c.id} onMouseDown={() => { onSelect(c); setOpen(false) }}
              style={{ padding: '0.65rem 1rem', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: '0.875rem', color: '#111827' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAF9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <span style={{ color: '#9CA3AF', marginLeft: 8, fontSize: '0.78rem' }}>{c.email}</span>
            </div>
          ))}
        </div>
      )}
      {open && value.length >= 1 && filtered.length === 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#9CA3AF', marginTop: 2 }}>
          No registered clients found — you can still type a name manually
        </div>
      )}
    </div>
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ clientName: '', jobName: '', total: '', status: 'unpaid' })
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [clients, setClients] = useState<ClientOption[]>([])
  const [createClientSearch, setCreateClientSearch] = useState('')
  const [createSelectedClient, setCreateSelectedClient] = useState<ClientOption | null>(null)

  const [uploadInvoice, setUploadInvoice] = useState<Invoice | null>(null)
  const [uploadFile, setUploadFile] = useState<{ name: string; dataUrl: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [markPaidId, setMarkPaidId] = useState<string | null>(null)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

  const [sendingLinkId, setSendingLinkId] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<{ id: string; message: string } | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const load = () => {
    const token = getNmdToken()
    fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setInvoices(d.invoices || []); setLoading(false) })
      .catch(() => { setError('Could not load invoices.'); setLoading(false) })
  }

  useEffect(() => { load() }, [])

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

  const openCreate = () => {
    loadClients()
    setShowCreate(true)
    setCreateClientSearch('')
    setCreateSelectedClient(null)
    setCreateError('')
    setCreateForm({ clientName: '', jobName: '', total: '', status: 'unpaid' })
  }

  const filtered = invoices
    .filter(i => statusFilter === 'all' || (statusFilter === 'unpaid' ? i.status !== 'paid' : i.status === statusFilter))
    .filter(i => `${i.invoiceNumber} ${i.clientName} ${i.jobName} ${i.status}`.toLowerCase().includes(search.toLowerCase()))

  const paid = invoices.filter(i => i.status === 'paid')
  const unpaid = invoices.filter(i => i.status !== 'paid')
  const paidTotal = paid.reduce((s, i) => s + i.total, 0)
  const unpaidTotal = unpaid.reduce((s, i) => s + i.total, 0)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    if (!createForm.clientName || !createForm.jobName) { setCreateError('Client name and job name are required.'); return }
    setCreateSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientName: createForm.clientName.trim(), jobName: createForm.jobName.trim(), total: parseFloat(createForm.total) || 0, status: createForm.status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice')
      setInvoices(p => [data.invoice, ...p])
      setShowCreate(false)
      setCreateForm({ clientName: '', jobName: '', total: '', status: 'unpaid' })
      setCreateClientSearch('')
      setCreateSelectedClient(null)
    } catch (err) { setCreateError(err instanceof Error ? err.message : 'Failed') }
    setCreateSaving(false)
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadFile({ name: file.name, dataUrl: e.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!uploadInvoice || !uploadFile) return
    setUploadError('')
    setUploading(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/invoices/${uploadInvoice.id}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileDataUrl: uploadFile.dataUrl, fileName: uploadFile.name })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setInvoices(p => p.map(i => i.id === uploadInvoice.id ? data.invoice : i))
      setUploadInvoice(null)
      setUploadFile(null)
      alert('Invoice uploaded. Client has been notified by email.')
    } catch (err) { setUploadError(err instanceof Error ? err.message : 'Upload failed') }
    setUploading(false)
  }

  const handleMarkPaid = async (id: string) => {
    setMarkPaidId(id)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'paid' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInvoices(p => p.map(i => i.id === id ? data.invoice : i))
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setMarkPaidId(null)
  }

  // ── Generate (or fetch existing) Stripe payment link and email it to the client ──
  const handleSendPaymentLink = async (inv: Invoice) => {
    setLinkError(null)
    setSendingLinkId(inv.id)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/payments/invoices/${inv.id}/create-payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create payment link')
      setInvoices(p => p.map(i => i.id === inv.id ? data.invoice : i))
      alert('Payment link sent — the client has been emailed a secure Stripe checkout link.')
    } catch (err) {
      setLinkError({ id: inv.id, message: err instanceof Error ? err.message : 'Failed to send payment link' })
    }
    setSendingLinkId(null)
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => alert('Payment link copied to clipboard.'))
  }

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>

      {showCreate && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Create Invoice</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {createError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#B91C1C' }}>{createError}</div>}
              <div>
                <label style={labelStyle}>Client Name *</label>
                <ClientSearchDropdown
                  clients={clients}
                  value={createClientSearch}
                  onChange={v => { setCreateClientSearch(v); setCreateForm(p => ({ ...p, clientName: v })); setCreateSelectedClient(null) }}
                  onSelect={c => { setCreateSelectedClient(c); setCreateClientSearch(c.name); setCreateForm(p => ({ ...p, clientName: c.name })) }}
                  selectedClient={createSelectedClient}
                />
              </div>
              <div>
                <label style={labelStyle}>Service / Job Name *</label>
                <input style={inputStyle} value={createForm.jobName} onChange={e => setCreateForm(p => ({ ...p, jobName: e.target.value }))} placeholder="House Washing" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Total ($)</label>
                  <input style={inputStyle} type="number" value={createForm.total} onChange={e => setCreateForm(p => ({ ...p, total: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={createForm.status} onChange={e => setCreateForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button type="submit" disabled={createSaving} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: '#0F766E', color: 'white', fontWeight: 600, cursor: createSaving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: createSaving ? 0.7 : 1 }}>
                  {createSaving ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploadInvoice && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Upload Invoice</div>
              <button onClick={() => { setUploadInvoice(null); setUploadFile(null); setUploadError('') }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <div style={{ padding: '1rem 1.5rem', background: '#F8FAF9', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 2 }}>Uploading for</div>
              <div style={{ fontWeight: 700, color: '#111827', fontFamily: 'DM Sans, sans-serif' }}>{uploadInvoice.clientName}</div>
              <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>Invoice #{uploadInvoice.invoiceNumber} · {uploadInvoice.jobName} · ${Number(uploadInvoice.total).toFixed(2)}</div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {uploadError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#B91C1C' }}>{uploadError}</div>}
              <div>
                <label style={labelStyle}>Invoice File (PDF or Image)</label>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files)} />
                <button type="button" onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px dashed #D1D5DB', background: '#F9FAFB', color: '#374151', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {uploadFile ? uploadFile.name : '+ Select Invoice File (PDF or Image)'}
                </button>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF', background: '#F8FAF9', borderRadius: 8, padding: '0.65rem 0.9rem', border: '1px solid #E5E7EB' }}>
                After uploading, the client will automatically receive an email notification.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setUploadInvoice(null); setUploadFile(null); setUploadError('') }} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button onClick={handleUpload} disabled={!uploadFile || uploading} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: uploadFile ? '#0F766E' : '#E5E7EB', color: uploadFile ? 'white' : '#9CA3AF', fontWeight: 600, cursor: (!uploadFile || uploading) ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? 'Uploading...' : 'Upload & Notify Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewInvoice?.uploadedInvoiceUrl && (
        <div onClick={() => setViewInvoice(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ color: 'white', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>Invoice #{viewInvoice.invoiceNumber} - {viewInvoice.clientName}</div>
              <button onClick={() => setViewInvoice(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            {viewInvoice.uploadedInvoiceUrl.startsWith('data:image') ? (
              <img src={viewInvoice.uploadedInvoiceUrl} alt="Invoice" style={{ width: '100%', borderRadius: 12, maxHeight: '75vh', objectFit: 'contain' }} />
            ) : (
              <div style={{ background: 'white', borderRadius: 12, padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                <div style={{ fontWeight: 600, marginBottom: '1rem' }}>{viewInvoice.uploadedInvoiceName}</div>
                <a href={viewInvoice.uploadedInvoiceUrl} download={viewInvoice.uploadedInvoiceName} style={{ padding: '0.7rem 1.5rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>Download PDF</a>
              </div>
            )}
          </div>
        </div>
      )}

      <SectionHeader
        title="Invoices"
        sub={`${invoices.length} total invoices`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search invoices..." />
            <button onClick={openCreate} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
              + Create Invoice
            </button>
          </div>
        }
      />

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <MetricCard label="Paid" value={money(paidTotal)} sub={`${paid.length} invoices`} accent="#0F766E" />
          <MetricCard label="Outstanding" value={money(unpaidTotal)} sub={`${unpaid.length} invoices`} accent="#EF4444" />
          <MetricCard label="Total" value={invoices.length} sub="all invoices" accent="#6D28D9" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            style={{
              padding: '5px 14px', borderRadius: 100,
              border: `1px solid ${statusFilter === f.key ? '#0F766E' : '#E5E7EB'}`,
              background: statusFilter === f.key ? '#F0FDF9' : 'white',
              color: statusFilter === f.key ? '#0F766E' : '#6B7280',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Invoice #', 'Client', 'Job', 'Total', 'Status', 'Created', '']}
          emptyMessage="No invoices found."
          rows={filtered.map(inv => [
            <span key="num" style={{ fontWeight: 700, color: '#0F766E' }}>#{inv.invoiceNumber}</span>,
            <span key="client" style={{ fontWeight: 500 }}>{inv.clientName || '—'}</span>,
            <span key="job" style={{ color: '#6B7280' }}>{inv.jobName || '—'}</span>,
            <span key="total" style={{ fontWeight: 600 }}>${Number(inv.total).toFixed(2)}</span>,
            <StatusBadge key="status" status={inv.status} />,
            <span key="date" style={{ color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(inv.createdAt)}</span>,
            <div key="actions" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button onClick={() => setUploadInvoice(inv)} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#F0FDF9', color: '#0F766E', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {inv.uploadedInvoiceUrl ? 'Re-upload' : 'Upload'}
                </button>
                {inv.uploadedInvoiceUrl && (
                  <button onClick={() => setViewInvoice(inv)} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#F3F4F6', color: '#374151', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>View</button>
                )}
                {inv.status !== 'paid' && (
                  <button onClick={() => handleMarkPaid(inv.id)} disabled={markPaidId === inv.id} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#F0FDF9', color: '#059669', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    {markPaidId === inv.id ? '...' : 'Mark Paid'}
                  </button>
                )}
              </div>
              {inv.status !== 'paid' && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {inv.paymentLinkUrl ? (
                    <button onClick={() => handleCopyLink(inv.paymentLinkUrl!)} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#FEF9C3', color: '#92400E', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      🔗 Copy Link
                    </button>
                  ) : (
                    <button onClick={() => handleSendPaymentLink(inv)} disabled={sendingLinkId === inv.id} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#FEF9C3', color: '#92400E', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      {sendingLinkId === inv.id ? 'Sending...' : '💳 Send Payment Link'}
                    </button>
                  )}
                </div>
              )}
              {linkError?.id === inv.id && (
                <div style={{ fontSize: '0.7rem', color: '#B91C1C' }}>{linkError.message}</div>
              )}
            </div>
          ])}
        />
      )}
    </PortalShell>
  )
}