'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Client = {
  id: string; firstName: string; lastName: string
  email: string; phone: string; address: string; createdAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = getNmdToken()
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/clients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setClients(d.clients || []); setLoading(false) })
      .catch(() => { setError('Could not load clients.'); setLoading(false) })
  }, [])

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <SectionHeader
        title="Clients"
        sub={`${clients.length} total clients`}
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />}
      />
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Name', 'Email', 'Phone', 'Address', 'Joined']}
          emptyMessage="No clients found."
          rows={filtered.map(c => [
            <span key="name" style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</span>,
            <a key="email" href={`mailto:${c.email}`} style={{ color: '#124d83', textDecoration: 'none' }}>{c.email || '—'}</a>,
            <span key="phone">{c.phone || '—'}</span>,
            <span key="addr" style={{ color: '#5a6a88', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</span>,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}
