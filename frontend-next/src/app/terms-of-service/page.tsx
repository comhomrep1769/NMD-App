import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | NMD Pressure Washing',
  description: 'Terms of service for NMD Pressure Washing Services LLC.',
}

const DEFAULT = 'Terms of Service content coming soon.'

async function getContent(): Promise<string> {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    const res = await fetch(`${API}/api/site-content`, { cache: 'no-store' })
    if (!res.ok) return DEFAULT
    const data = await res.json()
    return data.content?.['page.terms'] || DEFAULT
  } catch { return DEFAULT }
}

export default async function TermsPage() {
  const content = await getContent()
  const paragraphs = content.split('\n\n').filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <Link href="/" style={{ fontSize: '0.85rem', color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}>← Back to home</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '1.5rem 0 0.5rem', letterSpacing: '-0.025em' }}>Terms of Service</h1>
        <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '2.5rem' }}>NMD Pressure Washing Services LLC</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {paragraphs.map((p, i) => {
            const isHeading = p.length < 60 && !p.includes('.') && i > 0
            return isHeading
              ? <h2 key={i} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginTop: '0.5rem' }}>{p}</h2>
              : <p key={i} style={{ fontSize: '0.95rem', lineHeight: 1.75, color: '#374151' }}>{p}</p>
          })}
        </div>
      </div>
    </div>
  )
}
