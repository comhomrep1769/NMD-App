'use client'
import { useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import type { JobPhotoEntry } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, fmtDate } from '@/components/portal/PortalUI'

function PhotoThumb({ photo, onClick }: { photo: { src: string; label?: string }; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB', position: 'relative' }}>
      <img src={photo.src} alt={photo.label || ''} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
      {photo.label && (
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: 'rgba(17,24,39,0.75)', color: 'white' }}>
          {photo.label}
        </div>
      )}
    </div>
  )
}

export default function ClientPhotosPage() {
  const { data, loading, error } = useClientPortal()
  const [lightbox, setLightbox] = useState<{ src: string; caption?: string | null } | null>(null)

  // Photos the client submitted with their own service requests
  const requestPhotos = (data?.serviceRequests || [])
    .filter(r => r.photoDataUrl)
    .map(r => ({
      id: r.id,
      src: r.photoDataUrl!,
      note: r.photoNote || '',
      serviceType: r.serviceType,
      date: r.createdAt,
      status: r.status,
    }))

  // Jobs that have at least one on-site photo uploaded by the crew
  const jobsWithPhotos = (data?.jobs || []).filter(j => (j.photos || []).length > 0)

  const labelFor = (type: JobPhotoEntry['photoType']) =>
    type === 'before' ? 'Before' : type === 'after' ? 'After' : 'On the Job'

  const hasAnyPhotos = requestPhotos.length > 0 || jobsWithPhotos.length > 0

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>My Photos</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Before-and-after photos from your jobs, plus anything you submitted with a service request.</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && !hasAnyPhotos && (
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F0FDF9', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #E5E7EB' }}>📷</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: 8 }}>No photos yet</div>
          <div style={{ fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
            Once a job is scheduled and our crew uploads before-and-after photos, they'll show up here.
          </div>
        </div>
      )}

      {!loading && !error && jobsWithPhotos.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '1rem' }}>From Your Jobs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {jobsWithPhotos.map(job => {
              const before = job.photos.filter(p => p.photoType === 'before')
              const after = job.photos.filter(p => p.photoType === 'after')
              const other = job.photos.filter(p => p.photoType !== 'before' && p.photoType !== 'after')
              const primaryBefore = before[before.length - 1]
              const primaryAfter = after[after.length - 1]
              const extras = [...before.slice(0, -1), ...after.slice(0, -1), ...other]

              return (
                <div key={job.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: '0.9rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{job.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{job.address}</div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{fmtDate(job.startTime)}</div>
                  </div>

                  {(primaryBefore || primaryAfter) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: extras.length > 0 ? '0.75rem' : 0 }}>
                      {primaryBefore ? (
                        <PhotoThumb
                          photo={{ src: primaryBefore.photoDataUrl, label: 'Before' }}
                          onClick={() => setLightbox({ src: primaryBefore.photoDataUrl, caption: primaryBefore.caption })}
                        />
                      ) : (
                        <div style={{ height: 160, borderRadius: 8, border: '1.5px dashed #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', color: '#9CA3AF' }}>
                          Before photo not uploaded yet
                        </div>
                      )}
                      {primaryAfter ? (
                        <PhotoThumb
                          photo={{ src: primaryAfter.photoDataUrl, label: 'After' }}
                          onClick={() => setLightbox({ src: primaryAfter.photoDataUrl, caption: primaryAfter.caption })}
                        />
                      ) : (
                        <div style={{ height: 160, borderRadius: 8, border: '1.5px dashed #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', color: '#9CA3AF' }}>
                          After photo not uploaded yet
                        </div>
                      )}
                    </div>
                  )}

                  {extras.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
                      {extras.map(p => (
                        <PhotoThumb
                          key={p.id}
                          photo={{ src: p.photoDataUrl, label: labelFor(p.photoType) }}
                          onClick={() => setLightbox({ src: p.photoDataUrl, caption: p.caption })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && !error && requestPhotos.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '1rem' }}>Submitted with Your Requests</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {requestPhotos.map(p => (
              <div key={p.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <img
                  src={p.src}
                  alt={p.note || p.serviceType}
                  style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                  onClick={() => setLightbox({ src: p.src, caption: p.note })}
                />
                <div style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', marginBottom: 3 }}>{p.serviceType}</div>
                  {p.note && <div style={{ fontSize: '0.8rem', color: '#374151', marginBottom: 4, lineHeight: 1.4 }}>{p.note}</div>}
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{fmtDate(p.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', maxWidth: 700, width: '100%', boxShadow: '0 20px 60px rgba(17,24,39,0.4)' }}>
            <img src={lightbox.src} alt={lightbox.caption || ''} style={{ width: '100%', maxHeight: 500, objectFit: 'contain', display: 'block', background: '#111827' }} />
            <div style={{ padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: '0.85rem', color: '#374151', fontStyle: lightbox.caption ? 'italic' : 'normal' }}>{lightbox.caption || ''}</div>
              <button onClick={() => setLightbox(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  )
}