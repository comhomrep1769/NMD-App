"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, fmtDate } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Job = {
  id: string; title: string; clientName: string; address: string
  startTime: string; endTime: string; status: string
  assignedEmployees: { id: string; displayName: string }[]
}

type Employee = { id: string; name: string; email: string }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
  border: '1.5px solid #dde4ef', fontSize: '0.875rem',
  fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
  background: '#f4f7fb', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem', fontWeight: 500, color: '#3a4660',
  display: 'block', marginBottom: 4,
}

export default function SchedulePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState("")
  const [form, setForm] = useState({
    title: '', clientName: '', address: '',
    startTime: '', endTime: '', notes: '', status: 'scheduled',
    assignedUserIds: [] as string[],
  })
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  const loadJobs = () => {
    const token = getNmdToken()
    fetch(`${API}/api/jobs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const rows = Array.isArray(d) ? d : d.jobs || []
        setJobs(rows.map((j: any) => ({
          id: j.id, title: j.title, clientName: j.client_name,
          address: j.address, startTime: j.start_time, endTime: j.end_time,
          status: j.status, assignedEmployees: j.assigned_employees || []
        })))
        setLoading(false)
      })
      .catch(() => { setError("Could not load schedule."); setLoading(false) })
  }

  useEffect(() => {
    loadJobs()
    // Load employees for assignment dropdown
    const token = getNmdToken()
    fetch(`${API}/api/routes/employees`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setEmployees(d.employees || []))
      .catch(() => {})
  }, [])

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleEmployee = (id: string) => {
    setForm(prev => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(id)
        ? prev.assignedUserIds.filter(e => e !== id)
        : [...prev.assignedUserIds, id],
    }))
  }

  const handleSubmit = async () => {
    if (!form.title || !form.clientName || !form.address || !form.startTime || !form.endTime) {
      setModalError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    setModalError('')
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          clientName: form.clientName,
          address: form.address,
          startTime: form.startTime,
          endTime: form.endTime,
          notes: form.notes || null,
          status: form.status,
          assignedUserIds: form.assignedUserIds,
          forceCreate: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create job')
      setShowModal(false)
      setForm({ title: '', clientName: '', address: '', startTime: '', endTime: '', notes: '', status: 'scheduled', assignedUserIds: [] })
      loadJobs()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to create job')
    }
    setSaving(false)
  }

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>

      {/* ── Create Job Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(14,17,23,0.25)' }}>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#0e1117' }}>Create New Job</div>
              <div style={{ fontSize: '0.82rem', color: '#8494b0', marginTop: 4 }}>Fill in the job details below.</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {modalError && (
                <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>
                  {modalError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Job Title *</label>
                  <input style={inputStyle} value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. House Washing" />
                </div>
                <div>
                  <label style={labelStyle}>Client Name *</label>
                  <input style={inputStyle} value={form.clientName} onChange={e => update('clientName', e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={form.status} onChange={e => update('status', e.target.value)}>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Service Address *</label>
                  <input style={inputStyle} value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Main St, Orlando, FL" />
                </div>
                <div>
                  <label style={labelStyle}>Start Time *</label>
                  <input style={inputStyle} type="datetime-local" value={form.startTime} onChange={e => update('startTime', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>End Time *</label>
                  <input style={inputStyle} type="datetime-local" value={form.endTime} onChange={e => update('endTime', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any special instructions..." />
                </div>

                {/* Employee assignment */}
                {employees.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Assign Employees</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {employees.map(emp => (
                        <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.9rem', background: form.assignedUserIds.includes(emp.id) ? 'rgba(31,97,50,0.06)' : '#f4f7fb', border: `1.5px solid ${form.assignedUserIds.includes(emp.id) ? 'rgba(31,97,50,0.3)' : '#dde4ef'}`, borderRadius: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={form.assignedUserIds.includes(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            style={{ accentColor: '#1f6132', width: 16, height: 16 }}
                          />
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0e1117' }}>{emp.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#8494b0', marginLeft: 'auto' }}>{emp.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #dde4ef', display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowModal(false); setModalError('') }}
                style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: saving ? '#dde4ef' : 'linear-gradient(135deg, #1f6132, #124d83)', color: saving ? '#8494b0' : 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                {saving ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Admin Portal</div>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Schedule</h1>
          <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>All jobs and assigned employees.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setModalError('') }}
          style={{ padding: '0.65rem 1.4rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
        >
          + Create Job
        </button>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={["Job", "Client", "Address", "Start", "Assigned To", "Status"]}
          rows={jobs.map(j => [
            j.title,
            j.clientName || "N/A",
            j.address || "N/A",
            j.startTime ? fmtDate(j.startTime) : "N/A",
            j.assignedEmployees.map(e => e.displayName).join(", ") || "Unassigned",
            <StatusBadge key={j.id} status={j.status} />
          ])}
          emptyMessage="No jobs scheduled."
        />
      )}
    </PortalShell>
  )
}