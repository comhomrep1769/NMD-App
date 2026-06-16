'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { MetricCard, LoadingCard, ErrorCard, money } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type DashboardData = {
  clients?: { total: number }
  quotes?: { total: number; accepted: number; sent: number; draft: number }
  invoices?: { total: number; paidCount: number; unpaidCount: number; paidTotal: number; unpaidTotal: number }
  requests?: { total: number; pending: number; reviewed: number; scheduled: number; declined: number }
  expenses?: { total: number; totalAmount: number; reimbursementPending: number }
  mileage?: { total: number; totalMiles: number; reimbursementTotal: number; pendingReimbursement: number }
  recurring?: { total: number; active: number; estimatedMonthlyRevenue: number }
  payroll?: { total: number; draft: number; approved: number; paidInRoll: number }
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
      .then(d => {
        // Backend wraps data in { dashboard: {...} }
        setData(d.dashboard || d)
        setLoading(false)
      })
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
          {/* ── Revenue & Invoices ── */}
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 10 }}>Revenue & Invoices</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <MetricCard
              label="Revenue Collected"
              value={money(data.invoices?.paidTotal ?? 0)}
              sub={`${data.invoices?.paidCount ?? 0} paid invoice${(data.invoices?.paidCount ?? 0) !== 1 ? 's' : ''}`}
              accent="#1f6132"
            />
            <MetricCard
              label="Outstanding"
              value={money(data.invoices?.unpaidTotal ?? 0)}
              sub={`${data.invoices?.unpaidCount ?? 0} unpaid invoice${(data.invoices?.unpaidCount ?? 0) !== 1 ? 's' : ''}`}
              accent="#a32d2d"
            />
            <MetricCard
              label="Total Invoices"
              value={data.invoices?.total ?? 0}
              sub={`${data.invoices?.unpaidCount ?? 0} outstanding`}
              accent="#534ab7"
            />
            <MetricCard
              label="Est. Monthly Recurring"
              value={money(data.recurring?.estimatedMonthlyRevenue ?? 0)}
              sub={`${data.recurring?.active ?? 0} active plan${(data.recurring?.active ?? 0) !== 1 ? 's' : ''}`}
              accent="#124d83"
            />
          </div>

          {/* ── Clients & Quotes ── */}
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 10 }}>Clients & Quotes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <MetricCard label="Total Clients" value={data.clients?.total ?? 0} accent="#1f6132" />
            <MetricCard
              label="Total Quotes"
              value={data.quotes?.total ?? 0}
              sub={`${data.quotes?.accepted ?? 0} accepted · ${data.quotes?.sent ?? 0} sent`}
              accent="#124d83"
            />
            <MetricCard
              label="Service Requests"
              value={data.requests?.total ?? 0}
              sub={`${data.requests?.pending ?? 0} pending review`}
              accent="#633806"
            />
            <MetricCard
              label="Recurring Plans"
              value={data.recurring?.total ?? 0}
              sub={`${data.recurring?.active ?? 0} active`}
              accent="#1f6132"
            />
          </div>

          {/* ── Expenses & Mileage ── */}
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 10 }}>Expenses & Mileage</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <MetricCard
              label="Total Expenses"
              value={money(data.expenses?.totalAmount ?? 0)}
              sub={`${data.expenses?.total ?? 0} logged`}
              accent="#8494b0"
            />
            <MetricCard
              label="Reimbursements Pending"
              value={money(data.expenses?.reimbursementPending ?? 0)}
              accent="#a32d2d"
            />
            <MetricCard
              label="Total Miles Driven"
              value={`${(data.mileage?.totalMiles ?? 0).toFixed(1)} mi`}
              sub={`${data.mileage?.total ?? 0} logs`}
              accent="#124d83"
            />
            <MetricCard
              label="Mileage Reimbursement"
              value={money(data.mileage?.reimbursementTotal ?? 0)}
              sub={`${money(data.mileage?.pendingReimbursement ?? 0)} pending`}
              accent="#633806"
            />
          </div>

          {/* ── Quick Actions ── */}
          <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Quick Actions</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { href: '/clients', label: '+ New Client' },
                { href: '/quotes', label: '+ New Quote' },
                { href: '/invoices', label: '+ New Invoice' },
                { href: '/requests', label: 'View Requests' },
                { href: '/schedule', label: 'View Schedule' },
                { href: '/routes', label: 'Route Planner' },
                { href: '/employees', label: 'Manage Employees' },
                { href: '/payroll', label: 'Payroll' },
              ].map(link => (
                <a key={link.href} href={link.href} style={{
                  padding: '0.55rem 1rem', borderRadius: 8,
                  border: '1.5px solid #dde4ef', background: '#f4f7fb',
                  fontSize: '0.85rem', fontWeight: 500, color: '#3a4660',
                  textDecoration: 'none',
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