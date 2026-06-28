"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, SectionHeader, MetricCard, fmtDate, money } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type PayRun = {
  id: string; employeeName: string; periodStart: string; periodEnd: string
  regularHours: number; overtimeHours: number; grossPay: number
  deductions: number; netPay: number; status: string; paidAt: string | null
}

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/payroll`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRuns(Array.isArray(d) ? d : d.payRuns || d.runs || []); setLoading(false) })
      .catch(() => { setError("Could not load payroll data."); setLoading(false) })
  }, [])

  const totalNet = runs.reduce((s, r) => s + r.netPay, 0)
  const totalGross = runs.reduce((s, r) => s + r.grossPay, 0)

  const statusOptions = Array.from(new Set(runs.map(r => r.status).filter(Boolean)))
  const filtered = statusFilter === "all" ? runs : runs.filter(r => r.status === statusFilter)

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <SectionHeader
        title="Payroll"
        sub="Pay runs, wages, and payroll history."
      />

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <MetricCard label="Total Gross Pay" value={money(totalGross)} accent="#6D28D9" />
            <MetricCard label="Total Net Pay" value={money(totalNet)} accent="#0F766E" />
            <MetricCard label="Pay Runs" value={runs.length} accent="#1D4ED8" />
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
            headers={["Employee", "Pay Period", "Reg. Hours", "OT Hours", "Gross Pay", "Deductions", "Net Pay", "Status", "Paid"]}
            rows={filtered.map(r => [
              <span key="emp" style={{ fontWeight: 500 }}>{r.employeeName || "—"}</span>,
              <span key="period" style={{ color: "#6B7280", whiteSpace: "nowrap" }}>
                {r.periodStart && r.periodEnd ? `${fmtDate(r.periodStart)} – ${fmtDate(r.periodEnd)}` : "—"}
              </span>,
              <span key="reg" style={{ color: "#6B7280" }}>{r.regularHours != null ? r.regularHours.toFixed(1) : "—"}</span>,
              <span key="ot" style={{ color: "#6B7280" }}>{r.overtimeHours != null ? r.overtimeHours.toFixed(1) : "—"}</span>,
              <span key="gross" style={{ fontWeight: 600 }}>{money(r.grossPay)}</span>,
              <span key="ded" style={{ color: "#6B7280" }}>{money(r.deductions)}</span>,
              <span key="net" style={{ fontWeight: 700, color: "#0F766E" }}>{money(r.netPay)}</span>,
              <StatusBadge key="status" status={r.status} />,
              <span key="paid" style={{ color: "#9CA3AF", whiteSpace: "nowrap" }}>{r.paidAt ? fmtDate(r.paidAt) : "—"}</span>,
            ])}
            emptyMessage="No payroll records found."
          />
        </>
      )}
    </PortalShell>
  )
}