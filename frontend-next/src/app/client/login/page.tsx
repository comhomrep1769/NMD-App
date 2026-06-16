import LoginPageClient from '@/components/portal/LoginPageClient'
import Link from 'next/link'

export default function ClientLoginPage() {
  return (
    <div>
      <LoginPageClient portalRole="client" />
      {/* Prominent Create Account banner below login form */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(135deg, #1f6132, #124d83)',
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '1.5rem', flexWrap: 'wrap', zIndex: 50,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif' }}>
          New to NMD Pressure Washing?
        </span>
        <Link href="/client/register" style={{
          padding: '0.5rem 1.25rem', borderRadius: 8,
          background: 'white', color: '#1f6132',
          fontWeight: 700, fontSize: '0.875rem',
          textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
          whiteSpace: 'nowrap',
        }}>
          Create a Free Account →
        </Link>
      </div>
    </div>
  )
}