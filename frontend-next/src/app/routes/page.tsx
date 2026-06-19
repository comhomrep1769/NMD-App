'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Job = {
  id: string; title: string; client_name: string; address: string
  start_time: string; lat?: number; lng?: number
  assigned_employees: { id: string; displayName: string }[]
}
type Employee = { id: string; name: string; email: string }
type RouteStop = { stopId: number; jobId: string; stopOrder: number; title: string; clientName: string; address: string; lat?: number; lng?: number; startTime: string }
type Route = { id: number; employee_id: string; employee_name: string; stops: RouteStop[] }

declare global {
  interface Window {
    L: any
    google: any
  }
}

export default function AdminRoutesPage() {
  const API = process.env.NEXT_PUBLIC_API_URL || ''
  const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const getToday = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  const [date, setDate] = useState(getToday)
  const [jobs, setJobs] = useState<Job[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [routeJobIds, setRouteJobIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [mapStatus, setMapStatus] = useState('starting') // starting | leaflet-loaded | map-initialized | failed
  const [placesStatus, setPlacesStatus] = useState('starting') // starting | script-loaded | widget-attached | failed
  const [debugMsg, setDebugMsg] = useState('')

  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const searchMarkerRef = useRef<any>(null)
  const searchDivRef = useRef<HTMLDivElement>(null)
  const placeElementRef = useRef<any>(null)

  // ── STEP 1: Load Leaflet script ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    function waitForLeaflet(attemptsLeft: number) {
      if (cancelled) return
      if (window.L) {
        setMapStatus('leaflet-loaded')
        return
      }
      if (attemptsLeft <= 0) {
        setMapStatus('failed')
        setDebugMsg(prev => prev + ' | Leaflet never loaded after 5s')
        return
      }
      setTimeout(() => waitForLeaflet(attemptsLeft - 1), 100)
    }

    if (window.L) {
      setMapStatus('leaflet-loaded')
    } else {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script')
        script.id = 'leaflet-js'
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        document.head.appendChild(script)
      }
      waitForLeaflet(50) // poll up to 5s
    }

    return () => { cancelled = true }
  }, [])

  // ── STEP 2: Initialize the Leaflet map once the div exists AND L is loaded ──
  useEffect(() => {
    if (mapStatus !== 'leaflet-loaded') return
    if (mapInstance.current) return // already initialized

    let cancelled = false

    function tryInit(attemptsLeft: number) {
      if (cancelled) return
      if (!mapDivRef.current) {
        if (attemptsLeft <= 0) {
          setMapStatus('failed')
          setDebugMsg(prev => prev + ' | mapDivRef never became available after 3s')
          return
        }
        setTimeout(() => tryInit(attemptsLeft - 1), 100)
        return
      }

      try {
        const L = window.L
        mapInstance.current = L.map(mapDivRef.current, { zoomControl: true }).setView([28.5383, -81.3792], 11)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(mapInstance.current)
        setTimeout(() => mapInstance.current?.invalidateSize(), 200)
        setMapStatus('map-initialized')
      } catch (err: any) {
        setMapStatus('failed')
        setDebugMsg(prev => prev + ' | Map init threw: ' + (err?.message || String(err)))
      }
    }

    tryInit(30) // poll up to 3s for the div to mount

    return () => { cancelled = true }
  }, [mapStatus])

  // ── STEP 3: Load Google Places script ────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_KEY) {
      setPlacesStatus('failed')
      setDebugMsg(prev => prev + ' | No GOOGLE_KEY env var')
      return
    }

    let cancelled = false

    function waitForPlaces(attemptsLeft: number) {
      if (cancelled) return
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        setPlacesStatus('script-loaded')
        return
      }
      if (attemptsLeft <= 0) {
        setPlacesStatus('failed')
        setDebugMsg(prev => prev + ' | Google Places never loaded after 8s')
        return
      }
      setTimeout(() => waitForPlaces(attemptsLeft - 1), 100)
    }

    if (window.google?.maps?.places?.PlaceAutocompleteElement) {
      setPlacesStatus('script-loaded')
    } else {
      if (!document.getElementById('google-maps-js')) {
        const script = document.createElement('script')
        script.id = 'google-maps-js'
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&loading=async&v=beta`
        script.async = true
        document.head.appendChild(script)
      }
      waitForPlaces(80) // poll up to 8s
    }

    return () => { cancelled = true }
  }, [GOOGLE_KEY])

  // ── STEP 4: Attach the PlaceAutocompleteElement widget ───────────────────
  useEffect(() => {
    if (placesStatus !== 'script-loaded') return
    if (placeElementRef.current) return // already attached

    let cancelled = false

    function tryAttach(attemptsLeft: number) {
      if (cancelled) return
      if (!searchDivRef.current) {
        if (attemptsLeft <= 0) {
          setPlacesStatus('failed')
          setDebugMsg(prev => prev + ' | searchDivRef never became available after 3s')
          return
        }
        setTimeout(() => tryAttach(attemptsLeft - 1), 100)
        return
      }

      try {
        const google = window.google
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
          includedRegionCodes: ['us'],
        })
        placeAutocomplete.style.width = '100%'
        searchDivRef.current.appendChild(placeAutocomplete)
        placeElementRef.current = placeAutocomplete

        placeAutocomplete.addEventListener('gmp-select', async (event: any) => {
          try {
            const prediction = event.placePrediction
            if (!prediction) return
            const place = prediction.toPlace()
            await place.fetchFields({ fields: ['location', 'formattedAddress', 'displayName'] })
            if (!place.location) return
            const lat = place.location.lat()
            const lng = place.location.lng()
            const address = place.formattedAddress || place.displayName || ''
            flyTo(lat, lng, address)
          } catch (err: any) {
            setDebugMsg(prev => prev + ' | gmp-select handler threw: ' + (err?.message || String(err)))
          }
        })

        setPlacesStatus('widget-attached')
      } catch (err: any) {
        setPlacesStatus('failed')
        setDebugMsg(prev => prev + ' | PlaceAutocompleteElement constructor threw: ' + (err?.message || String(err)))
      }
    }

    tryAttach(30) // poll up to 3s for the div to mount

    return () => { cancelled = true }
  }, [placesStatus])

  // ── Render markers ───────────────────────────────────────────────────────
  const updateMapMarkers = useCallback((jobList: Job[], selectedIds: string[]) => {
    if (!mapInstance.current || !window.L) return
    const L = window.L
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    const valid = jobList.filter(j => j.lat && j.lng)
    if (valid.length === 0) return
    valid.forEach(job => {
      const idx = selectedIds.indexOf(job.id)
      const inRoute = idx >= 0
      const color = inRoute ? '#1f6132' : '#8494b0'
      const label = inRoute ? String(idx + 1) : '•'
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:34px;height:34px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);">${label}</div>`,
        iconSize: [34, 34], iconAnchor: [17, 17],
      })
      const m = L.marker([job.lat, job.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`<div style="font-family:DM Sans,sans-serif;min-width:180px;padding:4px 0"><b>${job.title}</b><br><span style="color:#5a6a88;font-size:12px">${job.client_name}</span><br><span style="color:#3a4660;font-size:12px">${job.address}</span></div>`)
      markersRef.current.push(m)
    })
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(j => [j.lat, j.lng]))
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [])

  useEffect(() => {
    updateMapMarkers(jobs, routeJobIds)
  }, [jobs, routeJobIds, updateMapMarkers])

  // ── Load data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    const token = getNmdToken()
    try {
      const [jobsRes, empRes, routesRes] = await Promise.all([
        fetch(`${API}/api/routes/jobs-for-date?date=${date}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/routes/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/routes?date=${date}`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const jd = await jobsRes.json()
      const ed = await empRes.json()
      const rd = await routesRes.json()
      setJobs(jd.jobs || [])
      setEmployees(ed.employees || [])
      setRoutes(rd.routes || [])
    } catch { setError('Could not load route data.') }
    setLoading(false)
  }, [date, API])

  useEffect(() => { loadData() }, [loadData])

  const flyTo = (lat: number, lng: number, address: string) => {
    if (!mapInstance.current || !window.L) return
    const L = window.L
    mapInstance.current.flyTo([lat, lng], 16, { duration: 1.2 })
    if (searchMarkerRef.current) searchMarkerRef.current.remove()
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;border-radius:50%;background:#e67e22;color:white;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);">📍</div>`,
      iconSize: [32, 32], iconAnchor: [16, 16]
    })
    searchMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(mapInstance.current)
      .bindPopup(`<div style="font-size:12px;max-width:220px;font-family:DM Sans,sans-serif">${address}</div>`)
      .openPopup()
  }

  const selectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp)
    const existing = routes.find(r => r.employee_id === emp.id)
    setRouteJobIds(existing ? existing.stops.sort((a,b) => a.stopOrder - b.stopOrder).map(s => s.jobId) : [])
    setSavedMsg('')
    setTimeout(() => mapInstance.current?.invalidateSize(), 150)
  }

  const addJob = (id: string) => setRouteJobIds(p => p.includes(id) ? p : [...p, id])
  const removeJob = (id: string) => setRouteJobIds(p => p.filter(x => x !== id))

  const handleDragStart = (i: number) => setDragIndex(i)
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) return
    const arr = [...routeJobIds]
    const [m] = arr.splice(dragIndex, 1)
    arr.splice(i, 0, m)
    setRouteJobIds(arr)
    setDragIndex(i)
  }

  const saveRoute = async () => {
    if (!selectedEmployee || routeJobIds.length === 0) return
    setSaving(true)
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employeeId: selectedEmployee.id, date, jobIds: routeJobIds }),
      })
      if (!res.ok) throw new Error()
      setSavedMsg(`Route saved for ${selectedEmployee.name}!`)
      loadData()
    } catch { setError('Failed to save route.') }
    setSaving(false)
  }

  const fmt = (dt?: string | null) => dt ? new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'

  const routeJobs = routeJobIds.map(id => jobs.find(j => j.id === id)).filter(Boolean) as Job[]
  const unassignedJobs = jobs.filter(j => !routeJobIds.includes(j.id))

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Admin Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>Route Planner</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Build and assign employee routes. Select an employee, add jobs, drag to reorder, then save.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#0e1117', background: 'white' }} />
        <span style={{ fontSize: '0.85rem', color: '#8494b0' }}>{jobs.length} job{jobs.length !== 1 ? 's' : ''} available · {employees.length} employee{employees.length !== 1 ? 's' : ''}</span>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* Employee list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 2 }}>Employees</div>
            {employees.map(emp => {
              const hasRoute = routes.some(r => r.employee_id === emp.id)
              const isSel = selectedEmployee?.id === emp.id
              return (
                <button key={emp.id} onClick={() => selectEmployee(emp)}
                  style={{ padding: '0.85rem 1rem', borderRadius: 10, border: `1.5px solid ${isSel ? '#1f6132' : '#dde4ef'}`, background: isSel ? 'rgba(31,97,50,0.06)' : 'white', textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0e1117', marginBottom: 3 }}>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: isSel ? '#1f6132' : '#8494b0' }}>{hasRoute ? '✓ Route assigned' : 'No route yet'}</div>
                </button>
              )
            })}
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Map */}
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #dde4ef', minHeight: 50 }}>
                <div ref={searchDivRef} style={{ width: '100%' }}>
                  {placesStatus !== 'widget-attached' && (
                    <input
                      readOnly
                      placeholder={placesStatus === 'failed' ? 'Search unavailable' : 'Loading search...'}
                      style={{ width: '100%', padding: '0.55rem 0.9rem', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#8494b0', background: '#f0f0f0', boxSizing: 'border-box', outline: 'none' }}
                    />
                  )}
                </div>
              </div>

              <div style={{ position: 'relative', height: 420, width: '100%' }}>
                <div ref={mapDivRef} style={{ height: 420, width: '100%', borderRadius: '0 0 12px 12px' }} />
                {mapStatus !== 'map-initialized' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8494b0', fontSize: '0.85rem', background: 'white', borderRadius: '0 0 12px 12px' }}>
                    {mapStatus === 'failed' ? 'Map failed to load' : 'Loading map...'}
                  </div>
                )}
              </div>
            </div>

            {!selectedEmployee && (
              <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef', padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>👈</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#0e1117', marginBottom: 6 }}>Select an employee</div>
                <div style={{ fontSize: '0.875rem', color: '#8494b0' }}>Choose an employee on the left to build their route.</div>
              </div>
            )}

            {selectedEmployee && (
              <>
                <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>{selectedEmployee.name}'s Route</div>
                      <div style={{ fontSize: '0.78rem', color: '#8494b0', marginTop: 2 }}>{routeJobs.length} stop{routeJobs.length !== 1 ? 's' : ''} · drag to reorder</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {savedMsg && <span style={{ fontSize: '0.8rem', color: '#1f6132', fontWeight: 600 }}>✓ {savedMsg}</span>}
                      <button onClick={saveRoute} disabled={saving || routeJobIds.length === 0}
                        style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none', background: routeJobIds.length > 0 && !saving ? 'linear-gradient(135deg,#1f6132,#124d83)' : '#dde4ef', color: routeJobIds.length > 0 && !saving ? 'white' : '#8494b0', fontWeight: 700, fontSize: '0.85rem', cursor: routeJobIds.length > 0 && !saving ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}>
                        {saving ? 'Saving...' : 'Save Route'}
                      </button>
                    </div>
                  </div>

                  {routeJobs.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: '#8494b0', textAlign: 'center', padding: '2rem', background: '#f4f7fb', borderRadius: 8, border: '1px dashed #dde4ef' }}>
                      Add jobs from the list below
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {routeJobs.map((job, i) => (
                        <div key={job.id} draggable onDragStart={() => handleDragStart(i)} onDragOver={e => handleDragOver(e, i)} onDragEnd={() => setDragIndex(null)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: '#f4f7fb', borderRadius: 8, border: '1px solid #dde4ef', cursor: 'grab', userSelect: 'none', opacity: dragIndex === i ? 0.5 : 1 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#1f6132,#124d83)', color: 'white', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i+1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0e1117', marginBottom: 2 }}>{job.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#5a6a88' }}>{job.client_name} · {fmt(job.start_time)}</div>
                            <div style={{ fontSize: '0.72rem', color: '#8494b0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.address}</div>
                          </div>
                          <span style={{ color: '#b8c4d8', marginRight: 4, fontSize: '1rem' }}>⠿</span>
                          <button onClick={() => removeJob(job.id)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px', flexShrink: 0 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef', padding: '1.25rem' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0e1117', marginBottom: '1rem' }}>
                    Available Jobs ({unassignedJobs.length})
                  </div>
                  {unassignedJobs.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: '#8494b0', textAlign: 'center', padding: '1.5rem', background: '#f4f7fb', borderRadius: 8 }}>
                      All jobs have been added to this route.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {unassignedJobs.map(job => (
                        <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: '#f4f7fb', borderRadius: 8, border: '1px solid #dde4ef' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0e1117', marginBottom: 2 }}>{job.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#5a6a88' }}>{job.client_name} · {fmt(job.start_time)}</div>
                            <div style={{ fontSize: '0.72rem', color: '#8494b0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.address}</div>
                          </div>
                          <button onClick={() => addJob(job.id)}
                            style={{ padding: '0.45rem 0.85rem', borderRadius: 7, border: '1.5px solid rgba(31,97,50,0.3)', background: 'rgba(31,97,50,0.06)', color: '#1f6132', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PortalShell>
  )
}