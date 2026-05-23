'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'

export default function ClientRecurringPage() {
  const { data, loading, error } = useClientPortal()
  const services = data?.recurringServices || []

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>Recurring Plan</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Your recurring services with 20% discount applied after the first visit.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        services.length === 0 ? (
          <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8494b0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>No recurring plan active</div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>Start a recurring plan after your first service and save 20% on every future visit.</div>
            <a href="/client/request-service" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>Request a Service</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {services.map(s => (
              <div key={s.id} style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0e1117' }}>{s.serviceType}</div>
                  <StatusBadge status={s.status} />
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: '0.7rem', color: '#8494b0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Frequency</div><div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0e1117', textTransform: 'capitalize' }}>{s.frequency}</div></div>
                  <div><div style={{ fontSize: '0.7rem', color: '#8494b0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Price</div><div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f6132' }}>{money(s.price)}</div></div>
                  <div><div style={{ fontSize: '0.7rem', color: '#8494b0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Next Service</div><div style={{ fontSize: '0.875rem', color: '#0e1117' }}>{s.nextServiceDate ? fmtDate(s.nextServiceDate) : '—'}</div></div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </PortalShell>
  )
}
