'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, StatusBadge, fmtDate } from '@/components/portal/PortalUI'

export default function ClientAppointmentsPage() {
  const { data, loading, error } = useClientPortal()
  const jobs = data?.jobs || []

  const today = new Date()
  const upcoming = jobs
    .filter(j => new Date(j.scheduledDate) >= today && j.status !== 'completed' && j.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  const past = jobs
    .filter(j => !upcoming.find(u => u.id === j.id))
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>My Appointments</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{jobs.length} scheduled service{jobs.length !== 1 ? 's' : ''}.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        jobs.length === 0 ? (
          <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#111827', marginBottom: 8 }}>No appointments scheduled</div>
            <div style={{ fontSize: '0.875rem' }}>Once NMD schedules a service for you, it will appear here.</div>
            <a href="/client/request-service" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.25rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>Request a Service</a>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '12px' }}>Upcoming</div>
            {upcoming.length === 0 ? (
              <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '1.5rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '28px' }}>
                No upcoming appointments.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '28px' }}>
                {upcoming.map(job => (
                  <div key={job.id} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderLeft: '3px solid #0F766E', borderRadius: 10, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#111827', marginBottom: 4 }}>{job.title || job.serviceType}</div>
                      <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>{job.scheduledDate ? fmtDate(job.scheduledDate) : '—'}{job.startTime ? ` · ${job.startTime}` : ''}</div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
              </div>
            )}

            {past.length > 0 && (
              <>
                <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '12px' }}>Past</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {past.map(job => (
                    <div key={job.id} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#374151', marginBottom: 4 }}>{job.title || job.serviceType}</div>
                        <div style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>{job.scheduledDate ? fmtDate(job.scheduledDate) : '—'}{job.startTime ? ` · ${job.startTime}` : ''}</div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )
      )}
    </PortalShell>
  )
}