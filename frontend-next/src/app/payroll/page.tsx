"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, fmtDate, money } from "@/components/portal/PortalUI"
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

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Admin Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Payroll</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Pay runs, wages, and payroll history.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Gross Pay</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{money(totalGross)}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Net Pay</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1f6132" }}>{money(totalNet)}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Pay Runs</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{runs.length}</div>
            </div>
          </div>
          <DataTable
            headers={["Employee", "Period Start", "Period End", "Gross Pay", "Deductions", "Net Pay", "Status"]}
            rows={runs.map(r => [
              r.employeeName || "N/A",
              r.periodStart ? fmtDate(r.periodStart) : "N/A",
              r.periodEnd ? fmtDate(r.periodEnd) : "N/A",
              money(r.grossPay),
              money(r.deductions),
              money(r.netPay),
              <StatusBadge key={r.id} status={r.status} />
            ])}
            emptyMessage="No payroll records found."
          />
        </>
      )}
    </PortalShell>
  )
}
