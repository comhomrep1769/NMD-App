'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, StatusBadge, fmtDate } from '@/components/portal/PortalUI'

export default function ClientAppointmentsPage() {
  const { data, loading, error } = useClientPortal()
  const jobs = data?.jobs || []

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Appointments</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>{jobs.length} scheduled service{jobs.length !== 1 ? 's' : ''}.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        jobs.length === 0 ? (
          <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8494b0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>No appointments scheduled</div>
            <div style={{ fontSize: '0.875rem' }}>Once NMD schedules a service for you, it will appear here.</div>
            <a href="/client/request-service" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>Request a Service</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {jobs.map(job => (
              <div key={job.id} style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0e1117', marginBottom: 4 }}>{job.title || job.serviceType}</div>
                  <div style={{ fontSize: '0.82rem', color: '#5a6a88' }}>{job.scheduledDate ? fmtDate(job.scheduledDate) : '—'}{job.startTime ? ` · ${job.startTime}` : ''}</div>
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        )
      )}
    </PortalShell>
  )
}
