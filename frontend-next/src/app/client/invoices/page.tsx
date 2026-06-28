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
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>My Invoices</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} from NMD Pressure Washing Services LLC.</p>
      </div>

      {!loading && !error && invoices.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <MetricCard label="Outstanding" value={money(unpaid.reduce((s, i) => s + i.total, 0))} sub={`${unpaid.length} unpaid`} accent="#EF4444" />
          <MetricCard label="Paid" value={money(paid.reduce((s, i) => s + i.total, 0))} sub={`${paid.length} invoices`} accent="#0F766E" />
          <MetricCard label="Total" value={invoices.length} sub="all invoices" accent="#1D4ED8" />
        </div>
      )}

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Invoice #', 'Job', 'Total', 'Status', 'Date', 'Pay']}
          emptyMessage="No invoices yet."
          rows={invoices.map(inv => [
            <span key="num" style={{ fontWeight: 700, color: '#1D4ED8' }}>#{inv.invoiceNumber}</span>,
            <span key="job">{inv.jobName || '—'}</span>,
            <span key="total" style={{ fontWeight: 600, color: inv.status !== 'paid' ? '#92400E' : '#111827' }}>{money(inv.total)}</span>,
            <StatusBadge key="status" status={inv.status} />,
            <span key="date" style={{ color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(inv.createdAt)}</span>,
            inv.paymentLinkUrl && inv.status !== 'paid'
              ? <a key="pay" href={inv.paymentLinkUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'white', background: '#0F766E', padding: '5px 14px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}>Pay Now</a>
              : <span key="pay" style={{ color: '#9CA3AF', fontSize: '0.78rem' }}>—</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}