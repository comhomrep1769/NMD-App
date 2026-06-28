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
      <SectionHeader
        title="Clients"
        sub={`${clients.length} total clients`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />
            <button
              onClick={handleExportCsv}
              disabled={clients.length === 0}
              style={{ padding: '0.6rem 1.1rem', borderRadius: 8, background: clients.length === 0 ? '#E5E7EB' : '#0F766E', color: clients.length === 0 ? '#9CA3AF' : 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none', cursor: clients.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
            >
              ⬇ Export CSV
            </button>
          </div>
        }
      />
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Name', 'Email', 'Phone', 'Address', 'Joined']}
          emptyMessage="No clients found."
          rows={filtered.map(c => [
            <span key="name" style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</span>,
            <a key="email" href={`mailto:${c.email}`} style={{ color: '#0F766E', textDecoration: 'none' }}>{c.email || '—'}</a>,
            <span key="phone">{c.phone || '—'}</span>,
            <span key="addr" style={{ color: '#6B7280', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</span>,
            <span key="date" style={{ color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}