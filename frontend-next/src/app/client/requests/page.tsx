'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, StatusBadge, fmtDate } from '@/components/portal/PortalUI'
import Link from 'next/link'

export default function ClientRequestsPage() {
  const { data, loading, error } = useClientPortal()
  const requests = data?.serviceRequests || []

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Client Portal</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>Service Requests</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{requests.length} request{requests.length !== 1 ? 's' : ''} submitted.</p>
        </div>
        <Link href="/client/request-service" style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          + New Request
        </Link>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && requests.length === 0 && (
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#111827', marginBottom: 8 }}>No service requests yet</div>
          <div style={{ fontSize: '0.875rem' }}>Submit one to get started.</div>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.map(r => (
            <div key={r.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16 }}>
              {r.photoDataUrl ? (
                <img src={r.photoDataUrl} alt="" style={{ width: 60, height: 48, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 60, height: 48, borderRadius: 7, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>📝</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{r.serviceType || '—'}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: 2 }}>
                  Submitted {fmtDate(r.createdAt)}{r.photoDataUrl ? ' · 1 photo attached' : ''}
                </div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  )
}