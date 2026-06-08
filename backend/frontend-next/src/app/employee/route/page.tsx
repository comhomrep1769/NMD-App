'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Stop = {
  stop_id: number; job_id: number; stop_order: number
  title: string; client_name: string; address: string
  lat?: number; lng?: number; start_time: string
  notes?: string; departed_at?: string; arrived_at?: string; completed_at?: string
}

declare global {
  interface Window { L: any }
}

export default function EmployeeRoutePage() {
  const API = process.env.NEXT_PUBLIC_API_URL || ''
  const today = new Date().toISOString().split('T')[0]

  const [date, setDate] = useState(today)
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  // Load Leaflet
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

      const color = isComplete ? '#8494b0' : isArrived ? '#124d83' : isDeparted ? '#e67e22' : '#1f6132'

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:${color};color:white;
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:14px;
          border:3px solid white;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
          font-family:Syne,sans-serif;
          ${isComplete ? 'opacity:0.6' : ''}
        ">${isComplete ? '✓' : stop.stop_order}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      const statusLine = isComplete ? '<span style="color:#1f6132;font-weight:600">✓ Completed</span>'
        : isArrived ? '<span style="color:#124d83;font-weight:600">📍 Arrived</span>'
        : isDeparted ? '<span style="color:#e67e22;font-weight:600">🚗 On the way</span>'
        : '<span style="color:#8494b0">Pending</span>'

      const popup = `
        <div style="font-family:DM Sans,sans-serif;min-width:220px;padding:4px 0">
          <div style="font-family:Syne,sans-serif;font-weight:700;font-size:14px;margin-bottom:4px">${stop.title}</div>
          <div style="font-size:12px;color:#5a6a88;margin-bottom:2px">${stop.client_name}</div>
          <div style="font-size:12px;color:#3a4660;margin-bottom:8px">${stop.address}</div>
          <div style="font-size:12px;margin-bottom:10px">${statusLine}</div>
          ${!isComplete ? `
          <div style="display:flex;flex-direction:column;gap:6px">
            ${!stop.departed_at ? `<button onclick="window.__nmdDepart(${stop.stop_id})" style="padding:7px 12px;border-radius:7px;border:none;background:linear-gradient(135deg,#e67e22,#d35400);color:white;font-weight:700;font-size:12px;cursor:pointer;font-family:DM Sans,sans-serif">🚗 On My Way</button>` : ''}
            ${stop.departed_at && !stop.arrived_at ? `<button onclick="window.__nmdArrive(${stop.stop_id})" style="padding:7px 12px;border-radius:7px;border:none;background:linear-gradient(135deg,#124d83,#1763a8);color:white;font-weight:700;font-size:12px;cursor:pointer;font-family:DM Sans,sans-serif">📍 I've Arrived</button>` : ''}
            ${stop.arrived_at ? `<button onclick="window.__nmdComplete(${stop.stop_id})" style="padding:7px 12px;border-radius:7px;border:none;background:linear-gradient(135deg,#1f6132,#22763c);color:white;font-weight:700;font-size:12px;cursor:pointer;font-family:DM Sans,sans-serif">✅ Job Complete</button>` : ''}
            <a href="https://maps.google.com/?q=${encodeURIComponent(stop.address)}" target="_blank" style="padding:7px 12px;border-radius:7px;border:1.5px solid #dde4ef;background:white;color:#3a4660;font-weight:600;font-size:12px;text-align:center;text-decoration:none;font-family:DM Sans,sans-serif">🗺 Get Directions</a>
          </div>` : ''}
        </div>
      `

      const marker = L.marker([stop.lat, stop.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(popup, { maxWidth: 260 })

      markersRef.current.push(marker)
    })

    const bounds = L.latLngBounds(valid.map(s => [s.lat, s.lng]))
    mapInstance.current.fitBounds(bounds, { padding: [50, 50] })
  }, [])

  const loadRoute = useCallback(async () => {
    setLoading(true)
    setError('')
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/routes/my-route?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStops(data.stops || [])
      setTimeout(() => {
        if (window.L) { initMap(); renderMarkers(data.stops || []) }
      }, 500)
    } catch {
      setError('Could not load your route.')
    }
    setLoading(false)
  }, [date, API, renderMarkers])

  useEffect(() => { loadRoute() }, [loadRoute])

  // Expose action handlers to map popup buttons
  useEffect(() => {
    const makeHandler = (endpoint: string) => async (stopId: number) => {
      setActionLoading(`${stopId}-${endpoint}`)
      const token = getNmdToken()
      try {
        const res = await fetch(`${API}/api/routes/stops/${stopId}/${endpoint}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.smsSent) {
          // show brief feedback
        }
        await loadRoute()
      } catch {
        alert('Action failed. Please try again.')
      }
      setActionLoading(null)
      if (mapInstance.current) mapInstance.current.closePopup()
    }

    ;(window as any).__nmdDepart = makeHandler('depart')
    ;(window as any).__nmdArrive = makeHandler('arrive')
    ;(window as any).__nmdComplete = makeHandler('complete')
  }, [API, loadRoute])

  const fmt = (dt: string | null | undefined) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const fmtDate = (dt: string) => new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const getStopStatus = (stop: Stop) => {
    if (stop.completed_at) return { label: 'Completed', color: '#1f6132', bg: '#f0fff4', border: '#c0dd97' }
    if (stop.arrived_at) return { label: 'Arrived', color: '#124d83', bg: '#e8f3fd', border: '#96c8f5' }
    if (stop.departed_at) return { label: 'On the way', color: '#e67e22', bg: '#fff9e6', border: '#f5e6a0' }
    return { label: 'Pending', color: '#8494b0', bg: '#f4f7fb', border: '#dde4ef' }
  }

  const completedCount = stops.filter(s => s.completed_at).length

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Route</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Your assigned stops for the day. Tap a pin on the map to take action.</p>
      </div>

      {/* Date picker + progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#0e1117', background: 'white' }}
        />
        {stops.length > 0 && (
          <div style={{ fontSize: '0.85rem', color: '#5a6a88', fontWeight: 500 }}>
            {completedCount}/{stops.length} stops complete
          </div>
        )}
        {stops.length > 0 && (
          <div style={{ flex: 1, minWidth: 120, height: 6, background: '#dde4ef', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(completedCount / stops.length) * 100}%`, background: 'linear-gradient(90deg, #1f6132, #124d83)', borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
        )}
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {actionLoading && (
        <div style={{ background: '#f0fff4', border: '1px solid #c0dd97', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#1f6132', fontWeight: 500 }}>
          Sending update...
        </div>
      )}

      {!loading && !error && stops.length === 0 && (
        <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8494b0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗺️</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>No route assigned for {fmtDate(date)}</div>
          <div style={{ fontSize: '0.875rem' }}>Check back later or contact your admin.</div>
        </div>
      )}

      {!loading && !error && stops.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Map */}
          <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef', overflow: 'hidden' }}>
            <div ref={mapRef} style={{ height: 400, width: '100%' }} />
            <div style={{ padding: '0.75rem 1rem', background: '#f4f7fb', borderTop: '1px solid #dde4ef', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { color: '#1f6132', label: 'Pending' },
                { color: '#e67e22', label: 'On the way' },
                { color: '#124d83', label: 'Arrived' },
                { color: '#8494b0', label: 'Complete' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#5a6a88' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Stop list */}
          <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef', padding: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117', marginBottom: '1rem' }}>
              Stop List
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stops.map(stop => {
                const status = getStopStatus(stop)
                return (
                  <div key={stop.stop_id} style={{ background: '#f4f7fb', borderRadius: 10, border: '1px solid #dde4ef', padding: '1rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: stop.completed_at ? '#dde4ef' : 'linear-gradient(135deg,#1f6132,#124d83)', color: stop.completed_at ? '#8494b0' : 'white', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {stop.completed_at ? '✓' : stop.stop_order}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0e1117' }}>{stop.title}</div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: status.color, background: status.bg, border: `1px solid ${status.border}` }}>
                          {status.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#5a6a88', marginBottom: 2 }}>{stop.client_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#8494b0', marginBottom: stop.notes ? 6 : 0 }}>{stop.address}</div>
                      {stop.notes && (
                        <div style={{ fontSize: '0.78rem', color: '#8494b0', background: 'white', borderRadius: 6, padding: '0.4rem 0.6rem', border: '1px solid #dde4ef', marginBottom: 8 }}>
                          {stop.notes}
                        </div>
                      )}
                      {/* Time log */}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.72rem', color: '#8494b0', marginBottom: 8 }}>
                        {stop.departed_at && <span>🚗 Left: {fmt(stop.departed_at)}</span>}
                        {stop.arrived_at && <span>📍 Arrived: {fmt(stop.arrived_at)}</span>}
                        {stop.completed_at && <span>✅ Done: {fmt(stop.completed_at)}</span>}
                      </div>
                      {/* Action buttons */}
                      {!stop.completed_at && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {!stop.departed_at && (
                            <button
                              onClick={async () => {
                                setActionLoading(`${stop.stop_id}-depart`)
                                const token = getNmdToken()
                                await fetch(`${API}/api/routes/stops/${stop.stop_id}/depart`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                                await loadRoute()
                                setActionLoading(null)
                              }}
                              disabled={!!actionLoading}
                              style={{ padding: '0.45rem 0.9rem', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#e67e22,#d35400)', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                            >
                              🚗 On My Way
                            </button>
                          )}
                          {stop.departed_at && !stop.arrived_at && (
                            <button
                              onClick={async () => {
                                setActionLoading(`${stop.stop_id}-arrive`)
                                const token = getNmdToken()
                                await fetch(`${API}/api/routes/stops/${stop.stop_id}/arrive`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                                await loadRoute()
                                setActionLoading(null)
                              }}
                              disabled={!!actionLoading}
                              style={{ padding: '0.45rem 0.9rem', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#124d83,#1763a8)', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                            >
                              📍 I've Arrived
                            </button>
                          )}
                          {stop.arrived_at && (
                            <button
                              onClick={async () => {
                                setActionLoading(`${stop.stop_id}-complete`)
                                const token = getNmdToken()
                                await fetch(`${API}/api/routes/stops/${stop.stop_id}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                                await loadRoute()
                                setActionLoading(null)
                              }}
                              disabled={!!actionLoading}
                              style={{ padding: '0.45rem 0.9rem', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#1f6132,#22763c)', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                            >
                              ✅ Job Complete
                            </button>
                          )}
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ padding: '0.45rem 0.9rem', borderRadius: 7, border: '1.5px solid #dde4ef', background: 'white', color: '#3a4660', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                          >
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