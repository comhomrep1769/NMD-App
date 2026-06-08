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

type RouteStop = {
  stopId: number; jobId: string; stopOrder: number
  title: string; clientName: string; address: string
  lat?: number; lng?: number; startTime: string
  departedAt?: string; arrivedAt?: string; completedAt?: string
}

type Route = {
  id: number; employee_id: string; employee_name: string; stops: RouteStop[]
}

type SearchResult = { display_name: string; lat: string; lon: string }

declare global {
  interface Window { L: any }
}

export default function AdminRoutesPage() {
  const API = process.env.NEXT_PUBLIC_API_URL || ''

  // Always use today's date in YYYY-MM-DD format
  const getToday = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

  // Address search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const searchMarkerRef = useRef<any>(null)

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
    mapInstance.current = L.map(mapRef.current).setView([28.5383, -81.3792], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance.current)
  }

  const updateMapMarkers = useCallback((jobList: Job[], selectedIds: string[]) => {
    if (!mapInstance.current || !window.L) return
    const L = window.L
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    const validJobs = jobList.filter(j => j.lat && j.lng)
    if (validJobs.length === 0) return
    validJobs.forEach(job => {
      const orderIndex = selectedIds.indexOf(job.id)
      const isInRoute = orderIndex >= 0
      const color = isInRoute ? '#1f6132' : '#8494b0'
      const label = isInRoute ? String(orderIndex + 1) : '•'
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:Syne,sans-serif;">${label}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      })
      const marker = L.marker([job.lat, job.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`<div style="font-family:DM Sans,sans-serif;min-width:180px"><div style="font-weight:700;margin-bottom:4px">${job.title}</div><div style="font-size:12px;color:#5a6a88;margin-bottom:4px">${job.client_name}</div><div style="font-size:12px;color:#3a4660">${job.address}</div></div>`)
      markersRef.current.push(marker)
    })
    const bounds = L.latLngBounds(validJobs.map(j => [j.lat, j.lng]))
    mapInstance.current.fitBounds(bounds, { padding: [40, 40] })
  }, [])

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
      const jobsData = await jobsRes.json()
      const empData = await empRes.json()
      const routesData = await routesRes.json()
      setJobs(jobsData.jobs || [])
      setEmployees(empData.employees || [])
      setRoutes(routesData.routes || [])
      setTimeout(() => {
        if (window.L) {
          initMap()
          if (mapInstance.current) mapInstance.current.invalidateSize()
        }
        updateMapMarkers(jobsData.jobs || [], [])
      }, 800)
    } catch {
      setError('Could not load route data.')
    }
    setLoading(false)
  }, [date, API, updateMapMarkers])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { updateMapMarkers(jobs, routeJobIds) }, [routeJobIds, jobs, updateMapMarkers])

  // Address search with debounce
  const handleSearchInput = (val: string) => {
    setSearchQuery(val)
    setSearchResults([])
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (val.trim().length < 3) return
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&countrycodes=us`,
          { headers: { 'User-Agent': 'NMD-Pressure-Washing-App/1.0' } }
        )
        const data = await res.json()
        setSearchResults(data)
      } catch { }
      setSearching(false)
    }, 500)
  }

  const flyToResult = (result: SearchResult) => {
    if (!mapInstance.current || !window.L) return
    const L = window.L
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    mapInstance.current.flyTo([lat, lng], 15, { duration: 1 })
    if (searchMarkerRef.current) searchMarkerRef.current.remove()
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;border-radius:50%;background:#e67e22;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📍</div>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    })
    searchMarkerRef.current = L.marker([lat, lng], { icon })
      .addTo(mapInstance.current)
      .bindPopup(`<div style="font-family:DM Sans,sans-serif;font-size:12px;max-width:200px">${result.display_name}</div>`)
      .openPopup()
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(','))
    setSearchResults([])
  }

  const selectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp)
    const existing = routes.find(r => r.employee_id === emp.id)
    const ids = existing ? existing.stops.map(s => s.jobId) : []
    setRouteJobIds(ids)
    setSavedMsg('')
    setTimeout(() => {
      if (mapInstance.current) mapInstance.current.invalidateSize()
    }, 100)
  }

  const addJobToRoute = (jobId: string) => {
    if (!routeJobIds.includes(jobId)) setRouteJobIds(p => [...p, jobId])
  }

  const removeJobFromRoute = (jobId: string) => {
    setRouteJobIds(p => p.filter(id => id !== jobId))
  }

  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const newOrder = [...routeJobIds]
    const [moved] = newOrder.splice(dragIndex, 1)
    newOrder.splice(index, 0, moved)
    setRouteJobIds(newOrder)
    setDragIndex(index)
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
      if (!res.ok) throw new Error('Save failed')
      setSavedMsg(`Route saved for ${selectedEmployee.name}!`)
      loadData()
    } catch {
      setError('Failed to save route.')
    }
    setSaving(false)
  }

  const fmt = (dt: string | null) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const routeJobs = routeJobIds.map(id => jobs.find(j => j.id === id)).filter(Boolean) as Job[]
  const unassignedJobs = jobs.filter(j => !routeJobIds.includes(j.id))

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Admin Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>Route Planner</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Build and assign employee routes for any date. Drag to reorder stops.</p>
      </div>

      {/* Date picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#0e1117', background: 'white' }}
        />
        <span style={{ fontSize: '0.85rem', color: '#8494b0' }}>
          {jobs.length} scheduled job{jobs.length !== 1 ? 's' : ''} · {employees.length} employee{employees.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── LEFT: Employee list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8494b0' }}>Employees</div>
            {employees.length === 0 && (
              <div style={{ fontSize: '0.85rem', color: '#8494b0', padding: '1rem', background: 'white', borderRadius: 10, border: '1px solid #dde4ef' }}>No employees found.</div>
            )}
            {employees.map(emp => {
              const hasRoute = routes.some(r => r.employee_id === emp.id)
              const isSelected = selectedEmployee?.id === emp.id
              return (
                <button
                  key={emp.id}
                  onClick={() => selectEmployee(emp)}
                  style={{ padding: '0.85rem 1rem', borderRadius: 10, border: `1.5px solid ${isSelected ? '#1f6132' : '#dde4ef'}`, background: isSelected ? 'rgba(31,97,50,0.05)' : 'white', textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0e1117', marginBottom: 3 }}>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8494b0' }}>{hasRoute ? '✓ Route assigned' : 'No route yet'}</div>
                </button>
              )
            })}
          </div>

          {/* ── RIGHT: Map + route builder ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Map with address search — always visible */}
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef', overflow: 'visible', position: 'relative' }}>
              {/* Search bar */}
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #dde4ef' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearchInput(e.target.value)}
                    placeholder="🔍 Search address or location..."
                    style={{ width: '100%', padding: '0.55rem 0.9rem', borderRadius: 8, border: '1.5px solid #dde4ef', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', color: '#0e1117', background: '#f4f7fb', boxSizing: 'border-box', outline: 'none' }}
                  />
                  {searching && (
                    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#8494b0' }}>Searching...</div>
                  )}
                  {searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1.5px solid #dde4ef', borderRadius: 8, boxShadow: '0 8px 24px rgba(14,17,23,0.15)', zIndex: 9999, overflow: 'hidden' }}>
                      {searchResults.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => flyToResult(r)}
                          style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', background: 'none', border: 'none', borderBottom: i < searchResults.length - 1 ? '1px solid #f0f4f9' : 'none', fontSize: '0.82rem', color: '#3a4660', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'block' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f4f7fb')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          📍 {r.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div ref={mapRef} style={{ height: 400, width: '100%', borderRadius: '0 0 12px 12px', overflow: 'hidden' }} />
            </div>

            {/* Prompt to select employee */}
            {!selectedEmployee && (
              <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef', padding: '2rem', textAlign: 'center', color: '#8494b0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👈</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#0e1117', marginBottom: 6 }}>Select an employee</div>
                <div style={{ fontSize: '0.875rem' }}>Choose an employee on the left to build or edit their route.</div>
              </div>
            )}

            {selectedEmployee ? (
              <>
                <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>{selectedEmployee.name}'s Route</div>
                      <div style={{ fontSize: '0.78rem', color: '#8494b0', marginTop: 2 }}>{routeJobs.length} stop{routeJobs.length !== 1 ? 's' : ''} · drag to reorder</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {savedMsg && <span style={{ fontSize: '0.8rem', color: '#1f6132', fontWeight: 600 }}>✓ {savedMsg}</span>}
                      <button
                        onClick={saveRoute}
                        disabled={saving || routeJobIds.length === 0}
                        style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none', background: routeJobIds.length > 0 && !saving ? 'linear-gradient(135deg, #1f6132, #124d83)' : '#dde4ef', color: routeJobIds.length > 0 && !saving ? 'white' : '#8494b0', fontWeight: 700, fontSize: '0.85rem', cursor: routeJobIds.length > 0 && !saving ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {saving ? 'Saving...' : 'Save Route'}
                      </button>
                    </div>
                  </div>

                  {routeJobs.length === 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#8494b0', textAlign: 'center', padding: '2rem', background: '#f4f7fb', borderRadius: 8, border: '1px dashed #dde4ef' }}>
                      Add jobs from the list below
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {routeJobs.map((job, index) => (
                      <div
                        key={job.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={e => handleDragOver(e, index)}
                        onDragEnd={() => setDragIndex(null)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: '#f4f7fb', borderRadius: 8, border: '1px solid #dde4ef', cursor: 'grab', userSelect: 'none', opacity: dragIndex === index ? 0.5 : 1 }}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{index + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0e1117', marginBottom: 2 }}>{job.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#5a6a88' }}>{job.client_name} · {fmt(job.start_time)}</div>
                          <div style={{ fontSize: '0.72rem', color: '#8494b0', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.address}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#8494b0', marginRight: 4 }}>⠿</span>
                        <button onClick={() => removeJobFromRoute(job.id)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {unassignedJobs.length > 0 && (
                  <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #dde4ef', padding: '1.25rem' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0e1117', marginBottom: '1rem' }}>
                      Available Jobs — {date}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {unassignedJobs.map(job => (
                        <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: '#f4f7fb', borderRadius: 8, border: '1px solid #dde4ef' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0e1117', marginBottom: 2 }}>{job.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#5a6a88' }}>{job.client_name} · {fmt(job.start_time)}</div>
                            <div style={{ fontSize: '0.72rem', color: '#8494b0', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.address}</div>
                          </div>
                          <button
                            onClick={() => addJobToRoute(job.id)}
                            style={{ padding: '0.45rem 0.85rem', borderRadius: 7, border: '1.5px solid rgba(31,97,50,0.3)', background: 'rgba(31,97,50,0.06)', color: '#1f6132', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </PortalShell>
  )
}