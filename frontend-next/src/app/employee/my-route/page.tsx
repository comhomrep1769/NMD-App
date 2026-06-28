'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'
import { useSiteContent } from '@/hooks/useSiteContent'

type Stop = {
  stop_id: number; job_id: number; stop_order: number
  title: string; client_name: string; address: string
  lat?: number; lng?: number; start_time: string
  notes?: string; departed_at?: string; arrived_at?: string; completed_at?: string
}

type JobTimeLog = {
  id: string; job_id: string; user_id: string
  clocked_in_at: string; clocked_out_at: string | null; total_minutes: number | null
}

type JobPhoto = {
  id: string; job_id: string; photo_data_url: string; caption: string | null
  photo_type: string; created_at: string
}

declare global {
  interface Window { L: any }
}

function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(since).getTime()
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [since])
  return <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{elapsed}</span>
}

export default function EmployeeRoutePage() {
  const API = process.env.NEXT_PUBLIC_API_URL || ''
  const today = new Date().toISOString().split('T')[0]
  const { content } = useSiteContent()

  const [date, setDate] = useState(today)
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [jobLogs, setJobLogs] = useState<Record<string, JobTimeLog | null>>({})
  const [jobLogLoading, setJobLogLoading] = useState<string | null>(null)

  // Photo state per job
  const [jobPhotos, setJobPhotos] = useState<Record<string, JobPhoto[]>>({})
  const [photoUploading, setPhotoUploading] = useState<string | null>(null)
  const [photoCaption, setPhotoCaption] = useState<Record<string, string>>({})
  const [photoType, setPhotoType] = useState<Record<string, string>>({})
  const [showPhotoPanel, setShowPhotoPanel] = useState<Record<string, boolean>>({})
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (document.getElementById('leaflet-css')) return
    const link = document.createElement('link')
    link.id = 'leaflet-css'
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => initMap()
    document.head.appendChild(script)
  }, [])

  const initMap = () => {
    if (!mapRef.current || mapInstance.current) return
    const L = window.L
    mapInstance.current = L.map(mapRef.current).setView([28.5383, -81.3792], 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance.current)
  }

  const renderMarkers = useCallback((stopList: Stop[]) => {
    if (!mapInstance.current || !window.L) return
    const L = window.L
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    const valid = stopList.filter(s => s.lat && s.lng)
    if (valid.length === 0) return
    valid.forEach(stop => {
      const isComplete = !!stop.completed_at
      const isArrived = !!stop.arrived_at && !isComplete
      const isDeparted = !!stop.departed_at && !isArrived && !isComplete
      const color = isComplete ? '#9CA3AF' : isArrived ? '#1D4ED8' : isDeparted ? '#F59E0B' : '#0F766E'
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);${isComplete ? 'opacity:0.6' : ''}">${isComplete ? '✓' : stop.stop_order}</div>`,
        iconSize: [36, 36], iconAnchor: [18, 18],
      })
      const statusLine = isComplete ? '<span style="color:#059669;font-weight:600">✓ Completed</span>'
        : isArrived ? '<span style="color:#1D4ED8;font-weight:600">📍 Arrived</span>'
        : isDeparted ? '<span style="color:#92400E;font-weight:600">🚗 On the way</span>'
        : '<span style="color:#9CA3AF">Pending</span>'
      const popup = `
        <div style="font-family:DM Sans,sans-serif;min-width:220px;padding:4px 0">
          <div style="font-family:DM Sans,sans-serif;font-weight:700;font-size:14px;margin-bottom:4px">${stop.title}</div>
          <div style="font-size:12px;color:#6B7280;margin-bottom:2px">${stop.client_name}</div>
          <div style="font-size:12px;color:#374151;margin-bottom:8px">${stop.address}</div>
          <div style="font-size:12px;margin-bottom:10px">${statusLine}</div>
          ${!isComplete ? `<div style="display:flex;flex-direction:column;gap:6px">
            ${!stop.departed_at ? `<button onclick="window.__nmdDepart(${stop.stop_id})" style="padding:7px 12px;border-radius:7px;border:none;background:#F59E0B;color:white;font-weight:700;font-size:12px;cursor:pointer;">🚗 On My Way</button>` : ''}
            ${stop.departed_at && !stop.arrived_at ? `<button onclick="window.__nmdArrive(${stop.stop_id})" style="padding:7px 12px;border-radius:7px;border:none;background:#1D4ED8;color:white;font-weight:700;font-size:12px;cursor:pointer;">📍 I've Arrived</button>` : ''}
            ${stop.arrived_at ? `<button onclick="window.__nmdComplete(${stop.stop_id})" style="padding:7px 12px;border-radius:7px;border:none;background:#059669;color:white;font-weight:700;font-size:12px;cursor:pointer;">✅ Job Complete</button>` : ''}
            <a href="https://maps.google.com/?q=${encodeURIComponent(stop.address)}" target="_blank" style="padding:7px 12px;border-radius:7px;border:1px solid #E5E7EB;background:white;color:#374151;font-weight:600;font-size:12px;text-align:center;text-decoration:none;">🗺 Get Directions</a>
          </div>` : ''}
        </div>`
      const marker = L.marker([stop.lat, stop.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(popup, { maxWidth: 260 })
      markersRef.current.push(marker)
    })
    const bounds = L.latLngBounds(valid.map(s => [s.lat, s.lng]))
    mapInstance.current.fitBounds(bounds, { padding: [50, 50] })
  }, [])

  const loadJobLogs = useCallback(async (stopList: Stop[]) => {
    const token = getNmdToken()
    const logs: Record<string, JobTimeLog | null> = {}
    await Promise.all(stopList.map(async stop => {
      try {
        const res = await fetch(`${API}/api/jobs/${stop.job_id}/time-logs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        const active = (data.logs || []).find((l: JobTimeLog) => !l.clocked_out_at) || null
        logs[String(stop.job_id)] = active
      } catch {
        logs[String(stop.job_id)] = null
      }
    }))
    setJobLogs(logs)
  }, [API])

  const loadJobPhotos = useCallback(async (stopList: Stop[]) => {
    const token = getNmdToken()
    const photos: Record<string, JobPhoto[]> = {}
    await Promise.all(stopList.map(async stop => {
      try {
        const res = await fetch(`${API}/api/jobs/${stop.job_id}/photos`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        photos[String(stop.job_id)] = data.photos || []
      } catch {
        photos[String(stop.job_id)] = []
      }
    }))
    setJobPhotos(photos)
  }, [API])

  const loadRoute = useCallback(async () => {
    setLoading(true)
    setError('')
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/routes/my-route?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const stopList = data.stops || []
      setStops(stopList)
      await Promise.all([loadJobLogs(stopList), loadJobPhotos(stopList)])
      setTimeout(() => {
        if (window.L) { initMap(); renderMarkers(stopList) }
      }, 500)
    } catch {
      setError('Could not load your route.')
    }
    setLoading(false)
  }, [date, API, renderMarkers, loadJobLogs, loadJobPhotos])

  useEffect(() => { loadRoute() }, [loadRoute])

  useEffect(() => {
    const makeHandler = (endpoint: string) => async (stopId: number) => {
      setActionLoading(`${stopId}-${endpoint}`)
      const token = getNmdToken()
      try {
        await fetch(`${API}/api/routes/stops/${stopId}/${endpoint}`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }
        })
        await loadRoute()
      } catch { alert('Action failed. Please try again.') }
      setActionLoading(null)
      if (mapInstance.current) mapInstance.current.closePopup()
    }
    ;(window as any).__nmdDepart = makeHandler('depart')
    ;(window as any).__nmdArrive = makeHandler('arrive')
    ;(window as any).__nmdComplete = makeHandler('complete')
  }, [API, loadRoute])

  const handleJobClockIn = async (jobId: number) => {
    setJobLogLoading(`${jobId}-in`)
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/jobs/${jobId}/clock-in`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setJobLogs(p => ({ ...p, [String(jobId)]: data.log }))
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to clock in') }
    setJobLogLoading(null)
  }

  const handleJobClockOut = async (jobId: number) => {
    setJobLogLoading(`${jobId}-out`)
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/jobs/${jobId}/clock-out`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setJobLogs(p => ({ ...p, [String(jobId)]: null }))
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to clock out') }
    setJobLogLoading(null)
  }

  const handlePhotoUpload = async (jobId: number, file: File) => {
    if (file.size > 10_000_000) { alert('Photo too large. Max 10MB.'); return }
    setPhotoUploading(String(jobId))
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      const token = getNmdToken()
      try {
        const res = await fetch(`${API}/api/jobs/${jobId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            photoDataUrl: dataUrl,
            caption: photoCaption[String(jobId)] || null,
            photoType: photoType[String(jobId)] || 'job',
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setJobPhotos(p => ({ ...p, [String(jobId)]: [...(p[String(jobId)] || []), data.photo] }))
        setPhotoCaption(p => ({ ...p, [String(jobId)]: '' }))
        setPhotoType(p => ({ ...p, [String(jobId)]: 'job' }))
      } catch (err) { alert(err instanceof Error ? err.message : 'Upload failed') }
      setPhotoUploading(null)
    }
    reader.readAsDataURL(file)
  }

  const fmt = (dt?: string | null) => dt ? new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'
  const fmtDate = (dt: string) => new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const getStopStatus = (stop: Stop) => {
    if (stop.completed_at) return { label: 'Completed', color: '#059669', bg: '#F0FDF9', border: '#A7F3D0' }
    if (stop.arrived_at) return { label: 'Arrived', color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' }
    if (stop.departed_at) return { label: 'On the way', color: '#92400E', bg: '#FEF9C3', border: '#FDE68A' }
    return { label: 'Pending', color: '#6B7280', bg: '#F8FAF9', border: '#E5E7EB' }
  }
  const completedCount = stops.filter(s => s.completed_at).length

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>{content['employee.my_route.title'] || 'My Route'}</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{content['employee.my_route.subtitle'] || "Your assigned stops for the day. Tap a pin to take action."}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#111827', background: 'white' }} />
        {stops.length > 0 && <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>{completedCount}/{stops.length} stops complete</div>}
        {stops.length > 0 && (
          <div style={{ flex: 1, minWidth: 120, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(completedCount / stops.length) * 100}%`, background: '#0F766E', borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
        )}
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {actionLoading && (
        <div style={{ background: '#F0FDF9', border: '1px solid #A7F3D0', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#059669', fontWeight: 500 }}>
          Sending update...
        </div>
      )}

      {!loading && !error && stops.length === 0 && (
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗺️</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#111827', marginBottom: 8 }}>No route assigned for {fmtDate(date)}</div>
          <div style={{ fontSize: '0.875rem' }}>Check back later or contact your admin.</div>
        </div>
      )}

      {!loading && !error && stops.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div ref={mapRef} style={{ height: 400, width: '100%' }} />
            <div style={{ padding: '0.75rem 1rem', background: '#F8FAF9', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[{ color: '#0F766E', label: 'Pending' }, { color: '#F59E0B', label: 'On the way' }, { color: '#1D4ED8', label: 'Arrived' }, { color: '#9CA3AF', label: 'Complete' }].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#6B7280' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '1rem' }}>Stop List</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stops.map(stop => {
                const status = getStopStatus(stop)
                const activeLog = jobLogs[String(stop.job_id)]
                const isClockedIn = !!activeLog
                const isClockLoading = jobLogLoading === `${stop.job_id}-in` || jobLogLoading === `${stop.job_id}-out`
                const photos = jobPhotos[String(stop.job_id)] || []
                const isPhotoOpen = !!showPhotoPanel[String(stop.job_id)]
                const isUploadingThis = photoUploading === String(stop.job_id)

                return (
                  <div key={stop.stop_id} style={{ background: '#F8FAF9', borderRadius: 10, border: `1px solid ${isClockedIn ? '#A7F3D0' : '#E5E7EB'}`, padding: '1rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: stop.completed_at ? '#E5E7EB' : '#0F766E', color: stop.completed_at ? '#9CA3AF' : 'white', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {stop.completed_at ? '✓' : stop.stop_order}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{stop.title}</div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: status.color, background: status.bg, border: `1px solid ${status.border}` }}>{status.label}</span>
                        {isClockedIn && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: '#059669', background: '#F0FDF9', border: '1px solid #A7F3D0' }}>
                            ⏱ <ElapsedTimer since={activeLog!.clocked_in_at} />
                          </span>
                        )}
                        {photos.length > 0 && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #93C5FD' }}>
                            📷 {photos.length}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: 2 }}>{stop.client_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: stop.notes ? 6 : 0 }}>{stop.address}</div>
                      {stop.notes && <div style={{ fontSize: '0.78rem', color: '#9CA3AF', background: 'white', borderRadius: 6, padding: '0.4rem 0.6rem', border: '1px solid #E5E7EB', marginBottom: 8 }}>{stop.notes}</div>}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 8 }}>
                        {stop.departed_at && <span>🚗 Left: {fmt(stop.departed_at)}</span>}
                        {stop.arrived_at && <span>📍 Arrived: {fmt(stop.arrived_at)}</span>}
                        {stop.completed_at && <span>✅ Done: {fmt(stop.completed_at)}</span>}
                      </div>

                      {/* Job clock in/out */}
                      {!stop.completed_at && (
                        <div style={{ marginBottom: 8, padding: '0.6rem 0.75rem', borderRadius: 8, background: isClockedIn ? '#F0FDF9' : 'white', border: `1px solid ${isClockedIn ? '#A7F3D0' : '#E5E7EB'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ fontSize: '0.75rem', color: isClockedIn ? '#059669' : '#9CA3AF', fontWeight: 600 }}>
                              {isClockedIn ? `⏱ Job time: clocked in at ${fmt(activeLog!.clocked_in_at)}` : '⏱ Job time tracking'}
                            </div>
                            {!isClockedIn ? (
                              <button onClick={() => handleJobClockIn(stop.job_id)} disabled={isClockLoading}
                                style={{ padding: '0.35rem 0.85rem', borderRadius: 6, border: 'none', background: '#0F766E', color: 'white', fontWeight: 700, fontSize: '0.75rem', cursor: isClockLoading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: isClockLoading ? 0.6 : 1 }}>
                                {isClockLoading ? '...' : '▶ Start Job Timer'}
                              </button>
                            ) : (
                              <button onClick={() => handleJobClockOut(stop.job_id)} disabled={isClockLoading}
                                style={{ padding: '0.35rem 0.85rem', borderRadius: 6, border: 'none', background: '#DC2626', color: 'white', fontWeight: 700, fontSize: '0.75rem', cursor: isClockLoading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: isClockLoading ? 0.6 : 1 }}>
                                {isClockLoading ? '...' : '⏹ Stop Job Timer'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Photo section */}
                      <div style={{ marginBottom: 8 }}>
                        <button
                          onClick={() => setShowPhotoPanel(p => ({ ...p, [String(stop.job_id)]: !p[String(stop.job_id)] }))}
                          style={{ padding: '0.35rem 0.85rem', borderRadius: 6, border: '1px solid #E5E7EB', background: isPhotoOpen ? '#F0FDF9' : 'white', color: isPhotoOpen ? '#0F766E' : '#6B7280', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                          📷 Photos {photos.length > 0 ? `(${photos.length})` : ''}
                        </button>

                        {isPhotoOpen && (
                          <div style={{ marginTop: 8, padding: '0.75rem', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                            {/* Existing photos */}
                            {photos.length > 0 && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 12 }}>
                                {photos.map(p => (
                                  <div key={p.id} style={{ position: 'relative' }}>
                                    <img src={p.photo_data_url} alt={p.caption || 'Job photo'}
                                      style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #E5E7EB', display: 'block' }} />
                                    {p.caption && (
                                      <div style={{ fontSize: '0.65rem', color: '#6B7280', marginTop: 3, lineHeight: 1.3 }}>{p.caption}</div>
                                    )}
                                    <div style={{ fontSize: '0.62rem', color: '#9CA3AF', marginTop: 2 }}>
                                      {p.photo_type === 'before' ? '📸 Before' : p.photo_type === 'after' ? '✅ After' : '📷 Job'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Upload new photo */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <select
                                  value={photoType[String(stop.job_id)] || 'job'}
                                  onChange={e => setPhotoType(p => ({ ...p, [String(stop.job_id)]: e.target.value }))}
                                  style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.78rem', fontFamily: 'DM Sans, sans-serif', background: 'white', color: '#111827', flex: 1 }}>
                                  <option value="before">📸 Before</option>
                                  <option value="after">✅ After</option>
                                  <option value="job">📷 During Job</option>
                                </select>
                                <input
                                  value={photoCaption[String(stop.job_id)] || ''}
                                  onChange={e => setPhotoCaption(p => ({ ...p, [String(stop.job_id)]: e.target.value }))}
                                  placeholder="Caption (optional)"
                                  style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: '0.78rem', fontFamily: 'DM Sans, sans-serif', flex: 2, outline: 'none' }}
                                />
                              </div>
                              <input
                                ref={el => { photoInputRefs.current[String(stop.job_id)] = el }}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={e => {
                                  const file = e.target.files?.[0]
                                  if (file) handlePhotoUpload(stop.job_id, file)
                                  e.target.value = ''
                                }}
                              />
                              <button
                                onClick={() => photoInputRefs.current[String(stop.job_id)]?.click()}
                                disabled={isUploadingThis}
                                style={{ padding: '0.5rem 1rem', borderRadius: 7, border: 'none', background: isUploadingThis ? '#E5E7EB' : '#0F766E', color: isUploadingThis ? '#9CA3AF' : 'white', fontWeight: 700, fontSize: '0.8rem', cursor: isUploadingThis ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                                {isUploadingThis ? 'Uploading...' : '📷 Take / Upload Photo'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Route action buttons */}
                      {!stop.completed_at && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {!stop.departed_at && (
                            <button onClick={async () => { setActionLoading(`${stop.stop_id}-depart`); const token = getNmdToken(); await fetch(`${API}/api/routes/stops/${stop.stop_id}/depart`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); await loadRoute(); setActionLoading(null) }} disabled={!!actionLoading}
                              style={{ padding: '0.45rem 0.9rem', borderRadius: 7, border: 'none', background: '#F59E0B', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                              🚗 On My Way
                            </button>
                          )}
                          {stop.departed_at && !stop.arrived_at && (
                            <button onClick={async () => { setActionLoading(`${stop.stop_id}-arrive`); const token = getNmdToken(); await fetch(`${API}/api/routes/stops/${stop.stop_id}/arrive`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); await loadRoute(); setActionLoading(null) }} disabled={!!actionLoading}
                              style={{ padding: '0.45rem 0.9rem', borderRadius: 7, border: 'none', background: '#1D4ED8', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                              📍 I've Arrived
                            </button>
                          )}
                          {stop.arrived_at && (
                            <button onClick={async () => { setActionLoading(`${stop.stop_id}-complete`); const token = getNmdToken(); await fetch(`${API}/api/routes/stops/${stop.stop_id}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); await loadRoute(); setActionLoading(null) }} disabled={!!actionLoading}
                              style={{ padding: '0.45rem 0.9rem', borderRadius: 7, border: 'none', background: '#059669', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                              ✅ Job Complete
                            </button>
                          )}
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '0.45rem 0.9rem', borderRadius: 7, border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                            🗺 Directions
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  )
}