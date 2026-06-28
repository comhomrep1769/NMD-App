'use client'

import { useEffect, useRef, useState } from 'react'
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
  client: { icon: '👤', color: '#059669', bg: '#F0FDF9' },
  employee: { icon: '🧰', color: '#1D4ED8', bg: '#EFF6FF' },
  admin: { icon: '⚙️', color: '#6B21A8', bg: '#F5F3FF' },
  system: { icon: '🤖', color: '#92400E', bg: '#FEF9C3' },
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
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
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
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'all' ? activity : activity.filter(a => a.actorType === filter)

  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: '1.5rem' }}>
      {/* ── Collapsed trigger bar — always takes the same small amount of space ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
          padding: '14px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827', letterSpacing: '-0.01em' }}>🔔 Live Activity</span>
          {activity.length > 0 && (
            <span style={{ background: '#0F766E', color: 'white', fontSize: '11px', fontWeight: 700, borderRadius: 100, padding: '2px 8px', minWidth: 20, textAlign: 'center' }}>
              {activity.length}
            </span>
          )}
        </div>
        <span style={{ color: '#9CA3AF', fontSize: '0.8rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
      </button>

      {/* ── Dropdown panel — floats above page content, never pushes layout ── */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
            background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
            padding: '16px 20px', boxShadow: '0 12px 32px rgba(17,24,39,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all', 'client', 'employee', 'admin', 'system'].map(f => (
                  <button key={f} onClick={() => setFilter(f as any)}
                    style={{ padding: '4px 12px', borderRadius: 100, border: `1px solid ${filter === f ? '#0F766E' : '#E5E7EB'}`, background: filter === f ? '#F0FDF9' : 'white', color: filter === f ? '#0F766E' : '#6B7280', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' }}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
            </div>

            {loading && <div style={{ fontSize: '13px', color: '#9CA3AF', padding: '1rem 0' }}>Loading activity...</div>}
            {error && <div style={{ fontSize: '13px', color: '#DC2626', padding: '1rem 0' }}>{error}</div>}

            {!loading && !error && filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: '13px' }}>
                No activity yet. Actions from clients, employees, and admins will appear here in real time.
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 380, overflowY: 'auto' }}>
                {filtered.map(entry => {
                  const style = ACTOR_STYLE[entry.actorType] || ACTOR_STYLE.system
                  return (
                    <div key={entry.id} style={{ display: 'flex', gap: 10, padding: '0.65rem 0.5rem', borderBottom: '1px solid #F9FAFB', alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                        {style.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: '#111827', lineHeight: 1.4 }}>{entry.description}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: style.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{entry.actorType}</span>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{timeAgo(entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function PeriodSnapshot({ data }: { data: DashboardData }) {
  const revenue = data.invoices?.paidTotal ?? 0
  const outstanding = data.invoices?.unpaidTotal ?? 0
  const expensesAmt = data.expenses?.totalAmount ?? 0
  const max = Math.max(revenue, outstanding, expensesAmt, 1)
  const bars = [
    { label: 'Revenue Collected', value: revenue, color: '#0F766E' },
    { label: 'Outstanding', value: outstanding, color: '#F59E0B' },
    { label: 'Total Expenses', value: expensesAmt, color: '#EF4444' },
  ]
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '20px 24px', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: 16 }}>This Period at a Glance</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>{b.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{money(b.value)}</span>
            </div>
            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max((b.value / max) * 100, 2)}%`, background: b.color, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
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
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>NMD Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>Dashboard</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Business overview and key metrics.</p>
      </div>

      {/* Live activity feed — collapsed dropdown, never blocks the rest of the dashboard */}
      <ActivityFeed />

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {data && (
        <>
          <PeriodSnapshot data={data} />

          {/* ── Revenue & Invoices ── */}
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>Revenue & Invoices</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '1.5rem' }}>
            <MetricCard
              label="Revenue Collected"
              value={money(data.invoices?.paidTotal ?? 0)}
              sub={`${data.invoices?.paidCount ?? 0} paid invoice${(data.invoices?.paidCount ?? 0) !== 1 ? 's' : ''}`}
              accent="#0F766E"
            />
            <MetricCard
              label="Outstanding"
              value={money(data.invoices?.unpaidTotal ?? 0)}
              sub={`${data.invoices?.unpaidCount ?? 0} unpaid invoice${(data.invoices?.unpaidCount ?? 0) !== 1 ? 's' : ''}`}
              accent="#EF4444"
            />
            <MetricCard
              label="Total Invoices"
              value={data.invoices?.total ?? 0}
              sub={`${data.invoices?.unpaidCount ?? 0} outstanding`}
              accent="#6D28D9"
            />
            <MetricCard
              label="Est. Monthly Recurring"
              value={money(data.recurring?.estimatedMonthlyRevenue ?? 0)}
              sub={`${data.recurring?.active ?? 0} active plan${(data.recurring?.active ?? 0) !== 1 ? 's' : ''}`}
              accent="#1D4ED8"
            />
          </div>

          {/* ── Clients & Quotes ── */}
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>Clients & Quotes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '1.5rem' }}>
            <MetricCard label="Total Clients" value={data.clients?.total ?? 0} accent="#0F766E" />
            <MetricCard
              label="Total Quotes"
              value={data.quotes?.total ?? 0}
              sub={`${data.quotes?.accepted ?? 0} accepted · ${data.quotes?.sent ?? 0} sent`}
              accent="#1D4ED8"
            />
            <MetricCard
              label="Service Requests"
              value={data.requests?.total ?? 0}
              sub={`${data.requests?.pending ?? 0} pending review`}
              accent="#F59E0B"
            />
            <MetricCard
              label="Recurring Plans"
              value={data.recurring?.total ?? 0}
              sub={`${data.recurring?.active ?? 0} active`}
              accent="#0F766E"
            />
          </div>

          {/* ── Expenses & Mileage ── */}
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>Expenses & Mileage</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '2rem' }}>
            <MetricCard
              label="Total Expenses"
              value={money(data.expenses?.totalAmount ?? 0)}
              sub={`${data.expenses?.total ?? 0} logged`}
              accent="#9CA3AF"
            />
            <MetricCard
              label="Reimbursements Pending"
              value={money(data.expenses?.reimbursementPending ?? 0)}
              accent="#EF4444"
            />
            <MetricCard
              label="Total Miles Driven"
              value={`${(data.mileage?.totalMiles ?? 0).toFixed(1)} mi`}
              sub={`${data.mileage?.total ?? 0} logs`}
              accent="#1D4ED8"
            />
            <MetricCard
              label="Mileage Reimbursement"
              value={money(data.mileage?.reimbursementTotal ?? 0)}
              sub={`${money(data.mileage?.pendingReimbursement ?? 0)} pending`}
              accent="#F59E0B"
            />
          </div>

          {/* ── Quick Actions ── */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Quick Actions</div>
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
                  padding: '8px 16px', borderRadius: 7,
                  border: '1px solid #E5E7EB', background: '#F8FAF9',
                  fontSize: '13px', fontWeight: 500, color: '#374151',
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