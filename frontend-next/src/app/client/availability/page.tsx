import Link from 'next/link'

export default function AvailabilityPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #dde4ef', padding: '3rem', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(14,17,23,0.07)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#0e1117', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Check Availability</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          To check available appointment slots, submit a service request and our team will reach out with available dates for your area.
        </p>
        <Link href="/client/request-service" style={{ display: 'inline-block', padding: '0.7rem 1.5rem', borderRadius: 10, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
          Request a Service →
        </Link>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/" style={{ fontSize: '0.82rem', color: '#8494b0' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
