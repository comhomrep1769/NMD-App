"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, SectionHeader, MetricCard, fmtDate, money } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type MileageLog = {
  id: string; employeeName: string; tripDate: string
  startLocation: string; endLocation: string; milesDriven: number
  reimbursementTotal: number; purpose: string; status: string
}

export default function MileagePage() {
  const [logs, setLogs] = useState<MileageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/mileage`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : d.mileageLogs || []); setLoading(false) })
      .catch(() => { setError("Could not load mileage logs."); setLoading(false) })
  }, [])

  const totalMiles = logs.reduce((s, l) => s + l.milesDriven, 0)
  const totalReimbursed = logs.reduce((s, l) => s + l.reimbursementTotal, 0)

  const statusOptions = Array.from(new Set(logs.map(l => l.status || "pending").filter(Boolean)))
  const filtered = statusFilter === "all" ? logs : logs.filter(l => (l.status || "pending") === statusFilter)

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <SectionHeader
        title="Mileage"
        sub="Employee mileage logs and reimbursements."
      />

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <MetricCard label="Total Miles" value={totalMiles.toFixed(1)} accent="#1D4ED8" />
            <MetricCard label="Total Reimbursed" value={money(totalReimbursed)} accent="#0F766E" />
            <MetricCard label="Total Trips" value={logs.length} accent="#6D28D9" />
          </div>

          {statusOptions.length > 1 && (
            <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <button onClick={() => setStatusFilter("all")}
                style={{
                  padding: "5px 14px", borderRadius: 100,
                  border: `1px solid ${statusFilter === "all" ? "#0F766E" : "#E5E7EB"}`,
                  background: statusFilter === "all" ? "#F0FDF9" : "white",
                  color: statusFilter === "all" ? "#0F766E" : "#6B7280",
                  fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                  textTransform: "capitalize",
                }}>
                All
              </button>
              {statusOptions.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "5px 14px", borderRadius: 100,
                    border: `1px solid ${statusFilter === s ? "#0F766E" : "#E5E7EB"}`,
                    background: statusFilter === s ? "#F0FDF9" : "white",
                    color: statusFilter === s ? "#0F766E" : "#6B7280",
                    fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                    textTransform: "capitalize",
                  }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <DataTable
            headers={["Employee", "Date", "From", "To", "Miles", "Reimbursement", "Purpose", "Status"]}
            rows={filtered.map(l => [
              <span key="emp" style={{ fontWeight: 500 }}>{l.employeeName || "—"}</span>,
              <span key="date" style={{ color: "#9CA3AF", whiteSpace: "nowrap" }}>{l.tripDate ? fmtDate(l.tripDate) : "—"}</span>,
              <span key="from" style={{ color: "#6B7280" }}>{l.startLocation || "—"}</span>,
              <span key="to" style={{ color: "#6B7280" }}>{l.endLocation || "—"}</span>,
              <span key="miles" style={{ fontWeight: 600 }}>{l.milesDriven.toFixed(1)}</span>,
              <span key="reimb" style={{ fontWeight: 600, color: "#0F766E" }}>{money(l.reimbursementTotal)}</span>,
              <span key="purpose" style={{ color: "#6B7280" }}>{l.purpose || "—"}</span>,
              <StatusBadge key="status" status={l.status || "pending"} />,
            ])}
            emptyMessage="No mileage logs found."
          />
        </>
      )}
    </PortalShell>
  )
}