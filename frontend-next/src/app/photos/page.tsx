'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Photo = {
  id: string
  source: 'service_request' | 'job'
  clientName: string
  address: string
  serviceType: string
  photoDataUrl: string
  caption: string | null
  photoType: string | null
  employeeName: string | null
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
    before:    { color: '#7a5c00', bg: '#fff9e6', border: '#f5e6a0' },
    after:     { color: '#1f6132', bg: '#f0fff4', border: '#c0dd97' },
    job:       { color: '#124d83', bg: '#e8f3fd', border: '#96c8f5' },
  }
  const st = map[s] || map.pending
  return { fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 100, color: st.color, background: st.bg, border: `1px solid ${st.border}` }
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selected, setSelected] = useState<Photo | null>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    const token = getNmdToken()

    Promise.all([
      fetch(`${API}/api/requests`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/jobs`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(async ([reqData, jobsData]) => {
      const allPhotos: Photo[] = []

      // Service request photos
      const requests = reqData.requests || reqData || []
      requests.forEach((r: any) => {
        const photoUrl = r.photoDataUrl || r.photo_data_url
        if (!photoUrl) return
        allPhotos.push({
          id: r.id,
          source: 'service_request',
          clientName: `${r.firstName || r.first_name || ''} ${r.lastName || r.last_name || ''}`.trim(),
          address: r.address || '',
          serviceType: r.serviceType || r.service_type || '',
          photoDataUrl: photoUrl,
          caption: r.photoNote || r.photo_note || null,
          photoType: null,
          employeeName: null,
          status: r.status || 'pending',
          createdAt: r.createdAt || r.created_at,
        })
      })

      // Job photos — fetch per job
      const jobs = jobsData.jobs || []
      await Promise.all(jobs.map(async (job: any) => {
        try {
          const res = await fetch(`${API}/api/jobs/${job.id}/photos`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const data = await res.json()
          ;(data.photos || []).forEach((p: any) => {
            allPhotos.push({
              id: p.id,
              source: 'job',
              clientName: job.client_name || '',
              address: job.address || '',
              serviceType: job.title || '',
              photoDataUrl: p.photo_data_url,
              caption: p.caption || null,
              photoType: p.photo_type || 'job',
              employeeName: p.employee_name || null,
              status: p.photo_type || 'job',
              createdAt: p.created_at,
            })
          })
        } catch { /* skip */ }
      }))

      // Sort newest first
      allPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setPhotos(allPhotos)
      setLoading(false)
    }).catch(() => { setError('Could not load photos.'); setLoading(false) })
  }, [])

  const filtered = photos.filter(p => {
    const matchSearch = `${p.clientName} ${p.address} ${p.serviceType} ${p.employeeName || ''}`.toLowerCase().includes(search.toLowerCase())
    const matchSource = sourceFilter === 'all' || p.source === sourceFilter
    return matchSearch && matchSource
  })

  const srCount = photos.filter(p => p.source === 'service_request').length
  const jobCount = photos.filter(p => p.source === 'job').length

  return (
    <PortalShell requiredRole={['admin', 'superadmin', 'employee']}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>NMD Portal</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>Job Photos</h1>
          <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Photos from service requests and on-site job uploads.</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#8494b0', fontWeight: 500, alignSelf: 'center' }}>
          {photos.length} total · {srCount} from requests · {jobCount} from jobs
        </div>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by client, address, or service..."
              style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#0e1117', background: 'white', width: 280, outline: 'none' }} />
            {[
              { key: 'all', label: `All (${photos.length})` },
              { key: 'service_request', label: `Service Requests (${srCount})` },
              { key: 'job', label: `Job Photos (${jobCount})` },
            ].map(f => (
              <button key={f.key} onClick={() => setSourceFilter(f.key)}
                style={{ padding: '0.35rem 0.85rem', borderRadius: 20, border: `1.5px solid ${sourceFilter === f.key ? '#124d83' : '#dde4ef'}`, background: sourceFilter === f.key ? '#e8f3fd' : 'white', color: sourceFilter === f.key ? '#124d83' : '#5a6a88', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📷</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>No photos yet</div>
              <div style={{ fontSize: '0.85rem', color: '#8494b0', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
                Photos from service requests and job uploads will appear here.
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {filtered.map((p, i) => (
                  <div key={`${p.source}-${p.id}-${i}`} onClick={() => setSelected(p)}
                    style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#124d83')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#dde4ef')}
                  >
                    <img src={p.photoDataUrl} alt={p.caption || p.serviceType}
                      style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0e1117' }}>{p.clientName || '—'}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {p.photoType && <span style={statusStyle(p.photoType)}>{p.photoType}</span>}
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: p.source === 'job' ? '#6b21a8' : '#1f6132', background: p.source === 'job' ? '#f3e8ff' : '#f0fff4', border: `1px solid ${p.source === 'job' ? '#d8b4fe' : '#c0dd97'}` }}>
                            {p.source === 'job' ? 'Job' : 'Request'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#124d83', fontWeight: 500, marginBottom: 2 }}>{p.serviceType}</div>
                      <div style={{ fontSize: '0.78rem', color: '#8494b0', marginBottom: p.caption ? 4 : 0 }}>{p.address}</div>
                      {p.caption && <div style={{ fontSize: '0.78rem', color: '#5a6a88', fontStyle: 'italic', marginBottom: 2 }}>{p.caption}</div>}
                      {p.employeeName && <div style={{ fontSize: '0.72rem', color: '#8494b0' }}>by {p.employeeName}</div>}
                      <div style={{ fontSize: '0.72rem', color: '#8494b0', marginTop: 4 }}>{fmtDate(p.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lightbox */}
              {selected && (
                <div onClick={() => setSelected(null)}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', maxWidth: 700, width: '100%', boxShadow: '0 20px 60px rgba(14,17,23,0.4)' }}>
                    <img src={selected.photoDataUrl} alt={selected.caption || selected.serviceType}
                      style={{ width: '100%', maxHeight: 500, objectFit: 'contain', display: 'block', background: '#0e1117' }} />
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>{selected.clientName}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {selected.photoType && <span style={statusStyle(selected.photoType)}>{selected.photoType}</span>}
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 100, color: selected.source === 'job' ? '#6b21a8' : '#1f6132', background: selected.source === 'job' ? '#f3e8ff' : '#f0fff4', border: `1px solid ${selected.source === 'job' ? '#d8b4fe' : '#c0dd97'}` }}>
                            {selected.source === 'job' ? 'Job Photo' : 'Service Request'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#124d83', fontWeight: 600, marginBottom: 4 }}>{selected.serviceType}</div>
                      <div style={{ fontSize: '0.82rem', color: '#5a6a88', marginBottom: selected.caption ? 6 : 0 }}>{selected.address}</div>
                      {selected.caption && <div style={{ fontSize: '0.82rem', color: '#3a4660', fontStyle: 'italic', marginBottom: 6 }}>{selected.caption}</div>}
                      {selected.employeeName && <div style={{ fontSize: '0.78rem', color: '#8494b0', marginBottom: 6 }}>Uploaded by {selected.employeeName}</div>}
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