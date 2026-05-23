"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, fmtDate } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Session = {
  id: string; employeeName: string; workDate: string
  clockInAt: string; clockOutAt: string; status: string
  paidMinutes: number; breakMinutes: number
}

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export default function TimeclockPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/timeclock/admin/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setSessions(Array.isArray(d) ? d : d.sessions || []); setLoading(false) })
      .catch(() => { setError("Could not load time clock data."); setLoading(false) })
  }, [])

  const totalHours = sessions.reduce((s, sess) => s + sess.paidMinutes, 0)

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Admin Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Time Clock</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>All employee clock-in sessions and hours.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Sessions</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{sessions.length}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Paid Hours</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1f6132" }}>{fmtMins(totalHours)}</div>
            </div>
          </div>
          <DataTable
            headers={["Employee", "Date", "Clock In", "Clock Out", "Paid Time", "Break", "Status"]}
            rows={sessions.map(s => [
              s.employeeName || "N/A",
              s.workDate ? fmtDate(s.workDate) : "N/A",
              s.clockInAt ? fmtDate(s.clockInAt) : "N/A",
              s.clockOutAt ? fmtDate(s.clockOutAt) : "N/A",
              fmtMins(s.paidMinutes),
              fmtMins(s.breakMinutes),
              <StatusBadge key={s.id} status={s.status} />
            ])}
            emptyMessage="No time sessions found."
          />
        </>
      )}
    </PortalShell>
  )
}
