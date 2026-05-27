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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ clientName: '', jobName: '', total: '', status: 'unpaid' })
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState('')

  const [uploadInvoice, setUploadInvoice] = useState<Invoice | null>(null)
  const [uploadFile, setUploadFile] = useState<{ name: string; dataUrl: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [markPaidId, setMarkPaidId] = useState<string | null>(null)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const load = () => {
    const token = getNmdToken()
    fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setInvoices(d.invoices || []); setLoading(false) })
      .catch(() => { setError('Could not load invoices.'); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const filtered = invoices.filter(i =>
    `${i.invoiceNumber} ${i.clientName} ${i.jobName} ${i.status}`.toLowerCase().includes(search.toLowerCase())
  )

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
      alert(`Invoice uploaded successfully. Client has been notified by email.`)
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

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>

      {/* Create Modal */}
      {showCreate && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Create Invoice</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>x</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {createError && <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>{createError}</div>}
              <div>
                <label style={labelStyle}>Client Name *</label>
                <input style={inputStyle} value={createForm.clientName} onChange={e => setCreateForm(p => ({ ...p, clientName: e.target.value }))} placeholder="John Smith" required />
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
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button type="submit" disabled={createSaving} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, cursor: createSaving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: createSaving ? 0.7 : 1 }}>
                  {createSaving ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadInvoice && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Upload Invoice</div>
              <button onClick={() => { setUploadInvoice(null); setUploadFile(null); setUploadError('') }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>x</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fbff', borderBottom: '1px solid #dde4ef' }}>
              <div style={{ fontSize: '0.8rem', color: '#5a6a88', marginBottom: 2 }}>Uploading for</div>
              <div style={{ fontWeight: 700, color: '#0e1117', fontFamily: 'Syne, sans-serif' }}>{uploadInvoice.clientName}</div>
              <div style={{ fontSize: '0.82rem', color: '#5a6a88' }}>Invoice #{uploadInvoice.invoiceNumber} · {uploadInvoice.jobName} · {money(uploadInvoice.total).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {uploadError && <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>{uploadError}</div>}
              <div>
                <label style={labelStyle}>Invoice File (PDF or Image)</label>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files)} />
                <button type="button" onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px dashed #b0c0d8', background: '#f4f7fb', color: '#3a4660', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {uploadFile ? uploadFile.name : '+ Select Invoice File'}
                </button>
                {uploadFile && (
                  <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#1f6132', fontWeight: 500 }}>
                    Selected: {uploadFile.name}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#8494b0', background: '#f8fbff', borderRadius: 8, padding: '0.65rem 0.9rem', border: '1px solid #dde4ef' }}>
                After uploading, the client will automatically receive an email notification to view their invoice in the portal.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setUploadInvoice(null); setUploadFile(null); setUploadError('') }} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button onClick={handleUpload} disabled={!uploadFile || uploading} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: uploadFile ? 'linear-gradient(135deg, #1f6132, #124d83)' : '#dde4ef', color: uploadFile ? 'white' : '#8494b0', fontWeight: 600, cursor: (!uploadFile || uploading) ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? 'Uploading...' : 'Upload & Notify Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {viewInvoice?.uploadedInvoiceUrl && (
        <div onClick={() => setViewInvoice(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Invoice #{viewInvoice.invoiceNumber} — {viewInvoice.clientName}</div>
              <button onClick={() => setViewInvoice(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>x</button>
            </div>
            {viewInvoice.uploadedInvoiceUrl.startsWith('data:image') ? (
              <img src={viewInvoice.uploadedInvoiceUrl} alt="Invoice" style={{ width: '100%', borderRadius: 12, maxHeight: '75vh', objectFit: 'contain' }} />
            ) : (
              <div style={{ background: 'white', borderRadius: 12, padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                <div style={{ fontWeight: 600, marginBottom: '1rem' }}>{viewInvoice.uploadedInvoiceName}</div>
                <a href={viewInvoice.uploadedInvoiceUrl} download={viewInvoice.uploadedInvoiceName} style={{ padding: '0.7rem 1.5rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>Download PDF</a>
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
            <button onClick={() => setShowCreate(true)} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
              + Create Invoice
            </button>
          </div>
        }
      />

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <MetricCard label="Paid" value={money(paidTotal)} sub={`${paid.length} invoices`} accent="#1f6132" />
          <MetricCard label="Outstanding" value={money(unpaidTotal)} sub={`${unpaid.length} invoices`} accent="#a32d2d" />
          <MetricCard label="Total" value={invoices.length} sub="all invoices" accent="#124d83" />
        </div>
      )}

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Invoice #', 'Client', 'Job', 'Total', 'Status', 'Created', '']}
          emptyMessage="No invoices found."
          rows={filtered.map(inv => [
            <span key="num" style={{ fontWeight: 700, color: '#124d83' }}>#{inv.invoiceNumber}</span>,
            <span key="client" style={{ fontWeight: 500 }}>{inv.clientName || '—'}</span>,
            <span key="job" style={{ color: '#5a6a88' }}>{inv.jobName || '—'}</span>,
            <span key="total" style={{ fontWeight: 600 }}>{money(inv.total).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>,
            <StatusBadge key="status" status={inv.status} />,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(inv.createdAt)}</span>,
            <div key="actions" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <button
                onClick={() => setUploadInvoice(inv)}
                style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#e8f0fe', color: '#124d83', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                {inv.uploadedInvoiceUrl ? 'Re-upload' : 'Upload'}
              </button>
              {inv.uploadedInvoiceUrl && (
                <button
                  onClick={() => setViewInvoice(inv)}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#f4f7fb', color: '#3a4660', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  View
                </button>
              )}
              {inv.status !== 'paid' && (
                <button
                  onClick={() => handleMarkPaid(inv.id)}
                  disabled={markPaidId === inv.id}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#e8f5e9', color: '#1f6132', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {markPaidId === inv.id ? '...' : 'Mark Paid'}
                </button>
              )}
            </div>
          ])}
        />
      )}
    </PortalShell>
  )
}
