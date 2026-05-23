"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, fmtDate } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Session = {
  id: string; workDate: string; clockInAt: string; clockOutAt: string
  status: string; paidMinutes: number; breakMinutes: number
}

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export default function EmployeeTimeclock() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/timeclock/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const rows = Array.isArray(d) ? d : d.sessions || []
        setSessions(rows)
        setLoading(false)
      })
      .catch(() => { setError("Could not load time records."); setLoading(false) })
  }, [])

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Time Clock</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Your clock-in sessions and paid hours.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <DataTable
          headers={["Date", "Clock In", "Clock Out", "Paid Time", "Break", "Status"]}
          rows={sessions.map(s => [
            s.workDate ? fmtDate(s.workDate) : "N/A",
            s.clockInAt ? fmtDate(s.clockInAt) : "N/A",
            s.clockOutAt ? fmtDate(s.clockOutAt) : "N/A",
            fmtMins(s.paidMinutes),
            fmtMins(s.breakMinutes),
            <StatusBadge key={s.id} status={s.status} />
          ])}
          emptyMessage="No time sessions recorded yet."
        />
      )}
    </PortalShell>
  )
}

