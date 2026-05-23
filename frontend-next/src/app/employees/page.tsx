'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Employee = {
  id: string; email: string; displayName: string
  role: string; payRate: number; createdAt: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = getNmdToken()
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/employees`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setEmployees(d.employees || []); setLoading(false) })
      .catch(() => { setError('Could not load employees.'); setLoading(false) })
  }, [])

  const filtered = employees.filter(e =>
    `${e.displayName} ${e.email} ${e.role}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <SectionHeader
        title="Employees"
        sub={`${employees.length} team members`}
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search employees..." />}
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
