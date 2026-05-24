'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getNmdAuth, clearNmdAuth } from '@/lib/authStorage'
import type { StoredNmdUser } from '@/lib/authStorage'
import Link from 'next/link'

const CLIENT_NAV = [
  { href: '/client', label: 'Dashboard', icon: '⊞' },
  { href: '/client/request-service', label: 'Request Service', icon: '✚' },
  { href: '/client/estimates', label: 'My Estimates', icon: '📋' },
  { href: '/client/quotes', label: 'My Quotes', icon: '💰' },
  { href: '/client/invoices', label: 'My Invoices', icon: '🧾' },
  { href: '/client/appointments', label: 'Appointments', icon: '📅' },
  { href: '/client/recurring', label: 'Recurring Plan', icon: '🔄' },
  { href: '/client/requests', label: 'Service Requests', icon: '📝' },
  { href: '/client/photos', label: 'My Photos', icon: '📷' },
]

const ADMIN_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/quotes', label: 'Quotes', icon: '💰' },
  { href: '/invoices', label: 'Invoices', icon: '🧾' },
  { href: '/requests', label: 'Requests', icon: '📝' },
  { href: '/schedule', label: 'Schedule', icon: '📅' },
  { href: '/recurring', label: 'Recurring', icon: '🔄' },
  { href: '/employees', label: 'Employees', icon: '👤' },
  { href: '/treatments', label: 'Treatments', icon: '🧪' },
  { href: '/photos', label: 'Job Photos', icon: '📷' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/pricing', label: 'Pricing', icon: '🏷' },
  { href: '/mileage', label: 'Mileage', icon: '🚗' },
  { href: '/timeclock', label: 'Time Clock', icon: '⏱' },
  { href: '/expenses', label: 'Expenses', icon: '💳' },
  { href: '/payroll', label: 'Payroll', icon: '💵' },
  { href: '/bonus', label: 'Bonus Tracker', icon: '🏆' },
  { href: '/guru-training', label: 'Guru Training', icon: '🧠' },
]

const EMPLOYEE_NAV = [
  { href: '/employee', label: 'Dashboard', icon: '⊞' },
  { href: '/employee/schedule', label: 'My Schedule', icon: '📅' },
  { href: '/employee/treatments', label: 'Treatments', icon: '🧪' },
  { href: '/employee/chat', label: 'Chat', icon: '💬' },
  { href: '/employee/timeclock', label: 'Time Clock', icon: '⏱' },
  { href: '/employee/bonus', label: 'My Bonus', icon: '🏆' },
]

export default function PortalShell({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: string | string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<StoredNmdUser | null>(null)
  const [checked, setChecked] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const auth = getNmdAuth()
    if (!auth?.token) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole || '']
      if (roles.includes('client')) router.replace('/client/login')
      else if (roles.includes('employee')) router.replace('/employee')
      else router.replace('/admin')
      return
    }
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      const userRole = String(auth.user?.role || '').toLowerCase()
      const allowed = roles.some(r => {
        if (r === 'adminOrSuperadmin') return userRole === 'admin' || userRole === 'superadmin'
        return userRole === r.toLowerCase()
      })
      if (!allowed) {
        if (userRole === 'client') router.replace('/client')
        else if (userRole === 'employee') router.replace('/employee')
        else router.replace('/dashboard')
        return
      }
    }
    setUser(auth.user)
    setChecked(true)
  }, [router, requiredRole])

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const handleLogout = () => { clearNmdAuth(); router.replace('/') }

  if (!checked) return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>NMD</div>
        <div style={{ fontSize: '0.85rem', color: '#8494b0' }}>Loading portal...</div>
      </div>
    </div>
  )

  const role = String(user?.role || '').toLowerCase()
  const isClient = role === 'client'
  const isEmployee = role === 'employee'
  const navItems = isClient ? CLIENT_NAV : isEmployee ? EMPLOYEE_NAV : ADMIN_NAV
  const portalLabel = isClient ? 'Client Portal' : isEmployee ? 'Employee Portal' : role === 'superadmin' ? 'Super Admin' : 'Admin Portal'

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 39, display: 'block',
          }}
        />
      )}

      <style>{`
        @media (min-width: 768px) {
          .nmd-sidebar { transform: translateX(0) !important; position: fixed !important; }
          .nmd-main { margin-left: 240px !important; }
          .nmd-mobile-header { display: none !important; }
        }
        @media (max-width: 767px) {
          .nmd-sidebar { transform: translateX(-100%); transition: transform 0.25s ease; }
          .nmd-sidebar.open { transform: translateX(0) !important; }
          .nmd-main { margin-left: 0 !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f4f7fb', fontFamily: 'DM Sans, sans-serif', display: 'flex' }}>

        {/* Sidebar */}
        <div
          className={`nmd-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{
            width: 240, minHeight: '100vh', background: '#0e1117',
            display: 'flex', flexDirection: 'column',
            position: 'fixed', top: 0, left: 0, zIndex: 40, flexShrink: 0,
          }}
        >
          <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>NMD</div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>NMD Pressure</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>Washing Services LLC</div>
              </div>
            </Link>
          </div>

          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{portalLabel}</div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{user?.displayName || user?.email}</div>
          </div>

          <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
            {navItems.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0.6rem 1.25rem', textDecoration: 'none',
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  borderLeft: active ? '3px solid #2d9b50' : '3px solid transparent',
                }}>
                  <span style={{ fontSize: '0.9rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: active ? 'white' : 'rgba(255,255,255,0.55)' }}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Main content */}
        <div
          className="nmd-main"
          style={{ flex: 1, marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
          {/* Top bar */}
          <div style={{ background: 'white', borderBottom: '1px solid #dde4ef', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
            {/* Hamburger — mobile only */}
            <button
              className="nmd-mobile-header"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: '0 0.5rem 0 0', color: '#0e1117', display: 'none' }}
              aria-label="Toggle menu"
            >
              ☰
            </button>

            <div style={{ fontSize: '0.82rem', color: '#8494b0' }}>NMD Pressure Washing Services LLC</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
              <Link href="/" style={{ fontSize: '0.78rem', color: '#8494b0', padding: '4px 10px', borderRadius: 6, border: '1px solid #dde4ef', textDecoration: 'none' }}>Home</Link>
            </div>
          </div>

          <div style={{ flex: 1, padding: '1.5rem' }}>{children}</div>
        </div>
      </div>
    </>
  )
}