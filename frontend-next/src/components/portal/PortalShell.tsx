'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getNmdAuth, clearNmdAuth } from '@/lib/authStorage'
import type { StoredNmdUser } from '@/lib/authStorage'
import Link from 'next/link'

type NavItem = { href: string; label: string; icon: string; group?: string }

const CLIENT_NAV: NavItem[] = [
  { href: '/clientdashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/client/request-service', label: 'Request Service', icon: 'plus' },
  { href: '/client/estimates', label: 'My Estimates', icon: 'quotes' },
  { href: '/client/quotes', label: 'My Quotes', icon: 'quotes' },
  { href: '/client/invoices', label: 'My Invoices', icon: 'invoices' },
  { href: '/client/appointments', label: 'Appointments', icon: 'schedule' },
  { href: '/client/recurring', label: 'Recurring Plan', icon: 'recurring' },
  { href: '/client/requests', label: 'Service Requests', icon: 'requests' },
  { href: '/client/photos', label: 'My Photos', icon: 'photos' },
  { href: '/client/security', label: 'Set Password', icon: 'lock' },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: 'dashboard', group: 'Overview' },
  { href: '/quotes', label: 'Quotes', icon: 'quotes', group: 'Finances' },
  { href: '/invoices', label: 'Invoices', icon: 'invoices', group: 'Finances' },
  { href: '/expenses', label: 'Expenses', icon: 'expenses', group: 'Finances' },
  { href: '/payroll', label: 'Payroll', icon: 'payroll', group: 'Finances' },
  { href: '/mileage', label: 'Mileage', icon: 'mileage', group: 'Finances' },
  { href: '/bonus', label: 'Bonus Tracker', icon: 'bonus', group: 'Finances' },
  { href: '/admin/sales', label: 'Sales & Commissions', icon: 'pricing', group: 'Finances' },
  { href: '/clients', label: 'Clients', icon: 'clients', group: 'Operations' },
  { href: '/requests', label: 'Requests', icon: 'requests', group: 'Operations' },
  { href: '/schedule', label: 'Schedule', icon: 'schedule', group: 'Operations' },
  { href: '/routes', label: 'Route Planner', icon: 'routes', group: 'Operations' },
  { href: '/recurring', label: 'Recurring', icon: 'recurring', group: 'Operations' },
  { href: '/treatments', label: 'Treatments', icon: 'treatments', group: 'Operations' },
  { href: '/photos', label: 'Job Photos', icon: 'photos', group: 'Operations' },
  { href: '/pricing', label: 'Pricing', icon: 'pricing', group: 'Operations' },
  { href: '/employees', label: 'Employees', icon: 'employees', group: 'Team' },
  { href: '/timeclock', label: 'Time Clock', icon: 'timeclock', group: 'Team' },
  { href: '/applicants', label: 'Applicants', icon: 'applicants', group: 'Team' },
  { href: '/chat', label: 'Chat', icon: 'chat', group: 'System' },
  { href: '/guru-training', label: 'Guru Training', icon: 'training', group: 'System' },
  { href: '/site-content', label: 'Site Content', icon: 'edit', group: 'System' },
]

const EMPLOYEE_NAV: NavItem[] = [
  { href: '/dashboard/employee', label: 'Dashboard', icon: 'dashboard', group: 'Today' },
  { href: '/employee/my-route', label: 'My Route', icon: 'routes', group: 'Field Work' },
  { href: '/employee/job-board', label: 'Job Board', icon: 'requests', group: 'Field Work' },
  { href: '/employee/schedule', label: 'My Schedule', icon: 'schedule', group: 'Field Work' },
  { href: '/employee/timeclock', label: 'Time Clock', icon: 'timeclock', group: 'Field Work' },
  { href: '/employee/treatments', label: 'Treatments', icon: 'treatments', group: 'Resources' },
  { href: '/employee/chemicals', label: 'Chemicals', icon: 'flask', group: 'Resources' },
  { href: '/employee/chat', label: 'Chat', icon: 'chat', group: 'Team' },
  { href: '/employee/bonus', label: 'My Bonus', icon: 'bonus', group: 'Team' },
  { href: '/employee/security', label: 'Change Password', icon: 'lock', group: 'Team' },
]

