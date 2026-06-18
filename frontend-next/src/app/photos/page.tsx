'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type PhotoRequest = {
  id: string
  firstName: string
  lastName: string
  address: string
  serviceType: string
  photoDataUrl: string
  photoNote: string | null
  status: string
  createdAt: string
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusStyle = (s: string): React.CSSProperties => {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    pending:   { color: '#7a5c00', bg: '#fff9e6', border: '#f5e6a0' },
    scheduled: { color: '#124d83', bg: '#e8f3fd', border: '#96c8f5' },
    completed: { color: '#1f6132', bg: '#f0fff4', border: '#c0dd97' },
    cancelled: { color: '#c0392b', bg: '#fff0f0', border: '#ffc0c0' },
  }
  const st = map[s] || map.pending
  return { fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 100, color: st.color, background: st.bg, border: `1px solid ${st.border}` }
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<PhotoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<PhotoRequest | null>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const all = d.requests || d || []
        const withPhotos = all.filter((r: any) => r.photoDataUrl || r.photo_data_url)
        setPhotos(withPhotos.map((r: any) => ({
          id: r.id,
          firstName: r.firstName || r.first_name || '',
          lastName: r.lastName || r.last_name || '',
          address: r.address || '',
          serviceType: r.serviceType || r.service_type || '',
          photoDataUrl: r.photoDataUrl || r.photo_data_url,
          photoNote: r.photoNote || r.photo_note || null,
          status: r.status || 'pending',
          createdAt: r.createdAt || r.created_at,
        })))
        setLoading(false)
      })
      .catch(() => { setError('Could not load photos.'); setLoading(false) })
  }, [])

  const filtered = photos.filter(p =>
    `${p.firstName} ${p.lastName} ${p.address} ${p.serviceType}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PortalShell requiredRole={['admin', 'superadmin', 'employee']}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>NMD Portal</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>Job Photos</h1>
          <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Photos submitted with service requests.</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#8494b0', fontWeight: 500, alignSelf: 'center' }}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''} total
        </div>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <>
          {/* Search */}
          <div style={{ marginBottom: '1.25rem' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by client, address, or service..."
              style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#0e1117', background: 'white', width: 320, outline: 'none' }}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📷</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>No photos yet</div>
              <div style={{ fontSize: '0.85rem', color: '#8494b0', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
                Photos uploaded with service requests will appear here.
              </div>
            </div>
          ) : (
            <>
              {/* Photo grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {filtered.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#124d83')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#dde4ef')}
                  >
                    <img
                      src={p.photoDataUrl}
                      alt={p.photoNote || p.serviceType}
                      style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0e1117' }}>{p.firstName} {p.lastName}</div>
                        <span style={statusStyle(p.status)}>{p.status}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#124d83', fontWeight: 500, marginBottom: 2 }}>{p.serviceType}</div>
                      <div style={{ fontSize: '0.78rem', color: '#8494b0', marginBottom: p.photoNote ? 4 : 0 }}>{p.address}</div>
                      {p.photoNote && <div style={{ fontSize: '0.78rem', color: '#5a6a88', fontStyle: 'italic' }}>{p.photoNote}</div>}
                      <div style={{ fontSize: '0.72rem', color: '#8494b0', marginTop: 6 }}>{fmtDate(p.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lightbox */}
              {selected && (
                <div
                  onClick={() => setSelected(null)}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
                >
                  <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', maxWidth: 700, width: '100%', boxShadow: '0 20px 60px rgba(14,17,23,0.4)' }}>
                    <img src={selected.photoDataUrl} alt={selected.photoNote || selected.serviceType} style={{ width: '100%', maxHeight: 500, objectFit: 'contain', display: 'block', background: '#0e1117' }} />
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>{selected.firstName} {selected.lastName}</div>
                        <span style={statusStyle(selected.status)}>{selected.status}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#124d83', fontWeight: 600, marginBottom: 4 }}>{selected.serviceType}</div>
                      <div style={{ fontSize: '0.82rem', color: '#5a6a88', marginBottom: selected.photoNote ? 6 : 0 }}>{selected.address}</div>
                      {selected.photoNote && <div style={{ fontSize: '0.82rem', color: '#3a4660', fontStyle: 'italic', marginBottom: 6 }}>{selected.photoNote}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <div style={{ fontSize: '0.78rem', color: '#8494b0' }}>{fmtDate(selected.createdAt)}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <a href={selected.photoDataUrl} download={`nmd-photo-${selected.id}.jpg`}
                            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: '#f4f7fb', color: '#3a4660', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>
                            ⬇ Download
                          </a>
                          <button onClick={() => setSelected(null)}
                            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#e74c3c', color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </PortalShell>
  )
}