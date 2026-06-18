'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, fmtDate } from '@/components/portal/PortalUI'

export default function ClientPhotosPage() {
  const { data, loading, error } = useClientPortal()

  // Collect all photos from service requests that have a photo attached
  const photos = (data?.serviceRequests || [])
    .filter(r => r.photoDataUrl)
    .map(r => ({
      id: r.id,
      src: r.photoDataUrl!,
      note: r.photoNote || '',
      serviceType: r.serviceType,
      date: r.createdAt,
      status: r.status,
    }))

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Photos</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Photos attached to your service requests.</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && photos.length === 0 && (
        <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #eaf7ef, #e8f3fd)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #dde4ef' }}>📷</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>No photos yet</div>
          <div style={{ fontSize: '0.85rem', color: '#8494b0', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
            When you submit a service request with a photo, it will appear here.
          </div>
        </div>
      )}

      {!loading && !error && photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {photos.map(p => (
            <div key={p.id} style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, overflow: 'hidden' }}>
              <img
                src={p.src}
                alt={p.note || p.serviceType}
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '0.85rem 1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0e1117', marginBottom: 3 }}>{p.serviceType}</div>
                {p.note && <div style={{ fontSize: '0.8rem', color: '#5a6a88', marginBottom: 4, lineHeight: 1.4 }}>{p.note}</div>}
                <div style={{ fontSize: '0.75rem', color: '#8494b0' }}>{fmtDate(p.date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  )
}