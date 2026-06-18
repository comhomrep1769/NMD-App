'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, StatusBadge, fmtDate } from '@/components/portal/PortalUI'

export default function ClientEstimatesPage() {
  const { data, loading, error } = useClientPortal()
  const requests = data?.serviceRequests || []

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Estimates</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Service requests and Guru-assisted estimates submitted for admin review.</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && requests.length === 0 && (
        <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #eaf7ef, #e8f3fd)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #dde4ef' }}>📋</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>No estimates yet</div>
          <div style={{ fontSize: '0.85rem', color: '#8494b0', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
            Submit a service request and NMD will review it and send you a quote.
          </div>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(r => (
            <div key={r.id} style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0e1117' }}>{r.serviceType}</div>
                  <div style={{ fontSize: '0.78rem', color: '#8494b0', marginTop: 2 }}>Submitted {fmtDate(r.createdAt)}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {/* Details */}
              <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {r.address && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 3 }}>Address</div>
                    <div style={{ fontSize: '0.875rem', color: '#3a4660' }}>{r.address}</div>
                  </div>
                )}
                {r.preferredDate && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 3 }}>Preferred Date</div>
                    <div style={{ fontSize: '0.875rem', color: '#3a4660' }}>{fmtDate(r.preferredDate)}{r.preferredTime ? ` · ${r.preferredTime}` : ''}</div>
                  </div>
                )}
                {r.notes && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 3 }}>Notes</div>
                    <div style={{ fontSize: '0.875rem', color: '#3a4660', lineHeight: 1.5 }}>{r.notes}</div>
                  </div>
                )}
              </div>

              {/* Photo preview if any */}
              {r.photoDataUrl && (
                <div style={{ padding: '0 1.25rem 1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 6 }}>Photo Attached</div>
                  <img
                    src={r.photoDataUrl}
                    alt={r.photoNote || 'Job photo'}
                    style={{ width: '100%', maxWidth: 320, borderRadius: 10, border: '1.5px solid #dde4ef', objectFit: 'cover', maxHeight: 200 }}
                  />
                  {r.photoNote && <div style={{ fontSize: '0.78rem', color: '#8494b0', marginTop: 6 }}>{r.photoNote}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  )
}