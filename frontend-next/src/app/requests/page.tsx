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
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = getNmdToken()
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRequests(d.requests || []); setLoading(false) })
      .catch(() => { setError('Could not load service requests.'); setLoading(false) })
  }, [])

  const filtered = requests.filter(r =>
    `${r.firstName} ${r.lastName} ${r.email} ${r.serviceType} ${r.status}`.toLowerCase().includes(search.toLowerCase())
  )

  const pending = requests.filter(r => r.status === 'pending' || r.status === 'new').length

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <SectionHeader
        title="Service Requests"
        sub={`${requests.length} total · ${pending} pending review`}
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search requests..." />}
      />
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Client', 'Service', 'Contact', 'Preferred Date', 'Status', 'Received']}
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
            <StatusBadge key="status" status={r.status} />,
            <span key="created" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}
