'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard, SectionHeader } from '@/components/portal/PortalUI'
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
    pending:   { color: '#92400E', bg: '#FEF9C3', border: '#FDE68A' },
    scheduled: { color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
    completed: { color: '#059669', bg: '#F0FDF9', border: '#A7F3D0' },
    cancelled: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    before:    { color: '#92400E', bg: '#FEF9C3', border: '#FDE68A' },
    after:     { color: '#059669', bg: '#F0FDF9', border: '#A7F3D0' },
    job:       { color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
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
      <SectionHeader
        title="Job Photos"
        sub="Photos from service requests and on-site job uploads."
        action={
          <div style={{ fontSize: '0.85rem', color: '#9CA3AF', fontWeight: 500 }}>
            {photos.length} total · {srCount} from requests · {jobCount} from jobs
          </div>
        }
      />

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by client, address, or service..."
              style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#111827', background: 'white', width: 280, outline: 'none' }} />
            {[
              { key: 'all', label: `All (${photos.length})` },
              { key: 'service_request', label: `Service Requests (${srCount})` },
              { key: 'job', label: `Job Photos (${jobCount})` },
            ].map(f => (
              <button key={f.key} onClick={() => setSourceFilter(f.key)}
                style={{ padding: '0.35rem 0.85rem', borderRadius: 20, border: `1px solid ${sourceFilter === f.key ? '#1D4ED8' : '#E5E7EB'}`, background: sourceFilter === f.key ? '#EFF6FF' : 'white', color: sourceFilter === f.key ? '#1D4ED8' : '#6B7280', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📷</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: 8 }}>No photos yet</div>
              <div style={{ fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
                Photos from service requests and job uploads will appear here.
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {filtered.map((p, i) => (
                  <div key={`${p.source}-${p.id}-${i}`} onClick={() => setSelected(p)}
                    style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#0F766E')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                  >
                    <img src={p.photoDataUrl} alt={p.caption || p.serviceType}
                      style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{p.clientName || '—'}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {p.photoType && <span style={statusStyle(p.photoType)}>{p.photoType}</span>}
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: p.source === 'job' ? '#6D28D9' : '#059669', background: p.source === 'job' ? '#F5F3FF' : '#F0FDF9', border: `1px solid ${p.source === 'job' ? '#DDD6FE' : '#A7F3D0'}` }}>
                            {p.source === 'job' ? 'Job' : 'Request'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#0F766E', fontWeight: 500, marginBottom: 2 }}>{p.serviceType}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: p.caption ? 4 : 0 }}>{p.address}</div>
                      {p.caption && <div style={{ fontSize: '0.78rem', color: '#6B7280', fontStyle: 'italic', marginBottom: 2 }}>{p.caption}</div>}
                      {p.employeeName && <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>by {p.employeeName}</div>}
                      <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>{fmtDate(p.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lightbox */}
              {selected && (
                <div onClick={() => setSelected(null)}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', maxWidth: 700, width: '100%', boxShadow: '0 20px 60px rgba(17,24,39,0.4)' }}>
                    <img src={selected.photoDataUrl} alt={selected.caption || selected.serviceType}
                      style={{ width: '100%', maxHeight: 500, objectFit: 'contain', display: 'block', background: '#111827' }} />
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{selected.clientName}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {selected.photoType && <span style={statusStyle(selected.photoType)}>{selected.photoType}</span>}
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 100, color: selected.source === 'job' ? '#6D28D9' : '#059669', background: selected.source === 'job' ? '#F5F3FF' : '#F0FDF9', border: `1px solid ${selected.source === 'job' ? '#DDD6FE' : '#A7F3D0'}` }}>
                            {selected.source === 'job' ? 'Job Photo' : 'Service Request'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#0F766E', fontWeight: 600, marginBottom: 4 }}>{selected.serviceType}</div>
                      <div style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: selected.caption ? 6 : 0 }}>{selected.address}</div>
                      {selected.caption && <div style={{ fontSize: '0.82rem', color: '#374151', fontStyle: 'italic', marginBottom: 6 }}>{selected.caption}</div>}
                      {selected.employeeName && <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: 6 }}>Uploaded by {selected.employeeName}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{fmtDate(selected.createdAt)}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <a href={selected.photoDataUrl} download={`nmd-photo-${selected.id}.jpg`}
                            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>
                            ⬇ Download
                          </a>
                          <button onClick={() => setSelected(null)}
                            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
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