'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Client = {
  id: string; firstName: string; lastName: string
  email: string; phone: string; address: string; createdAt: string
  hasLogin: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
  border: '1.5px solid #E5E7EB', fontSize: '0.875rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', color: '#111827',
  background: '#fff', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4,
}
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.65)',
  zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
}
const modalBox: React.CSSProperties = {
  background: 'white', borderRadius: 10, width: '100%', maxWidth: 480,
  boxShadow: '0 20px 60px rgba(17,24,39,0.15)', overflow: 'hidden'
}
const modalHeader: React.CSSProperties = {
  padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
}
const cancelButtonStyle: React.CSSProperties = {
  flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #E5E7EB',
  background: 'white', color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
}
const primaryButtonStyle = (disabled: boolean): React.CSSProperties => ({
  flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none',
  background: '#0F766E', color: 'white', fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: disabled ? 0.7 : 1
})

const EMPTY_FORM = { firstName: '', lastName: '', email: '', phone: '', address: '', createLogin: false }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const [editClient, setEditClient] = useState<Client | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '' })
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [deleteClient, setDeleteClient] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const loadClients = () => {
    const token = getNmdToken()
    fetch(`${API}/api/clients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setClients(d.clients || []); setLoading(false) })
      .catch(() => { setError('Could not load clients.'); setLoading(false) })
  }

  useEffect(() => { loadClients() }, [])

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  const update = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }))
  const updateEdit = (field: string, value: string) => setEditForm(prev => ({ ...prev, [field]: value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.firstName || !form.lastName) { setFormError('First and last name are required.'); return }
    if (form.createLogin && !form.email) { setFormError('Email is required to create a portal login.'); return }
    setSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: form.firstName.trim(), lastName: form.lastName.trim(),
          email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim(),
          createLogin: form.createLogin,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create client')
      setClients(prev => [data.client, ...prev])
      setShowCreate(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create client')
    }
    setSaving(false)
  }

  const openEdit = (c: Client) => {
    setEditClient(c)
    setEditForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, address: c.address })
    setEditError('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editClient) return
    setEditError('')
    setEditSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/clients/${editClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: editForm.firstName.trim(), lastName: editForm.lastName.trim(),
          email: editForm.email.trim(), phone: editForm.phone.trim(), address: editForm.address.trim(),
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update client')
      setClients(prev => prev.map(c => c.id === editClient.id ? data.client : c))
      setEditClient(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update client')
    }
    setEditSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteClient) return
    setDeleting(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/clients/${deleteClient.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to delete client')
      setClients(prev => prev.filter(c => c.id !== deleteClient.id))
      setDeleteClient(null)
    } catch (err) { console.error(err) }
    setDeleting(false)
  }

  const handleExportCsv = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Joined']
    const escape = (val: unknown) => {
      const str = String(val ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    const rows = clients.map(c => [c.firstName, c.lastName, c.email, c.phone, c.address, c.createdAt].map(escape).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nmd-clients-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>

      {/* Create Modal */}
      {showCreate && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={modalHeader}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Add New Client</div>
              <button onClick={() => { setShowCreate(false); setFormError('') }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#B91C1C' }}>{formError}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input style={inputStyle} value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Jane" required />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input style={inputStyle} value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Doe" required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email Address{form.createLogin ? ' *' : ''}</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="jane@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(321) 555-0182" />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Main St, Melbourne, FL" />
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.75rem 1rem', borderRadius: 8, background: form.createLogin ? '#F0FDF9' : '#F9FAFB', border: `1.5px solid ${form.createLogin ? '#A7F3D0' : '#E5E7EB'}`, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.createLogin}
                  onChange={e => update('createLogin', e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#0F766E', width: 16, height: 16, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>Also create a portal login</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>
                    A temporary password will be emailed to them, and they'll be required to set their own password on first login.
                  </div>
                </div>
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowCreate(false); setFormError('') }} style={cancelButtonStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={primaryButtonStyle(saving)}>
                  {saving ? 'Creating...' : form.createLogin ? '+ Create & Send Welcome Email' : '+ Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editClient && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={modalHeader}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Edit Client</div>
              <button onClick={() => setEditClient(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <form onSubmit={handleEdit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editError && <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#B91C1C' }}>{editError}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input style={inputStyle} value={editForm.firstName} onChange={e => updateEdit('firstName', e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input style={inputStyle} value={editForm.lastName} onChange={e => updateEdit('lastName', e.target.value)} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={editForm.email} onChange={e => updateEdit('email', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={editForm.phone} onChange={e => updateEdit('phone', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} value={editForm.address} onChange={e => updateEdit('address', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setEditClient(null)} style={cancelButtonStyle}>Cancel</button>
                <button type="submit" disabled={editSaving} style={primaryButtonStyle(editSaving)}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteClient && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: 420 }}>
            <div style={modalHeader}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Delete Client</div>
              <button onClick={() => setDeleteClient(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#374151', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{deleteClient.firstName} {deleteClient.lastName}</strong>?
                {deleteClient.hasLogin && ' Their portal login will also be removed.'}
                {' '}This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteClient(null)} style={cancelButtonStyle}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="Clients"
        sub={`${clients.length} total clients`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />
            <button
              onClick={handleExportCsv}
              disabled={clients.length === 0}
              style={{ padding: '0.6rem 1.1rem', borderRadius: 8, background: clients.length === 0 ? '#E5E7EB' : 'white', color: clients.length === 0 ? '#9CA3AF' : '#374151', fontWeight: 600, fontSize: '0.85rem', border: '1.5px solid #E5E7EB', cursor: clients.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
            >
              ⬇ Export CSV
            </button>
            <button
              onClick={() => setShowCreate(true)}
              style={{ padding: '0.6rem 1.1rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
            >
              + Add Client
            </button>
          </div>
        }
      />
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Name', 'Email', 'Phone', 'Address', 'Portal Access', 'Joined', '']}
          emptyMessage="No clients found."
          rows={filtered.map(c => [
            <span key="name" style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</span>,
            <a key="email" href={`mailto:${c.email}`} style={{ color: '#0F766E', textDecoration: 'none' }}>{c.email || '—'}</a>,
            <span key="phone">{c.phone || '—'}</span>,
            <span key="addr" style={{ color: '#6B7280', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</span>,
            <span key="access" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: c.hasLogin ? '#F0FDF9' : '#F3F4F6', color: c.hasLogin ? '#059669' : '#6B7280' }}>
              {c.hasLogin ? '✓ Portal Access' : 'No Login'}
            </span>,
            <span key="date" style={{ color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</span>,
            <div key="actions" style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(c)} style={{ padding: '0.35rem 0.75rem', borderRadius: 6, border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Edit</button>
              <button onClick={() => setDeleteClient(c)} style={{ padding: '0.35rem 0.75rem', borderRadius: 6, border: 'none', background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Delete</button>
            </div>,
          ])}
        />
      )}
    </PortalShell>
  )
}