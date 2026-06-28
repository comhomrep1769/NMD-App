"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { MetricCard, LoadingCard, ErrorCard, StatusBadge, money } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"
import { useSiteContent } from "@/hooks/useSiteContent"

type TodaysJob = {
  id: string
  title: string
  clientName: string
  address: string
  startTime: string
  endTime: string
  status: string
}

type Dashboard = {
  jobsCompleted: number; totalAssignedJobs: number
  dailyRevenue: number; weeklyRevenue: number; monthlyRevenue: number
  dailyHours: number; weeklyHours: number; monthlyHours: number
  dailyWages: number; weeklyWages: number; monthlyWages: number
  payRate: number; totalPayrollPaid: number; payRunsCompleted: number
  todaysJobs?: TodaysJob[]
}

type BonusMe = {
  weeklyRevenue: number
  jobsCompleted: number
  bonusPct: number
  bonusAmount: number
  tier: number
  toNextTier: number
  nextTierPct: number | null
  status: string
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function EmployeeDashboard() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [bonus, setBonus] = useState<BonusMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { content } = useSiteContent()
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    Promise.all([
      fetch(`${API}/api/employee-dashboard/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/bonus/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ])
      .then(([dashData, bonusData]) => {
        setData(dashData.dashboard)
        if (bonusData && !bonusData.error) setBonus(bonusData)
        setLoading(false)
      })
      .catch(() => { setError("Could not load dashboard."); setLoading(false) })
  }, [])

  const todaysJobs = data?.todaysJobs || []

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0F766E", marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: "DM Sans, sans-serif", fontSize: "28px", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", marginBottom: 6 }}>{content['employee.dashboard.title'] || 'Employee Dashboard'}</h1>
        <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>{content['employee.dashboard.subtitle'] || 'Your jobs, hours, and earnings overview.'}</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <MetricCard label="Today's Jobs" value={String(todaysJobs.length)} sub={todaysJobs.length > 0 ? `Next at ${fmtTime(todaysJobs[0].startTime)}` : "None scheduled today"} />
            <MetricCard label="Jobs Completed" value={String(data.jobsCompleted)} sub={`of ${data.totalAssignedJobs} assigned`} />
            <MetricCard label="Pay Rate" value={`${money(data.payRate)}/hr`} />
            <MetricCard label="Total Paid Out" value={money(data.totalPayrollPaid)} sub={`${data.payRunsCompleted} pay runs`} />
            {bonus && (
              <MetricCard
                label="Bonus This Week"
                value={money(bonus.bonusAmount)}
                sub={`Tier ${bonus.tier} · ${bonus.bonusPct}%${bonus.status === 'pending_approval' ? ' · Pending approval' : ''}`}
              />
            )}
          </div>

          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1.5rem" }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#111827", marginBottom: "1rem" }}>Today's Schedule</div>
            {todaysJobs.length === 0 ? (
              <div style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>No jobs scheduled for today.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {todaysJobs.map(job => (
                  <div key={job.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0.75rem 1rem", background: "#F8FAF9", border: "1px solid #E5E7EB", borderRadius: 8, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{job.title}</div>
                      <div style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: 2 }}>{job.clientName} · {job.address}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>{fmtTime(job.startTime)}</span>
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1.5rem" }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#111827", marginBottom: "1rem" }}>Hours & Earnings</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
              {[
                { label: "Today", hours: data.dailyHours, wages: data.dailyWages },
                { label: "This Week", hours: data.weeklyHours, wages: data.weeklyWages },
                { label: "This Month", hours: data.monthlyHours, wages: data.monthlyWages },
              ].map(row => (
                <div key={row.label} style={{ background: "#F8FAF9", borderRadius: 10, padding: "1rem", border: "1px solid #E5E7EB" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9CA3AF", marginBottom: 6 }}>{row.label}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>{row.hours.toFixed(1)}h</div>
                  <div style={{ fontSize: "0.85rem", color: "#0F766E", fontWeight: 600 }}>{money(row.wages)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  )
}