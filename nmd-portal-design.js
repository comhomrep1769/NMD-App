const fs = require('fs');
const path = require('path');
const TARGET = path.join(__dirname, 'frontend-next');

const files = {};

// ─── Portal Shell with sidebar ───
files['src/components/portal/PortalShell.tsx'] = `'use client'

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
]

const EMPLOYEE_NAV = [
  { href: '/employee', label: 'Dashboard', icon: '⊞' },
  { href: '/schedule', label: 'My Schedule', icon: '📅' },
  { href: '/treatments', label: 'Treatments', icon: '🧪' },
  { href: '/photos', label: 'Job Photos', icon: '📷' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/mileage', label: 'Mileage', icon: '🚗' },
  { href: '/timeclock', label: 'Time Clock', icon: '⏱' },
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
    if (!auth?.token) { router.replace('/admin'); return }
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      const userRole = String(auth.user?.role || '').toLowerCase()
      const allowed = roles.some(r => {
        if (r === 'adminOrSuperadmin') return userRole === 'admin' || userRole === 'superadmin'
        return userRole === r.toLowerCase()
      })
      if (!allowed) { router.replace('/'); return }
    }
    setUser(auth.user)
    setChecked(true)
  }, [router, requiredRole])

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

  const sidebarStyle: React.CSSProperties = {
    width: 240, minHeight: '100vh', background: '#0e1117',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, zIndex: 40,
    transition: 'transform 0.25s ease',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', fontFamily: 'DM Sans, sans-serif', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ ...sidebarStyle, transform: sidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'translateX(0)' : 'translateX(-100%)' }}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>NMD</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>NMD Pressure</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>Washing Services LLC</div>
            </div>
          </Link>
        </div>

        {/* Portal label */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{portalLabel}</div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{user?.displayName || user?.email}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.6rem 1.25rem', textDecoration: 'none',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderLeft: active ? '3px solid #2d9b50' : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '0.9rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: active ? 'white' : 'rgba(255,255,255,0.55)' }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '0.6rem', borderRadius: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            transition: 'all 0.15s',
          }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 39 }} />
      )}

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #dde4ef', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#5a6a88', padding: 4 }} className="mobile-menu-btn">
            ☰
          </button>
          <div style={{ fontSize: '0.82rem', color: '#8494b0' }}>
            NMD Pressure Washing Services LLC
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <Link href="/" style={{ fontSize: '0.78rem', color: '#8494b0', padding: '4px 10px', borderRadius: 6, border: '1px solid #dde4ef', textDecoration: 'none' }}>Home</Link>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: '2rem' }}>
          {children}
        </div>
      </div>

      <style>{\`
        @media (max-width: 1024px) {
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 1024px) {
          div[style*="margin-left: 240px"] { margin-left: 0 !important; }
        }
      \`}</style>
    </div>
  )
}
`;

// ─── Client Dashboard ───
files['src/app/client/page.tsx'] = `'use client'
import PortalShell from '@/components/portal/PortalShell'
import { getNmdUser } from '@/lib/authStorage'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const CARDS = [
  { href: '/client/request-service', label: 'Request a Service', icon: '✚', desc: 'Submit a new quote or service request', color: '#eaf7ef', border: '#c0dd97', iconBg: '#1f6132' },
  { href: '/client/estimates', label: 'My Estimates', icon: '📋', desc: 'View Guru estimates submitted for review', color: '#f4f7fb', border: '#dde4ef', iconBg: '#3a4660' },
  { href: '/client/quotes', label: 'My Quotes', icon: '💰', desc: 'View and accept quotes from NMD', color: '#f4f7fb', border: '#dde4ef', iconBg: '#3a4660' },
  { href: '/client/invoices', label: 'My Invoices', icon: '🧾', desc: 'View and pay outstanding invoices', color: '#f4f7fb', border: '#dde4ef', iconBg: '#3a4660' },
  { href: '/client/appointments', label: 'Appointments', icon: '📅', desc: 'Upcoming and past service visits', color: '#f4f7fb', border: '#dde4ef', iconBg: '#3a4660' },
  { href: '/client/recurring', label: 'Recurring Plan', icon: '🔄', desc: 'Manage your 20% recurring discount plan', color: '#e8f3fd', border: '#b5d4f4', iconBg: '#124d83' },
  { href: '/client/requests', label: 'Service Requests', icon: '📝', desc: 'Track all service request statuses', color: '#f4f7fb', border: '#dde4ef', iconBg: '#3a4660' },
  { href: '/client/photos', label: 'My Photos', icon: '📷', desc: 'Before and after job photos', color: '#f4f7fb', border: '#dde4ef', iconBg: '#3a4660' },
]

export default function ClientDashboardPage() {
  const [name, setName] = useState('')
  useEffect(() => {
    const user = getNmdUser()
    setName(user?.displayName || user?.name || user?.email || 'there')
  }, [])

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>
          Welcome back, {name.split(' ')[0]}.
        </h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Manage your services, quotes, invoices, and appointments.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.875rem' }}>
        {CARDS.map(card => (
          <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: card.color, border: \`1.5px solid \${card.border}\`, borderRadius: 12, padding: '1.25rem', transition: 'all 0.15s', cursor: 'pointer', height: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', marginBottom: '0.875rem' }}>{card.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#0e1117', marginBottom: 4, letterSpacing: '-0.01em' }}>{card.label}</div>
              <div style={{ fontSize: '0.78rem', color: '#8494b0', lineHeight: 1.5 }}>{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </PortalShell>
  )
}
`;

