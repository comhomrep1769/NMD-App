'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getNmdAuth, clearNmdAuth } from '@/lib/authStorage'
import type { StoredNmdUser } from '@/lib/authStorage'
import Link from 'next/link'

const CLIENT_NAV = [
  { href: '/clientdashboard', label: 'Dashboard', icon: 'H' },
  { href: '/client/request-service', label: 'Request Service', icon: '+' },
  { href: '/client/estimates', label: 'My Estimates', icon: '~' },
  { href: '/client/quotes', label: 'My Quotes', icon: 'Q' },
  { href: '/client/invoices', label: 'My Invoices', icon: 'Inv' },
  { href: '/client/appointments', label: 'Appointments', icon: 'Apt' },
  { href: '/client/recurring', label: 'Recurring Plan', icon: 'R' },
  { href: '/client/requests', label: 'Service Requests', icon: 'Req' },
  { href: '/client/photos', label: 'My Photos', icon: 'Pho' },
]

const ADMIN_NAV = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: 'H' },
  { href: '/clients', label: 'Clients', icon: 'C' },
  { href: '/quotes', label: 'Quotes', icon: 'Q' },
  { href: '/invoices', label: 'Invoices', icon: 'Inv' },
  { href: '/requests', label: 'Requests', icon: 'Req' },
  { href: '/schedule', label: 'Schedule', icon: 'Sch' },
  { href: '/routes', label: 'Route Planner', icon: 'Rt' },
  { href: '/recurring', label: 'Recurring', icon: 'R' },
  { href: '/employees', label: 'Employees', icon: 'Emp' },
  { href: '/treatments', label: 'Treatments', icon: 'Tx' },
  { href: '/photos', label: 'Job Photos', icon: 'Pho' },
  { href: '/chat', label: 'Chat', icon: 'Msg' },
  { href: '/pricing', label: 'Pricing', icon: 'Pri' },
  { href: '/mileage', label: 'Mileage', icon: 'Mi' },
  { href: '/timeclock', label: 'Time Clock', icon: 'TC' },
  { href: '/expenses', label: 'Expenses', icon: 'Ex' },
  { href: '/payroll', label: 'Payroll', icon: 'Pay' },
  { href: '/bonus', label: 'Bonus Tracker', icon: 'Bon' },
  { href: '/guru-training', label: 'Guru Training', icon: 'AI' },
]

const EMPLOYEE_NAV = [
  { href: '/dashboard/employee', label: 'Dashboard', icon: 'H' },
  { href: '/employee/route', label: 'My Route', icon: 'Rt' },
  { href: '/employee/schedule', label: 'My Schedule', icon: 'Sch' },
  { href: '/employee/job-board', label: 'Job Board', icon: 'Jb' },
  { href: '/employee/treatments', label: 'Treatments', icon: 'Tx' },
  { href: '/employee/chat', label: 'Chat', icon: 'Msg' },
  { href: '/employee/timeclock', label: 'Time Clock', icon: 'TC' },
  { href: '/employee/bonus', label: 'My Bonus', icon: 'Bon' },
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const auth = getNmdAuth()
    if (!auth?.token) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole || '']
      if (roles.includes('client')) router.replace('/client/login')
      else if (roles.includes('employee')) router.replace('/employee/login')
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
        if (userRole === 'client') router.replace('/clientdashboard')
        else if (userRole === 'employee') router.replace('/dashboard/employee')
        else router.replace('/dashboard/admin')
        return
      }
    }
    setUser(auth.user)
    setChecked(true)
  }, [router, requiredRole])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [pathname, isMobile])

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

  const sidebarVisible = !isMobile || sidebarOpen

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', fontFamily: 'DM Sans, sans-serif', display: 'flex' }}>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 39 }} />
      )}

      {sidebarVisible && (
        <div style={{ width: 240, height: '100vh', background: '#0e1117', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 40, flexShrink: 0, transition: 'transform 0.25s ease', overflow: 'hidden' }}>

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
                <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 1.25rem', textDecoration: 'none', background: active ? 'rgba(255,255,255,0.08)' : 'transparent', borderLeft: active ? '3px solid #2d9b50' : '3px solid transparent' }}>
                  <span style={{ fontSize: '0.62rem', width: 26, height: 20, borderRadius: 4, flexShrink: 0, background: active ? 'rgba(45,155,80,0.25)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#2d9b50' : 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '-0.02em' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: active ? 'white' : 'rgba(255,255,255,0.55)' }}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Our Mission */}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/mission" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <span style={{ fontSize: '0.62rem', width: 26, height: 20, borderRadius: 4, flexShrink: 0, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>★</span>
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>Our Mission</span>
            </Link>
          </div>

          <div style={{ padding: '1rem 1.25rem' }}>
          </div>
        </div>
      )}

      <div style={{ flex: 1, marginLeft: isMobile ? 0 : 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        <div style={{ background: 'white', borderBottom: '1px solid #dde4ef', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: '1px solid #dde4ef', cursor: 'pointer', color: '#0e1117', padding: '4px 8px', lineHeight: 1, display: 'flex', alignItems: 'center', fontSize: '0.82rem', fontWeight: 700, borderRadius: 6 }} aria-label="Toggle menu">
                {sidebarOpen ? 'X' : 'Menu'}
              </button>
            )}
            {/* Logout button — top left, always visible */}
            <button
              onClick={handleLogout}
              style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(220,50,50,0.08)', border: '1px solid rgba(220,50,50,0.2)', color: '#c0392b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
            <div style={{ fontSize: '0.82rem', color: '#8494b0' }}>NMD Pressure Washing Services LLC</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <Link href="/mission" style={{ fontSize: '0.78rem', color: '#1f6132', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(31,97,50,0.25)', background: 'rgba(31,97,50,0.05)', textDecoration: 'none', fontWeight: 600 }}>
              Our Mission
            </Link>
            <Link href="/" style={{ fontSize: '0.78rem', color: '#8494b0', padding: '4px 10px', borderRadius: 6, border: '1px solid #dde4ef', textDecoration: 'none' }}>Home</Link>
          </div>
        </div>

        <div style={{ flex: 1, padding: isMobile ? '1rem' : '2rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}