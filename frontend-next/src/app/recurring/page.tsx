"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, fmtDate, money } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Recurring = {
  id: string; clientName: string; serviceType: string; frequency: string
  price: number; status: string; nextServiceDate: string | null
  email: string; phone: string; address: string
}

export default function RecurringPage() {
  const [plans, setPlans] = useState<Recurring[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/recurring`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPlans(Array.isArray(d) ? d : d.recurringServices || d.plans || []); setLoading(false) })
      .catch(() => { setError("Could not load recurring plans."); setLoading(false) })
  }, [])

  const active = plans.filter(p => p.status === "active").length
  const totalMRR = plans.filter(p => p.status === "active").reduce((s, p) => s + p.price, 0)

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Admin Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Recurring Plans</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Active recurring service subscriptions.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Active Plans</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1f6132" }}>{active}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Monthly Revenue</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{money(totalMRR)}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Plans</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{plans.length}</div>
            </div>
          </div>
          <DataTable
            headers={["Client", "Service", "Frequency", "Price", "Next Service", "Status"]}
            rows={plans.map(p => [
              p.clientName || "N/A",
              p.serviceType || "N/A",
              p.frequency || "N/A",
              money(p.price),
              p.nextServiceDate ? fmtDate(p.nextServiceDate) : "N/A",
              <StatusBadge key={p.id} status={p.status} />
            ])}
            emptyMessage="No recurring plans found."
          />
        </>
      )}
    </PortalShell>
  )
}
