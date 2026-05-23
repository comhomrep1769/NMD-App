"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, fmtDate, money } from "@/components/portal/PortalUI"
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

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Admin Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Mileage</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Employee mileage logs and reimbursements.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Miles</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{totalMiles.toFixed(1)}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Reimbursed</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1f6132" }}>{money(totalReimbursed)}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Trips</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{logs.length}</div>
            </div>
          </div>
          <DataTable
            headers={["Employee", "Date", "From", "To", "Miles", "Reimbursement", "Purpose", "Status"]}
            rows={logs.map(l => [
              l.employeeName || "N/A",
              l.tripDate ? fmtDate(l.tripDate) : "N/A",
              l.startLocation || "N/A",
              l.endLocation || "N/A",
              l.milesDriven.toFixed(1),
              money(l.reimbursementTotal),
              l.purpose || "N/A",
              <StatusBadge key={l.id} status={l.status || "pending"} />
            ])}
            emptyMessage="No mileage logs found."
          />
        </>
      )}
    </PortalShell>
  )
}
