"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, fmtDate } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Job = {
  id: string; title: string; clientName: string; address: string
  startTime: string; endTime: string; status: string; notes: string
}

export default function EmployeeSchedule() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/jobs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const rows = Array.isArray(d) ? d : d.jobs || []
        setJobs(rows.map((j: any) => ({
          id: j.id, title: j.title, clientName: j.client_name,
          address: j.address, startTime: j.start_time, endTime: j.end_time,
          status: j.status, notes: j.notes
        })))
        setLoading(false)
      })
      .catch(() => { setError("Could not load schedule."); setLoading(false) })
  }, [])

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0F766E", marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: "DM Sans, sans-serif", fontSize: "28px", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", marginBottom: 6 }}>My Schedule</h1>
        <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>Your assigned jobs and upcoming visits.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={["Job", "Client", "Address", "Start", "Status"]}
          rows={jobs.map(j => [
            j.title,
            j.clientName || "N/A",
            j.address || "N/A",
            j.startTime ? fmtDate(j.startTime) : "N/A",
            <StatusBadge key={j.id} status={j.status} />
          ])}
          emptyMessage="No jobs assigned yet."
        />
      )}
    </PortalShell>
  )
}