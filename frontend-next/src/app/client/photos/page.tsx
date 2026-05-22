'use client'
import PortalShell from '@/components/portal/PortalShell'
export default function Page() {
  return (
    <PortalShell requiredRole={"client"}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>NMD Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Photos</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Before and after photos from completed jobs.</p>
      </div>
      <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #eaf7ef, #e8f3fd)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #dde4ef' }}>⏳</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>Coming online</div>
        <div style={{ fontSize: '0.85rem', color: '#8494b0', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>This section connects to the NMD backend. Data will appear here once the portal is fully wired up.</div>
      </div>
    </PortalShell>
  )
}
