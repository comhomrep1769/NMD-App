'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { MetricCard, LoadingCard, ErrorCard, money } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type DashboardData = {
  clients?: { total: number }
  quotes?: { total: number; accepted: number; sent: number; draft: number }
  invoices?: { total: number; paid_count: number; unpaid_count: number; paid_total: number; unpaid_total: number }
  requests?: { total: number; pending: number; reviewed: number; scheduled: number }
  employees?: { total: number }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getNmdToken()
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/dashboard/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Could not load dashboard data.'); setLoading(false) })
  }, [])

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>NMD Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>Dashboard</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Business overview and key metrics.</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {data && (
        <>
          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <MetricCard label="Total Clients" value={data.clients?.total ?? 0} accent="#1f6132" />
            <MetricCard label="Total Quotes" value={data.quotes?.total ?? 0} sub={`${data.quotes?.accepted ?? 0} accepted · ${data.quotes?.sent ?? 0} sent`} accent="#124d83" />
            <MetricCard label="Revenue Collected" value={money(data.invoices?.paid_total ?? 0)} sub={`${data.invoices?.paid_count ?? 0} paid invoices`} accent="#1f6132" />
            <MetricCard label="Outstanding" value={money(data.invoices?.unpaid_total ?? 0)} sub={`${data.invoices?.unpaid_count ?? 0} unpaid invoices`} accent="#a32d2d" />
            <MetricCard label="Service Requests" value={data.requests?.total ?? 0} sub={`${data.requests?.pending ?? 0} pending review`} accent="#633806" />
            <MetricCard label="Total Invoices" value={data.invoices?.total ?? 0} sub={`${data.invoices?.unpaid_count ?? 0} outstanding`} accent="#534ab7" />
          </div>

          {/* Quick links */}
          <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Quick Actions</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { href: '/clients', label: '+ New Client' },
                { href: '/quotes', label: '+ New Quote' },
                { href: '/invoices', label: '+ New Invoice' },
                { href: '/requests', label: 'View Requests' },
                { href: '/schedule', label: 'View Schedule' },
                { href: '/employees', label: 'Manage Employees' },
              ].map(link => (
                <a key={link.href} href={link.href} style={{
                  padding: '0.55rem 1rem', borderRadius: 8,
                  border: '1.5px solid #dde4ef', background: '#f4f7fb',
                  fontSize: '0.85rem', fontWeight: 500, color: '#3a4660',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </PortalShell>
  )
}
