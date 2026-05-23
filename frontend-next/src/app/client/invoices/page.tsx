'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, DataTable, StatusBadge, MetricCard, money, fmtDate } from '@/components/portal/PortalUI'

export default function ClientInvoicesPage() {
  const { data, loading, error } = useClientPortal()
  const invoices = data?.invoices || []
  const paid = invoices.filter(i => i.status === 'paid')
  const unpaid = invoices.filter(i => i.status !== 'paid')

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Invoices</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} from NMD Pressure Washing Services LLC.</p>
      </div>

      {!loading && !error && invoices.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <MetricCard label="Outstanding" value={money(unpaid.reduce((s, i) => s + i.total, 0))} sub={`${unpaid.length} unpaid`} accent="#a32d2d" />
          <MetricCard label="Paid" value={money(paid.reduce((s, i) => s + i.total, 0))} sub={`${paid.length} invoices`} accent="#1f6132" />
          <MetricCard label="Total" value={invoices.length} sub="all invoices" accent="#124d83" />
        </div>
      )}

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Invoice #', 'Job', 'Total', 'Status', 'Date', 'Pay']}
          emptyMessage="No invoices yet."
          rows={invoices.map(inv => [
            <span key="num" style={{ fontWeight: 700, color: '#124d83' }}>#{inv.invoiceNumber}</span>,
            <span key="job">{inv.jobName || '—'}</span>,
            <span key="total" style={{ fontWeight: 600 }}>{money(inv.total)}</span>,
            <StatusBadge key="status" status={inv.status} />,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(inv.createdAt)}</span>,
            inv.paymentLinkUrl && inv.status !== 'paid'
              ? <a key="pay" href={inv.paymentLinkUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'white', background: 'linear-gradient(135deg, #1f6132, #124d83)', padding: '4px 12px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}>Pay Now</a>
              : <span key="pay" style={{ color: '#8494b0', fontSize: '0.78rem' }}>{inv.status === 'paid' ? '✅ Paid' : '—'}</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}
