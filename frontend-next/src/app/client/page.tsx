'use client'

import PortalShell from '@/components/portal/PortalShell'
import { getNmdUser } from '@/lib/authStorage'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const PORTAL_LINKS = [
  { href: '/client/estimates', label: 'My Estimates', icon: '📋', desc: 'View Guru estimates submitted for review' },
  { href: '/client/quotes', label: 'My Quotes', icon: '💰', desc: 'View and accept quotes from NMD' },
  { href: '/client/invoices', label: 'My Invoices', icon: '🧾', desc: 'View and pay invoices' },
  { href: '/client/appointments', label: 'My Appointments', icon: '📅', desc: 'Upcoming and past service appointments' },
  { href: '/client/recurring', label: 'Recurring Services', icon: '🔄', desc: 'Manage your recurring service plan' },
  { href: '/client/requests', label: 'Service Requests', icon: '📝', desc: 'Track your service requests' },
  { href: '/client/photos', label: 'My Photos', icon: '📷', desc: 'Before and after job photos' },
  { href: '/client/request-service', label: 'Request a Service', icon: '➕', desc: 'Submit a new service request or quote' },
]

export default function ClientDashboardPage() {
  const [name, setName] = useState('')
  useEffect(() => {
    const user = getNmdUser()
    setName(user?.displayName || user?.name || user?.email || 'Client')
  }, [])

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1f6132', marginBottom: '0.5rem' }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Welcome back, {name.split(' ')[0]}.
        </h1>
        <p style={{ color: '#5a6a88', fontSize: '0.9rem' }}>Manage your services, quotes, invoices, and appointments with NMD Pressure Washing Services LLC.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {PORTAL_LINKS.map(link => (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', border: '1.5px solid #dde4ef', borderRadius: 12,
              padding: '1.25rem', transition: 'all 0.15s', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2d9b50'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#dde4ef'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: '1.5rem' }}>{link.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0e1117', letterSpacing: '-0.01em' }}>{link.label}</div>
              <div style={{ fontSize: '0.8rem', color: '#8494b0', lineHeight: 1.4 }}>{link.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </PortalShell>
  )
}
