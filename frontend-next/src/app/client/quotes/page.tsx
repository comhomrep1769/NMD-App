'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, DataTable, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'

export default function ClientQuotesPage() {
  const { data, loading, error } = useClientPortal()
  const quotes = data?.quotes || []

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Quotes</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>{quotes.length} quote{quotes.length !== 1 ? 's' : ''} from NMD Pressure Washing Services LLC.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Quote #', 'Service', 'Total', 'Status', 'Date']}
          emptyMessage="No quotes yet. Request a service to get started."
          rows={quotes.map(q => [
            <span key="num" style={{ fontWeight: 700, color: '#124d83' }}>#{q.quoteNumber}</span>,
            <span key="svc">{q.serviceType || '—'}</span>,
            <span key="total" style={{ fontWeight: 600 }}>{money(q.total)}</span>,
            <StatusBadge key="status" status={q.status} />,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(q.createdAt)}</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}
