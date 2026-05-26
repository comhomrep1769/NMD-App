'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Employee = {
  id: string; email: string; displayName: string
  role: string; payRate: number; createdAt: string
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    displayName: '', email: '', password: '', role: 'employee', payRate: '30'
  })

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

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.displayName || !form.email || !form.password) {
      setFormError('Name, email, and password are required.'); return
    }
    setSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          payRate: parseFloat(form.payRate) || 30
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create employee')
      setEmployees(prev => [data.employee, ...prev])
      setShowModal(false)
      setForm({ displayName: '', email: '', password: '', role: 'employee', payRate: '30' })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create employee')
    }
    setSaving(false)
  }

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(14,17,23,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>Add New Employee</div>
              <button onClick={() => { setShowModal(false); setFormError('') }} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#8494b0' }}>x</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && (
                <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>
                  {formError}
                </div>
              )}
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={form.displayName} onChange={e => update('displayName', e.target.value)} placeholder="John Smith" required />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" required />
              </div>
              <div>
                <label style={labelStyle}>Temporary Password *</label>
                <input style={inputStyle} type="text" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min. 8 characters" required />
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
                <button type="button" onClick={() => { setShowModal(false); setFormError('') }} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create Employee & Send Welcome Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SectionHeader
        title="Employees"
        sub={`${employees.length} team members`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." />
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
            >
              + Add Employee
            </button>
          </div>
        }
      />
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Name', 'Email', 'Role', 'Pay Rate', 'Joined']}
          emptyMessage="No employees found."
          rows={filtered.map(e => [
            <div key="name" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {(e.displayName || 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontWeight: 600 }}>{e.displayName}</span>
            </div>,
            <a key="email" href={`mailto:${e.email}`} style={{ color: '#124d83', textDecoration: 'none' }}>{e.email}</a>,
            <StatusBadge key="role" status={e.role} />,
            <span key="pay" style={{ fontWeight: 600 }}>{money(e.payRate)}/hr</span>,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(e.createdAt)}</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}
