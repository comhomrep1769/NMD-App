"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, SectionHeader, MetricCard, fmtDate, money } from "@/components/portal/PortalUI"
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
  const [statusFilter, setStatusFilter] = useState("all")
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

  const statusOptions = Array.from(new Set(plans.map(p => p.status).filter(Boolean)))
  const filtered = statusFilter === "all" ? plans : plans.filter(p => p.status === statusFilter)

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <SectionHeader
        title="Recurring Plans"
        sub="Active recurring service subscriptions."
      />

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <MetricCard label="Active Plans" value={active} accent="#0F766E" />
            <MetricCard label="Monthly Revenue" value={money(totalMRR)} accent="#1D4ED8" />
            <MetricCard label="Total Plans" value={plans.length} accent="#6D28D9" />
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
            headers={["Client", "Contact", "Address", "Service", "Frequency", "Price", "Next Service", "Status"]}
            rows={filtered.map(p => [
              <span key="client" style={{ fontWeight: 600 }}>{p.clientName || "—"}</span>,
              <div key="contact">
                <div style={{ fontSize: "0.82rem", color: "#374151" }}>{p.email || "—"}</div>
                <div style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>{p.phone || "—"}</div>
              </div>,
              <span key="addr" style={{ color: "#6B7280", maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.address || "—"}</span>,
              <span key="svc" style={{ color: "#6B7280" }}>{p.serviceType || "—"}</span>,
              <span key="freq" style={{ color: "#6B7280" }}>{p.frequency || "—"}</span>,
              <span key="price" style={{ fontWeight: 600 }}>{money(p.price)}</span>,
              <span key="next" style={{ color: "#9CA3AF", whiteSpace: "nowrap" }}>{p.nextServiceDate ? fmtDate(p.nextServiceDate) : "—"}</span>,
              <StatusBadge key="status" status={p.status} />,
            ])}
            emptyMessage="No recurring plans found."
          />
        </>
      )}
    </PortalShell>
  )
}