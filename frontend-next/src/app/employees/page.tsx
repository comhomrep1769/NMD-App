'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Employee = {
  id: string; email: string; displayName: string
  role: string; payRate: number; createdAt: string
  mustChangePassword: boolean
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ displayName: '', email: '', role: 'employee', payRate: '30' })

  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [editForm, setEditForm] = useState({ displayName: '', email: '', role: 'employee', payRate: '30' })
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [resetEmployee, setResetEmployee] = useState<Employee | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const loadEmployees = () => {
    const token = getNmdToken()
    fetch(`${API}/api/employees`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setEmployees(d.employees || []); setLoading(false) })
      .catch(() => { setError('Could not load employees.'); setLoading(false) })
  }

  useEffect(() => { loadEmployees() }, [])

  const filtered = employees.filter(e =>
    `${e.displayName} ${e.email} ${e.role}`.toLowerCase().includes(search.toLowerCase())
  )

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))
  const updateEdit = (field: string, value: string) => setEditForm(prev => ({ ...prev, [field]: value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.displayName || !form.email) { setFormError('Name and email are required.'); return }
    setSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          displayName: form.displayName.trim(), email: form.email.trim(),
          role: form.role, payRate: parseFloat(form.payRate) || 30
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create employee')
      setEmployees(prev => [data.employee, ...prev])
      setShowCreate(false)
      setForm({ displayName: '', email: '', role: 'employee', payRate: '30' })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create employee')
    }
    setSaving(false)
  }

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp)
    setEditForm({ displayName: emp.displayName, email: emp.email, role: emp.role, payRate: String(emp.payRate) })
    setEditError('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editEmployee) return
    setEditError('')
    setEditSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/employees/${editEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: editForm.displayName.trim(), email: editForm.email.trim(), role: editForm.role, payRate: parseFloat(editForm.payRate) || 30 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update employee')
      setEmployees(prev => prev.map(e => e.id === editEmployee.id ? data.employee : e))
      setEditEmployee(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update employee')
    }
    setEditSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteEmployee) return
    setDeleting(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/employees/${deleteEmployee.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to delete employee')
      setEmployees(prev => prev.filter(e => e.id !== deleteEmployee.id))
      setDeleteEmployee(null)
    } catch (err) { console.error(err) }
    setDeleting(false)
  }

  const handleResetPassword = async () => {
    if (!resetEmployee) return
    setResetting(true)
    setResetMsg('')
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/employees/${resetEmployee.id}/reset-password`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setResetMsg(`✓ Password reset. A new temporary password has been sent to ${resetEmployee.email}.`)
      loadEmployees() // ── Reload so Pending Setup badge updates immediately ──
    } catch (err) {
      setResetMsg(err instanceof Error ? err.message : 'Failed to reset password')
    }
    setResetting(false)
  }

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>

      {/* Create Modal */}
      {showCreate && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={modalHeader}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Add New Employee</div>
              <button onClick={() => { setShowCreate(false); setFormError('') }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#B91C1C' }}>{formError}</div>}
              <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1D4ED8', lineHeight: 1.5 }}>
                🔐 A secure temporary password will be automatically generated and emailed to the employee. They will be required to set their own password on first login.
              </div>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={form.displayName} onChange={e => update('displayName', e.target.value)} placeholder="John Smith" required />
              </div>
              <div>
                <label style={labelStyle}>Email Address *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Role *</label>
                  <select style={inputStyle} value={form.role} onChange={e => update('role', e.target.value)}>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Pay Rate ($/hr)</label>
                  <input style={inputStyle} type="number" value={form.payRate} onChange={e => update('payRate', e.target.value)} placeholder="30" min="0" step="0.5" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowCreate(false); setFormError('') }} style={cancelButtonStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={primaryButtonStyle(saving)}>
                  {saving ? 'Creating...' : '+ Create & Send Welcome Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editEmployee && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={modalHeader}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Edit Employee</div>
              <button onClick={() => setEditEmployee(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <form onSubmit={handleEdit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editError && <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#B91C1C' }}>{editError}</div>}
              <div>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} value={editForm.displayName} onChange={e => updateEdit('displayName', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={editForm.email} onChange={e => updateEdit('email', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select style={inputStyle} value={editForm.role} onChange={e => updateEdit('role', e.target.value)}>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Pay Rate ($/hr)</label>
                  <input style={inputStyle} type="number" value={editForm.payRate} onChange={e => updateEdit('payRate', e.target.value)} min="0" step="0.5" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setEditEmployee(null)} style={cancelButtonStyle}>Cancel</button>
                <button type="submit" disabled={editSaving} style={primaryButtonStyle(editSaving)}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetEmployee && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: 440 }}>
            <div style={modalHeader}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Reset Password</div>
              <button onClick={() => { setResetEmployee(null); setResetMsg('') }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {resetMsg ? (
                <div style={{ background: '#F0FDF9', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#059669', fontWeight: 500, marginBottom: '1rem' }}>{resetMsg}</div>
              ) : (
                <p style={{ color: '#374151', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  This will generate a new temporary password and email it to <strong>{resetEmployee.displayName}</strong> ({resetEmployee.email}). They will be required to set a new password on next login.
                </p>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setResetEmployee(null); setResetMsg('') }} style={cancelButtonStyle}>
                  {resetMsg ? 'Close' : 'Cancel'}
                </button>
                {!resetMsg && (
                  <button onClick={handleResetPassword} disabled={resetting} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: '#FEF9C3', color: '#92400E', fontWeight: 600, cursor: resetting ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: resetting ? 0.7 : 1 }}>
                    {resetting ? 'Resetting...' : '🔄 Reset & Email New Password'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteEmployee && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: 420 }}>
            <div style={modalHeader}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Delete Employee</div>
              <button onClick={() => setDeleteEmployee(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#374151', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{deleteEmployee.displayName}</strong>? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteEmployee(null)} style={cancelButtonStyle}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>NMD Portal</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>Employees</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{employees.length} team members</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." />
          <button onClick={() => setShowCreate(true)} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
            + Add Employee
          </button>
        </div>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Name', 'Email', 'Role', 'Pay Rate', 'Joined', 'Status', '']}
          emptyMessage="No employees found."
          rows={filtered.map(e => [
            <div key="name" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {(e.displayName || 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, color: '#111827' }}>{e.displayName}</span>
            </div>,
            <a key="email" href={`mailto:${e.email}`} style={{ color: '#1D4ED8', textDecoration: 'none' }}>{e.email}</a>,
            <StatusBadge key="role" status={e.role} />,
            <span key="pay" style={{ fontWeight: 600, color: '#111827' }}>{money(e.payRate)}/hr</span>,
            <span key="date" style={{ color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(e.createdAt)}</span>,
            <span key="status" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: e.mustChangePassword ? '#FEF9C3' : '#F0FDF9', color: e.mustChangePassword ? '#92400E' : '#059669' }}>
              {e.mustChangePassword ? '⏳ Pending Setup' : '✓ Active'}
            </span>,
            <div key="actions" style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(e)} style={{ padding: '0.35rem 0.75rem', borderRadius: 6, border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Edit</button>
              <button onClick={() => { setResetEmployee(e); setResetMsg('') }} style={{ padding: '0.35rem 0.75rem', borderRadius: 6, border: 'none', background: '#FEF9C3', color: '#92400E', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Reset PW</button>
              <button onClick={() => setDeleteEmployee(e)} style={{ padding: '0.35rem 0.75rem', borderRadius: 6, border: 'none', background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Delete</button>
            </div>
          ])}
        />
      )}
    </PortalShell>
  )
}