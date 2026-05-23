'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, MetricCard, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Invoice = {
  id: string; invoiceNumber: number; clientName: string
  jobName: string; subtotal: number; total: number
  status: string; createdAt: string; paidAt: string | null
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = getNmdToken()
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setInvoices(d.invoices || []); setLoading(false) })
      .catch(() => { setError('Could not load invoices.'); setLoading(false) })
  }, [])

  const filtered = invoices.filter(i =>
    `${i.invoiceNumber} ${i.clientName} ${i.jobName} ${i.status}`.toLowerCase().includes(search.toLowerCase())
  )

  const paid = invoices.filter(i => i.status === 'paid')
  const unpaid = invoices.filter(i => i.status !== 'paid')
  const paidTotal = paid.reduce((s, i) => s + i.total, 0)
  const unpaidTotal = unpaid.reduce((s, i) => s + i.total, 0)

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <SectionHeader
        title="Invoices"
        sub={`${invoices.length} total invoices`}
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search invoices..." />}
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
          headers={['Invoice #', 'Client', 'Job', 'Total', 'Status', 'Created']}
          emptyMessage="No invoices found."
          rows={filtered.map(inv => [
            <span key="num" style={{ fontWeight: 700, color: '#124d83' }}>#{inv.invoiceNumber}</span>,
            <span key="client" style={{ fontWeight: 500 }}>{inv.clientName || '—'}</span>,
            <span key="job" style={{ color: '#5a6a88' }}>{inv.jobName || '—'}</span>,
            <span key="total" style={{ fontWeight: 600 }}>{money(inv.total)}</span>,
            <StatusBadge key="status" status={inv.status} />,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(inv.createdAt)}</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}
