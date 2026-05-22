'use client'
import PortalShell from '@/components/portal/PortalShell'
import { getNmdUser } from '@/lib/authStorage'
import { useEffect, useState } from 'react'
export default function DashboardPage() {
  const [role, setRole] = useState('')
  useEffect(() => { setRole(getNmdUser()?.role || '') }, [])
  return (
    <PortalShell requiredRole={['admin','superadmin','employee']}>
      <h1 style={{fontFamily:'Syne,sans-serif',fontSize:'1.6rem',fontWeight:700,color:'#0e1117',marginBottom:'0.5rem'}}>Dashboard</h1>
      <p style={{color:'#5a6a88',fontSize:'0.9rem'}}>Welcome back. Role: {role}</p>
      <p style={{color:'#8494b0',fontSize:'0.85rem',marginTop:'1rem'}}>Portal dashboard — connect to backend API routes to display metrics, jobs, and activity.</p>
    </PortalShell>
  )
}
