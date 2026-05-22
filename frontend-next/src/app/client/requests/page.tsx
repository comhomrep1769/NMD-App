'use client'
import PortalShell from '@/components/portal/PortalShell'
export default function Page() {
  return (
    <PortalShell requiredRole="client">
      <h1 style={{fontFamily:'Syne,sans-serif',fontSize:'1.6rem',fontWeight:700,color:'#0e1117',marginBottom:'0.5rem',letterSpacing:'-0.02em'}}>My Service Requests</h1>
      <p style={{color:'#5a6a88',fontSize:'0.9rem',marginBottom:'1.5rem'}}>Your my service requests from NMD Pressure Washing Services LLC.</p>
      <div style={{background:'white',border:'1px solid #dde4ef',borderRadius:12,padding:'2rem',textAlign:'center',color:'#8494b0'}}>
        <p style={{fontSize:'0.9rem'}}>Loading your requests...</p>
        <p style={{fontSize:'0.8rem',marginTop:'0.5rem'}}>This section connects to the NMD backend to display your data in real time.</p>
        <a href="/client" style={{display:'inline-block',marginTop:'1rem',fontSize:'0.85rem',color:'#1763a8'}}>← Back to portal</a>
      </div>
    </PortalShell>
  )
}
