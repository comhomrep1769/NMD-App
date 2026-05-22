'use client'
import PortalShell from '@/components/portal/PortalShell'
export default function Page() {
  return (
    <PortalShell requiredRole={['admin','superadmin','employee']}>
      <h1 style={{fontFamily:'Syne,sans-serif',fontSize:'1.6rem',fontWeight:700,color:'#0e1117',marginBottom:'0.5rem',letterSpacing:'-0.02em'}}>Mileage</h1>
      <p style={{color:'#5a6a88',fontSize:'0.9rem',marginBottom:'1.5rem'}}>NMD admin panel — mileage.</p>
      <div style={{background:'white',border:'1px solid #dde4ef',borderRadius:12,padding:'2rem',textAlign:'center',color:'#8494b0'}}>
        <p style={{fontSize:'0.9rem'}}>Loading mileage...</p>
        <p style={{fontSize:'0.8rem',marginTop:'0.5rem'}}>This section connects to the NMD backend API.</p>
        <a href="/dashboard" style={{display:'inline-block',marginTop:'1rem',fontSize:'0.85rem',color:'#1763a8'}}>← Back to dashboard</a>
      </div>
    </PortalShell>
  )
}
