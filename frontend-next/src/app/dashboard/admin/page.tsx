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

type ActivityEntry = {
  id: string
  actorType: 'client' | 'employee' | 'admin' | 'system'
  actorName: string | null
  actorId: string | null
  action: string
  description: string
  metadata: Record<string, any> | null
  createdAt: string
}

const ACTOR_STYLE: Record<string, { icon: string; color: string; bg: string }> = {
  client:   { icon: '👤', color: '#1f6132', bg: '#f0fff4' },
  employee: { icon: '🧰', color: '#124d83', bg: '#e8f3fd' },
  admin:    { icon: '⚙️', color: '#6b21a8', bg: '#f3e8ff' },
  system:   { icon: '🤖', color: '#7a5c00', bg: '#fff9e6' },
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ActivityFeed() {
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'client' | 'employee' | 'admin' | 'system'>('all')
  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const load = () => {
    const token = getNmdToken()
    fetch(`${API}/api/activity?limit=40`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setActivity(d.activity || []); setLoading(false) })
      .catch(() => { setError('Could not load activity.'); setLoading(false) })
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'all' ? activity : activity.filter(a => a.actorType === filter)

  return (
    <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117', letterSpacing: '-0.01em' }}>
          🔔 Live Activity
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'client', 'employee', 'admin', 'system'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)}
              style={{ padding: '0.3rem 0.75rem', borderRadius: 20, border: `1.5px solid ${filter === f ? '#124d83' : '#dde4ef'}`, background: filter === f ? '#e8f3fd' : 'white', color: filter === f ? '#124d83' : '#5a6a88', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ fontSize: '0.85rem', color: '#8494b0', padding: '1rem 0' }}>Loading activity...</div>}
      {error && <div style={{ fontSize: '0.85rem', color: '#c0392b', padding: '1rem 0' }}>{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8494b0', padding: '2rem', fontSize: '0.875rem' }}>
          No activity yet. Actions from clients, employees, and admins will appear here in real time.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 420, overflowY: 'auto' }}>
          {filtered.map(entry => {
            const style = ACTOR_STYLE[entry.actorType] || ACTOR_STYLE.system
            return (
              <div key={entry.id} style={{ display: 'flex', gap: 10, padding: '0.65rem 0.5rem', borderBottom: '1px solid #f4f7fb', alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                  {style.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', color: '#0e1117', lineHeight: 1.4 }}>{entry.description}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: style.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{entry.actorType}</span>
                    <span style={{ fontSize: '0.72rem', color: '#8494b0' }}>{timeAgo(entry.createdAt)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
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

      {/* Live activity feed — always visible regardless of other dashboard data loading state */}
      <ActivityFeed />

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