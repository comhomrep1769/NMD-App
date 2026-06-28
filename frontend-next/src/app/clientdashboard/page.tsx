'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, MetricCard, money } from '@/components/portal/PortalUI'
import { getNmdUser } from '@/lib/authStorage'
import { useEffect, useState } from 'react'
import Link from 'next/link'

function fmtShortDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

const jobStatusStyle = (status: string): { bg: string; color: string } => {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: '#F0FDF9', color: '#059669' },
    scheduled: { bg: '#EFF6FF', color: '#1D4ED8' },
    in_progress: { bg: '#FEF9C3', color: '#92400E' },
    cancelled: { bg: '#FEF2F2', color: '#B91C1C' },
  }
  return map[status] || { bg: '#F3F4F6', color: '#374151' }
}

export default function ClientDashboardPage() {
  const [name, setName] = useState('')
  const { data, loading, error } = useClientPortal()

  useEffect(() => {
    const user = getNmdUser()
    setName(user?.displayName || user?.name || user?.email || 'there')
  }, [])

  const openRequests = data?.serviceRequests?.filter(r => r.status !== 'declined') || []
  const unpaidInvoices = data?.invoices?.filter(i => i.status !== 'paid') || []
  const pendingQuotes = data?.quotes?.filter(q => q.status === 'sent') || []
  const unpaidTotal = unpaidInvoices.reduce((s, i) => s + i.total, 0)

  const today = new Date()
  const nextJob = (data?.jobs || [])
    .filter(j => new Date(j.scheduledDate) >= today && j.status !== 'cancelled' && j.status !== 'completed')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0] || null

  const activeRecurring = (data?.recurringServices || []).find(r => r.status === 'active') || null

  const recentJobs = [...(data?.jobs || [])]
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
    .slice(0, 5)

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>
          Welcome back, {name.split(' ')[0]}.
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Manage your services, quotes, invoices, and appointments with NMD Pressure Washing Services LLC.</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <MetricCard
              label="Service Requests"
              value={openRequests.length}
              sub="awaiting next step"
              accent="#3B82F6"
            />
            <MetricCard
              label="Open Invoices"
              value={unpaidInvoices.length}
              sub={unpaidInvoices.length > 0 ? `${money(unpaidTotal)} total due` : 'nothing outstanding'}
              accent="#F59E0B"
            />
            <MetricCard
              label="Next Service"
              value={nextJob ? fmtShortDate(nextJob.scheduledDate) : '—'}
              sub={nextJob ? `${nextJob.startTime} · ${nextJob.title}` : 'Nothing scheduled'}
              accent="#0F766E"
            />
            <MetricCard
              label="Recurring Plan"
              value={activeRecurring ? capitalize(activeRecurring.frequency) : 'None'}
              sub={activeRecurring ? `${money(activeRecurring.price)} · Active` : 'Not enrolled'}
              accent="#10B981"
            />
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '28px', flexWrap: 'wrap' }}>
            <Link href="/client/request-service" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0F766E', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '9px 16px', borderRadius: 7, textDecoration: 'none' }}>
              Request a Service
            </Link>
            {unpaidInvoices.length > 0 && (
              <Link href="/client/invoices" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF9C3', color: '#92400E', fontSize: '13px', fontWeight: 600, padding: '9px 16px', borderRadius: 7, textDecoration: 'none' }}>
                {unpaidInvoices.length === 1 ? `Pay Invoice #${unpaidInvoices[0].invoiceNumber}` : `View Unpaid Invoices (${unpaidInvoices.length})`}
              </Link>
            )}
            {pendingQuotes.length > 0 && (
              <Link href="/client/quotes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F3F4F6', color: '#374151', fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: 7, textDecoration: 'none' }}>
                Review Quotes
              </Link>
            )}
            <Link href="/client/photos" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F3F4F6', color: '#374151', fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: 7, textDecoration: 'none' }}>
              View Before/After Photos
            </Link>
          </div>

          {/* Recent jobs */}
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '14px', letterSpacing: '-0.01em' }}>Recent Jobs</div>
          {recentJobs.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
              No jobs on record yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentJobs.map(job => {
                const st = jobStatusStyle(job.status)
                return (
                  <div key={job.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{job.title}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: 2 }}>{fmtShortDate(job.scheduledDate)} · {job.serviceType}</div>
                    </div>
                    <span style={{ fontSize: '11px', background: st.bg, color: st.color, borderRadius: 100, padding: '4px 10px', fontWeight: 600, flexShrink: 0 }}>
                      {capitalize(job.status.replace('_', ' '))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </PortalShell>
  )
}