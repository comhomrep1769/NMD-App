'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Quote = {
  id: string; quoteNumber: number; clientName: string
  serviceType: string; total: number; status: string
  acceptedAt: string | null; createdAt: string
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = getNmdToken()
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/quotes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setQuotes(d.quotes || []); setLoading(false) })
      .catch(() => { setError('Could not load quotes.'); setLoading(false) })
  }, [])

  const filtered = quotes.filter(q =>
    `${q.quoteNumber} ${q.clientName} ${q.serviceType} ${q.status}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <SectionHeader
        title="Quotes"
        sub={`${quotes.length} total quotes`}
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search quotes..." />}
      />
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Quote #', 'Client', 'Service', 'Total', 'Status', 'Created']}
          emptyMessage="No quotes found."
          rows={filtered.map(q => [
            <span key="num" style={{ fontWeight: 700, color: '#124d83' }}>#{q.quoteNumber}</span>,
            <span key="client" style={{ fontWeight: 500 }}>{q.clientName || '—'}</span>,
            <span key="svc" style={{ color: '#5a6a88' }}>{q.serviceType || '—'}</span>,
            <span key="total" style={{ fontWeight: 600 }}>{money(q.total)}</span>,
            <StatusBadge key="status" status={q.status} />,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(q.createdAt)}</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}