// ─── Generic portal page template ───
const makePortalPage = (title, desc, role) => `'use client'
import PortalShell from '@/components/portal/PortalShell'
export default function Page() {
  return (
    <PortalShell requiredRole={${JSON.stringify(role)}}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>NMD Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>${title}</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>${desc}</p>
      </div>
      <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #eaf7ef, #e8f3fd)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #dde4ef' }}>⏳</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>Coming online</div>
        <div style={{ fontSize: '0.85rem', color: '#8494b0', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>This section is connected to the NMD backend. Data will appear here once the portal is fully wired up.</div>
      </div>
    </PortalShell>
  )
}
`;

const adminRole = "['admin','superadmin','employee']";

const pages = {
  'src/app/client/estimates/page.tsx': makePortalPage('My Estimates', 'Guru-assisted estimates submitted for admin review.', 'client'),
  'src/app/client/quotes/page.tsx': makePortalPage('My Quotes', 'Quotes sent by NMD for your approval.', 'client'),
  'src/app/client/invoices/page.tsx': makePortalPage('My Invoices', 'Outstanding and paid invoices from NMD.', 'client'),
  'src/app/client/appointments/page.tsx': makePortalPage('My Appointments', 'Upcoming and completed service appointments.', 'client'),
  'src/app/client/recurring/page.tsx': makePortalPage('Recurring Plan', 'Your recurring service plan with 20% discount.', 'client'),
  'src/app/client/requests/page.tsx': makePortalPage('Service Requests', 'All service requests you have submitted.', 'client'),
  'src/app/client/photos/page.tsx': makePortalPage('My Photos', 'Before and after photos from completed jobs.', 'client'),
  'src/app/dashboard/page.tsx': makePortalPage('Dashboard', 'Business overview, metrics, and quick actions.', adminRole),
  'src/app/clients/page.tsx': makePortalPage('Clients', 'Manage client accounts and service history.', adminRole),
  'src/app/employees/page.tsx': makePortalPage('Employees', 'Manage employee accounts, roles, and pay rates.', adminRole),
  'src/app/quotes/page.tsx': makePortalPage('Quotes', 'Create, review, and send quotes to clients.', adminRole),
  'src/app/invoices/page.tsx': makePortalPage('Invoices', 'Manage invoices, payments, and billing.', adminRole),
  'src/app/requests/page.tsx': makePortalPage('Service Requests', 'Review and process incoming service requests.', adminRole),
  'src/app/schedule/page.tsx': makePortalPage('Schedule', 'Live calendar for jobs, employees, and appointments.', adminRole),
  'src/app/recurring/page.tsx': makePortalPage('Recurring Services', 'Manage recurring service plans and billing cycles.', adminRole),
  'src/app/treatments/page.tsx': makePortalPage('Treatments', 'Chemical treatments, dilution ratios, and safety guides.', adminRole),
  'src/app/photos/page.tsx': makePortalPage('Job Photos', 'Before and after photos for all completed jobs.', adminRole),
  'src/app/chat/page.tsx': makePortalPage('Chat', 'Company-wide and direct messaging.', adminRole),
  'src/app/pricing/page.tsx': makePortalPage('Pricing Reference', 'Admin pricing guide for quotes and estimates.', adminRole),
  'src/app/mileage/page.tsx': makePortalPage('Mileage', 'Track mileage and reimbursements.', adminRole),
  'src/app/timeclock/page.tsx': makePortalPage('Time Clock', 'Clock in/out, breaks, and hours tracking.', adminRole),
  'src/app/expenses/page.tsx': makePortalPage('Expenses', 'Business expenses, receipts, and reimbursements.', adminRole),
  'src/app/payroll/page.tsx': makePortalPage('Payroll', 'Wage balances, bonuses, and payroll management.', adminRole),
  'src/app/employee/page.tsx': makePortalPage('Employee Dashboard', 'Your jobs, schedule, and performance overview.', 'employee'),
};

Object.assign(files, pages);

// Write all files
let count = 0;
for (const [rel, content] of Object.entries(files)) {
  const dest = path.join(TARGET, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
  console.log('✓', rel);
  count++;
}
console.log(\`\nDone! \${count} files written.\`);
console.log('Run: git add . && git commit -m "Premium portal design with sidebar" && git push origin main');