const SALES_NAV: NavItem[] = [
  { href: '/sales', label: 'Dashboard', icon: 'dashboard' },
  { href: '/sales/call-scripts', label: 'Call Scripts', icon: 'chat' },
  { href: '/sales/commissions', label: 'My Commissions', icon: 'pricing' },
  { href: '/employee/timeclock', label: 'Time Clock', icon: 'timeclock' },
]

function NavIcon({ k }: { k: string }) {
  const common = { width: 13, height: 13, viewBox: '0 0 13 13', fill: 'none' as const }
  switch (k) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="1" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
    case 'clients':
      return (
        <svg {...common}>
          <circle cx="6.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 11.5C2 9.3 4 7.5 6.5 7.5C9 7.5 11 9.3 11 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'quotes':
      return (
        <svg {...common}>
          <rect x="1.5" y="1" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 5H9M4 7.5H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'invoices':
      return (
        <svg {...common}>
          <rect x="1" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 5.5H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'requests':
      return (
        <svg {...common}>
          <rect x="1.5" y="1" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 4.5H9M4 7H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'schedule':
      return (
        <svg {...common}>
          <rect x="1" y="2" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 1V3.5M9 1V3.5M1 5.5H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'routes':
      return (
        <svg {...common}>
          <path d="M3 10.5C3 9 3 5 6.5 5C10 5 10 2 10 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="3" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="10" cy="1" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
    case 'recurring':
      return (
        <svg {...common}>
          <path d="M11 6.5C11 9 9 11 6.5 11C4 11 2 9 2 6.5C2 4 4 2 6.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M9 2V5H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'employees':
      return (
        <svg {...common}>
          <circle cx="5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 11C1 8.8 2.8 7 5 7C7.2 7 9 8.8 9 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M9.5 5C10.9 5 12 6.1 12 7.5C12 9 11 10 9.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'treatments':
      return (
        <svg {...common}>
          <path d="M6.5 1L6.5 12M2 3.5L11 3.5M2 8.5L11 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'photos':
      return (
        <svg {...common}>
          <rect x="1" y="3" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="6.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4.5 3L5.25 1.5H7.75L8.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
    case 'chat':
      return (
        <svg {...common}>
          <path d="M1.5 1.5H11.5C11.8 1.5 12 1.7 12 2V8.5C12 8.8 11.8 9 11.5 9H4L1 11.5V2C1 1.7 1.2 1.5 1.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
    case 'pricing':
      return (
        <svg {...common}>
          <path d="M3 9.5L6.5 6L8.5 8L12 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'mileage':
      return (
        <svg {...common}>
          <circle cx="6.5" cy="7.5" r="4" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6.5 1V3.5M6.5 3.5L5 2.5M6.5 3.5L8 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'timeclock':
      return (
        <svg {...common}>
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6.5 3.5V6.5L8.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'expenses':
      return (
        <svg {...common}>
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6.5 4V6.5L8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'payroll':
      return (
        <svg {...common}>
          <rect x="1" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 6H12M4 9H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'bonus':
      return (
        <svg {...common}>
          <path d="M6.5 1.5L8 5H12L9 7.5L10 11L6.5 9L3 11L4 7.5L1 5H5L6.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
    case 'applicants':
      return (
        <svg {...common}>
          <rect x="1.5" y="1" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 5.5H6.5M4 7.5H5.5M7.5 7.5L9 9L11 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'training':
      return (
        <svg {...common}>
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 4.5L9.5 6.5L5 8.5V4.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M6.5 1V12M1 6.5H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )
    case 'flask':
      return (
        <svg {...common}>
          <path d="M5 1H8M5.5 1V5L2.5 10.5C2.2 11 2.6 11.5 3.2 11.5H9.8C10.4 11.5 10.8 11 10.5 10.5L7.5 5V1" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="M6.5 1.5L7.7 3.7L10.3 3.2L9 5.5L10.5 7.5L8 7.8L7 10L6.5 8L5.5 10L4.5 7.8L2 7.5L3.5 5.5L2.2 3.2L4.8 3.7L6.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="2.5" y="6" width="8" height="6" rx="1.3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4.5 6V4.2C4.5 2.7 5.6 1.5 6.5 1.5C7.4 1.5 8.5 2.7 8.5 4.2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6.5" cy="9" r="0.8" fill="currentColor" />
        </svg>
      )

      case 'edit':
  return (
    <svg {...common}>
      <path d="M8 2L11 5L4.5 11.5L1.5 12L2 9L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 3L10 6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )

  
    case 'signout':
      return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M8.5 6.5H1.5M8.5 6.5L6.5 4.5M8.5 6.5L6.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 2H11C11.6 2 12 2.4 12 3V10C12 10.6 11.6 11 11 11H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

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
  const [profilePic, setProfilePic] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileUrlDraft, setProfileUrlDraft] = useState('')
  const profileMenuRef = useRef<HTMLDivElement>(null)

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
      else if (roles.includes('sales')) router.replace('/sales/login')
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
        else if (userRole === 'sales') router.replace('/sales')
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

  useEffect(() => {
    const saved = localStorage.getItem('nmd_profile_pic')
    if (saved) { setProfilePic(saved); setProfileUrlDraft(saved) }
    const onClickAway = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('click', onClickAway)
    return () => document.removeEventListener('click', onClickAway)
  }, [])

  const handleLogout = () => { clearNmdAuth(); router.replace('/') }

  const saveProfileUrl = () => {
    const url = profileUrlDraft.trim()
    if (!url) return
    localStorage.setItem('nmd_profile_pic', url)
    setProfilePic(url)
    setProfileMenuOpen(false)
  }
  const removeProfilePic = () => {
    localStorage.removeItem('nmd_profile_pic')
    setProfilePic(''); setProfileUrlDraft(''); setProfileMenuOpen(false)
  }
  const onProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      localStorage.setItem('nmd_profile_pic', dataUrl)
      setProfilePic(dataUrl); setProfileUrlDraft(dataUrl); setProfileMenuOpen(false)
    }
    reader.readAsDataURL(file)
  }

  if (!checked) return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>NMD</div>
        <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>Loading portal...</div>
      </div>
    </div>
  )

  const role = String(user?.role || '').toLowerCase()
  const isClient = role === 'client'
  const isEmployee = role === 'employee'
  const isSales = role === 'sales'
  const navItems = isClient ? CLIENT_NAV : isEmployee ? EMPLOYEE_NAV : isSales ? SALES_NAV : ADMIN_NAV
  const portalLabel = isClient ? 'Client Portal' : isEmployee ? 'Employee Portal' : isSales ? 'Sales Portal' : role === 'superadmin' ? 'Super Admin Portal' : 'Admin Portal'

  const sidebarVisible = !isMobile || sidebarOpen
  const initials = (user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()
  const activeLabel = navItems.find(n => n.href === pathname)?.label || portalLabel

  const avatarStyle = (size: number, border: string): React.CSSProperties => ({
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    backgroundImage: profilePic ? `url('${profilePic}')` : undefined,
    backgroundSize: 'cover', backgroundPosition: 'center',
    background: profilePic ? undefined : '#0F766E',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border, overflow: 'hidden',
  })

  let lastGroup: string | undefined

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9', fontFamily: 'DM Sans, sans-serif', display: 'flex' }}>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 39 }} />
      )}

      {sidebarVisible && (
        <div style={{ width: 216, height: '100vh', background: '#0F1A18', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 40, flexShrink: 0, overflow: 'hidden' }}>

          <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>NMD Pressure Washing</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', color: '#34D399', textTransform: 'uppercase', marginTop: 3 }}>{portalLabel}</div>
            </Link>
          </div>

          <div style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
            {navItems.map(item => {
              const active = pathname === item.href
              const showHeader = item.group && item.group !== lastGroup
              if (item.group) lastGroup = item.group
              return (
                <div key={item.href}>
                  {showHeader && (
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', padding: lastGroup === navItems[0].group ? '8px 8px 4px' : '12px 8px 4px' }}>
                      {item.group}
                    </div>
                  )}
                  <Link
                    href={item.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, width: '100%',
                      background: active ? 'rgba(15,118,110,0.3)' : 'transparent',
                      color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                      fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer', textAlign: 'left',
                      fontFamily: "'DM Sans',sans-serif", letterSpacing: '-0.005em', textDecoration: 'none',
                    }}
                  >
                    <NavIcon k={item.icon} />
                    {item.label}
                  </Link>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <Link
              href="/mission"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}
            >
              <NavIcon k="star" />
              Our Mission
            </Link>
          </div>

          <div ref={profileMenuRef} style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, position: 'relative' }}>
            {profileMenuOpen && (
              <div style={{ position: 'absolute', bottom: '100%', left: 8, right: 8, background: '#1A2E2A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 14, marginBottom: 6, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Profile Picture</div>
                {profilePic && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                    <div style={avatarStyle(56, '2px solid #34D399')} />
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: 7, background: 'rgba(255,255,255,0.07)', border: '1px dashed rgba(255,255,255,0.18)', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
                  Upload photo
                  <input type="file" accept="image/*" onChange={onProfileFileChange} style={{ display: 'none' }} />
                </label>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 6 }}>or paste a URL</div>
                <input
                  type="text" value={profileUrlDraft} onChange={e => setProfileUrlDraft(e.target.value)} placeholder="https://..."
                  style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 6, fontSize: 12, color: '#fff', outline: 'none', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={saveProfileUrl} style={{ flex: 1, background: '#0F766E', color: '#fff', fontSize: 12, fontWeight: 600, padding: 7, borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Save</button>
                  {profilePic && (
                    <button onClick={removeProfilePic} style={{ padding: '7px 10px', background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Remove</button>
                  )}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 2 }}>
              <div onClick={() => setProfileMenuOpen(o => !o)} style={avatarStyle(28, profilePic ? '2px solid #34D399' : '2px solid transparent')} title="Update profile picture">
                {!profilePic && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', pointerEvents: 'none' }}>{initials}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || 'User'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
              <svg onClick={() => setProfileMenuOpen(o => !o)} width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ cursor: 'pointer', flexShrink: 0 }}>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', borderRadius: 6 }}
            >
              <NavIcon k="signout" />
              Sign out
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, marginLeft: isMobile ? 0 : 216, minHeight: '100vh', display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>

        <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: isMobile ? '0 16px' : '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: '1px solid #E5E7EB', cursor: 'pointer', color: '#111827', padding: '4px 8px', lineHeight: 1, display: 'flex', alignItems: 'center', fontSize: '0.82rem', fontWeight: 700, borderRadius: 6 }} aria-label="Toggle menu">
                {sidebarOpen ? 'X' : 'Menu'}
              </button>
            )}
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827', letterSpacing: '-0.01em' }}>{activeLabel}</span>
          </div>
          <div onClick={() => setProfileMenuOpen(o => !o)} style={avatarStyle(32, profilePic ? '2px solid #0F766E' : 'none')} title="Update profile picture">
            {!profilePic && <span style={{ fontSize: 10, fontWeight: 700, color: '#34D399', pointerEvents: 'none' }}>{initials}</span>}
          </div>
        </div>

        <div style={{ flex: 1, padding: isMobile ? '16px' : '24px 28px', minWidth: 0 }}>
          {children}
        </div>
      </div>

      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onCancel={() => setCropSrc('')}
          onCropDone={(cropped) => {
            setProfileUrl(cropped)
            setCropSrc('')
          }}
        />
      )}
        </div>
  )
}