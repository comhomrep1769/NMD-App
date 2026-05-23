'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdUser } from '@/lib/authStorage'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const CARDS = [
  { href: '/client/request-service', label: 'Request a Service', icon: '✚', desc: 'Submit a new quote or service request', color: '#eaf7ef', border: '#c0dd97' },
  { href: '/client/quotes', label: 'My Quotes', icon: '💰', desc: 'View and accept quotes from NMD', color: 'white', border: '#dde4ef' },
  { href: '/client/invoices', label: 'My Invoices', icon: '🧾', desc: 'View and pay outstanding invoices', color: 'white', border: '#dde4ef' },
  { href: '/client/appointments', label: 'Appointments', icon: '📅', desc: 'Upcoming and past service visits', color: 'white', border: '#dde4ef' },
  { href: '/client/recurring', label: 'Recurring Plan', icon: '🔄', desc: 'Your 20% recurring discount plan', color: '#e8f3fd', border: '#b5d4f4' },
  { href: '/client/requests', label: 'Service Requests', icon: '📝', desc: 'Track all service request statuses', color: 'white', border: '#dde4ef' },
  { href: '/client/estimates', label: 'My Estimates', icon: '📋', desc: 'Guru estimates submitted for review', color: 'white', border: '#dde4ef' },
  { href: '/client/photos', label: 'My Photos', icon: '📷', desc: 'Before and after job photos', color: 'white', border: '#dde4ef' },
]

export default function ClientDashboardPage() {
  const [name, setName] = useState('')
  const { data, loading } = useClientPortal()

  useEffect(() => {
    const user = getNmdUser()
    setName(user?.displayName || user?.name || user?.email || 'there')
  }, [])

  const unpaidInvoices = data?.invoices?.filter(i => i.status !== 'paid') || []
  const pendingQuotes = data?.quotes?.filter(q => q.status === 'sent') || []

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>
          Welcome back, {name.split(' ')[0]}.
        </h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Manage your services, quotes, invoices, and appointments with NMD Pressure Washing Services LLC.</p>
      </div>

      {/* Alert banners */}
      {!loading && unpaidInvoices.length > 0 && (
        <div style={{ background: '#faeeda', border: '1px solid #fac775', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.875rem', color: '#633806', fontWeight: 500 }}>
            💰 You have {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length > 1 ? 's' : ''} — total {money(unpaidInvoices.reduce((s, i) => s + i.total, 0))}
          </div>
          <Link href="/client/invoices" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#633806', textDecoration: 'none', border: '1px solid #fac775', padding: '3px 10px', borderRadius: 6 }}>View →</Link>
        </div>
      )}
      {!loading && pendingQuotes.length > 0 && (
        <div style={{ background: '#e8f3fd', border: '1px solid #b5d4f4', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.875rem', color: '#0c447c', fontWeight: 500 }}>
            📋 You have {pendingQuotes.length} quote{pendingQuotes.length > 1 ? 's' : ''} waiting for your review
          </div>
          <Link href="/client/quotes" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0c447c', textDecoration: 'none', border: '1px solid #b5d4f4', padding: '3px 10px', borderRadius: 6 }}>Review →</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.875rem' }}>
        {CARDS.map(card => (
          <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: card.color, border: `1.5px solid ${card.border}`, borderRadius: 12, padding: '1.25rem', height: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{card.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#0e1117', marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: '0.78rem', color: '#8494b0', lineHeight: 1.5 }}>{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </PortalShell>
  )
}
