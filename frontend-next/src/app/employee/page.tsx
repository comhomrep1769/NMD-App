"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { MetricCard, LoadingCard, ErrorCard, money } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Dashboard = {
  jobsCompleted: number; totalAssignedJobs: number
  dailyRevenue: number; weeklyRevenue: number; monthlyRevenue: number
  dailyHours: number; weeklyHours: number; monthlyHours: number
  dailyWages: number; weeklyWages: number; monthlyWages: number
  payRate: number; totalPayrollPaid: number; payRunsCompleted: number
}

export default function EmployeeDashboard() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/employee-dashboard/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d.dashboard); setLoading(false) })
      .catch(() => { setError("Could not load dashboard."); setLoading(false) })
  }, [])

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>NMD Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Employee Dashboard</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Your jobs, hours, and earnings overview.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <MetricCard label="Jobs Completed" value={String(data.jobsCompleted)} sub={`of ${data.totalAssignedJobs} assigned`} />
            <MetricCard label="Pay Rate" value={`${money(data.payRate)}/hr`} />
            <MetricCard label="Total Paid Out" value={money(data.totalPayrollPaid)} sub={`${data.payRunsCompleted} pay runs`} />
          </div>
          <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, padding: "1.5rem" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0e1117", marginBottom: "1rem" }}>Hours & Earnings</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
              {[
                { label: "Today", hours: data.dailyHours, wages: data.dailyWages },
                { label: "This Week", hours: data.weeklyHours, wages: data.weeklyWages },
                { label: "This Month", hours: data.monthlyHours, wages: data.monthlyWages },
              ].map(row => (
                <div key={row.label} style={{ background: "#f4f7fb", borderRadius: 10, padding: "1rem", border: "1px solid #dde4ef" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>{row.label}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0e1117" }}>{row.hours.toFixed(1)}h</div>
                  <div style={{ fontSize: "0.85rem", color: "#1f6132", fontWeight: 600 }}>{money(row.wages)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  )
}
