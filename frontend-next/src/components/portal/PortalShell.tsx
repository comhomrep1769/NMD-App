'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getNmdAuth, clearNmdAuth } from '@/lib/authStorage'
import type { StoredNmdUser } from '@/lib/authStorage'

export default function PortalShell({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: string | string[]
}) {
  const router = useRouter()
  const [user, setUser] = useState<StoredNmdUser | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const auth = getNmdAuth()
    if (!auth?.token) {
      router.replace('/login')
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
        router.replace('/')
        return
      }
    }
    setUser(auth.user)
    setChecked(true)
  }, [router, requiredRole])

  const handleLogout = () => {
    clearNmdAuth()
    router.replace('/')
  }

  if (!checked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', fontFamily: 'DM Sans, sans-serif',
        background: '#f4f7fb', color: '#5a6a88',
      }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Portal top bar */}
      <div style={{
        background: 'white', borderBottom: '1px solid #dde4ef',
        padding: '0 2rem', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #1f6132, #124d83)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.65rem', fontWeight: 800,
          }}>NMD</div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0e1117' }}>
            NMD {user?.role === 'client' ? 'Client' : user?.role === 'employee' ? 'Employee' : 'Admin'} Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.82rem', color: '#5a6a88' }}>
            {user?.displayName || user?.email}
          </span>
          <a href="/" style={{
            fontSize: '0.8rem', color: '#5a6a88',
            padding: '4px 10px', borderRadius: 6,
            border: '1px solid #dde4ef', background: 'white',
          }}>Home</a>
          <button onClick={handleLogout} style={{
            fontSize: '0.8rem', color: '#a32d2d',
            padding: '4px 10px', borderRadius: 6,
            border: '1px solid #f09595', background: '#fcebeb',
            cursor: 'pointer',
          }}>Logout</button>
        </div>
      </div>
      <div style={{ padding: '2rem' }}>{children}</div>
    </div>
  )
}
