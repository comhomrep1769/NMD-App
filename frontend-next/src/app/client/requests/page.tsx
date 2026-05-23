'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, DataTable, StatusBadge, fmtDate } from '@/components/portal/PortalUI'
import Link from 'next/link'

export default function ClientRequestsPage() {
  const { data, loading, error } = useClientPortal()
  const requests = data?.serviceRequests || []

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>Service Requests</h1>
          <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>{requests.length} request{requests.length !== 1 ? 's' : ''} submitted.</p>
        </div>
        <Link href="/client/request-service" style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap', marginTop: 4 }}>+ New Request</Link>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={['Service', 'Status', 'Submitted']}
          emptyMessage="No service requests yet. Submit one to get started."
          rows={requests.map(r => [
            <span key="svc" style={{ fontWeight: 500 }}>{r.serviceType || '—'}</span>,
            <StatusBadge key="status" status={r.status} />,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</span>,
          ])}
        />
      )}
    </PortalShell>
  )
}
