"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, SectionHeader, fmtDate } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Job = {
  id: string; title: string; clientName: string; address: string
  startTime: string; endTime: string; status: string
  assignedEmployees: { id: string; displayName: string }[]
}

type Employee = { id: string; name: string; email: string }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
  border: '1px solid #E5E7EB', fontSize: '0.875rem',
  fontFamily: 'DM Sans, sans-serif', color: '#111827',
  background: 'white', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem', fontWeight: 500, color: '#374151',
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
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
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


  const deleteJob = async (jobId: string, title: string) => {
    if (!confirm("Delete job \"" + title + "\"? This cannot be undone.")) return
    setDeletingJobId(jobId)
    try {
      const token = getNmdToken()
      const res = await fetch(API + "/api/jobs/" + jobId, { method: "DELETE", headers: { Authorization: "Bearer " + token } })
      if (!res.ok) throw new Error("Failed")
      setJobs(p => p.filter(j => j.id !== jobId))
    } catch (err) { alert("Failed to delete job") }
    setDeletingJobId(null)
  }

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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(17,24,39,0.2)' }}>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Create New Job</div>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginTop: 4 }}>Fill in the job details below.</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {modalError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#B91C1C' }}>
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
                        <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.9rem', background: form.assignedUserIds.includes(emp.id) ? 'rgba(15,118,110,0.08)' : '#F9FAFB', border: `1px solid ${form.assignedUserIds.includes(emp.id) ? 'rgba(15,118,110,0.3)' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={form.assignedUserIds.includes(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            style={{ accentColor: '#0F766E', width: 16, height: 16 }}
                          />
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{emp.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: 'auto' }}>{emp.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowModal(false); setModalError('') }}
                style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: saving ? '#E5E7EB' : '#0F766E', color: saving ? '#9CA3AF' : 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >
                {saving ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="Schedule"
        sub="All jobs and assigned employees."
        action={
          <button
            onClick={() => { setShowModal(true); setModalError('') }}
            style={{ padding: '0.65rem 1.4rem', borderRadius: 8, border: 'none', background: '#0F766E', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
          >
            + Create Job
          </button>
        }
      />

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={["Job", "Client", "Address", "Start", "End", "Assigned To", "Status"]}
          rows={jobs.map(j => [
            <span key="title" style={{ fontWeight: 600 }}>{j.title}</span>,
            <span key="client" style={{ color: '#374151' }}>{j.clientName || "—"}</span>,
            <span key="addr" style={{ color: '#6B7280' }}>{j.address || "—"}</span>,
            <span key="start" style={{ color: '#6B7280', whiteSpace: 'nowrap' }}>{j.startTime ? fmtDate(j.startTime) : "—"}</span>,
            <span key="end" style={{ color: '#9CA3AF', whiteSpace: 'nowrap' }}>{j.endTime ? fmtDate(j.endTime) : "—"}</span>,
            <span key="assigned" style={{ color: '#374151' }}>{j.assignedEmployees.map(e => e.displayName).join(", ") || "Unassigned"}</span>,
            <StatusBadge key="status" status={j.status} />,
              <button key="del" onClick={() => deleteJob(j.id, j.title)} disabled={deletingJobId === j.id} style={{ padding: "0.25rem 0.5rem", borderRadius: 5, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.7rem", cursor: "pointer" }}>{deletingJobId === j.id ? "..." : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>}</button>
          ])}
          emptyMessage="No jobs scheduled."
        />
      )}
    </PortalShell>
  )
}