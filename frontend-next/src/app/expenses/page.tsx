"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, SectionHeader, MetricCard, fmtDate, money } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Expense = {
  id: string; employeeName: string; category: string; description: string
  amount: number; expenseDate: string; status: string; receiptUrl: string | null
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewReceipt, setViewReceipt] = useState<Expense | null>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/expenses`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setExpenses(Array.isArray(d) ? d : d.expenses || []); setLoading(false) })
      .catch(() => { setError("Could not load expenses."); setLoading(false) })
  }, [])

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const pending = expenses.filter(e => e.status === "pending").length

  // Build filter options only from statuses that actually exist in the loaded data
  const statusOptions = Array.from(new Set(expenses.map(e => e.status).filter(Boolean)))
  const filtered = statusFilter === "all" ? expenses : expenses.filter(e => e.status === statusFilter)

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>

      {viewReceipt?.receiptUrl && (
        <div onClick={() => setViewReceipt(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", cursor: "zoom-out" }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ color: "white", fontFamily: "DM Sans, sans-serif", fontWeight: 700 }}>
                Receipt — {viewReceipt.employeeName} · {money(viewReceipt.amount)}
              </div>
              <button onClick={() => setViewReceipt(null)} style={{ background: "none", border: "none", color: "white", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>
            {viewReceipt.receiptUrl.startsWith("data:image") || /\.(png|jpe?g|webp|gif)$/i.test(viewReceipt.receiptUrl) ? (
              <img src={viewReceipt.receiptUrl} alt="Receipt" style={{ width: "100%", borderRadius: 12, maxHeight: "75vh", objectFit: "contain" }} />
            ) : (
              <div style={{ background: "white", borderRadius: 12, padding: "2rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📄</div>
                <a href={viewReceipt.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "0.7rem 1.5rem", borderRadius: 8, background: "#0F766E", color: "white", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>Open Receipt</a>
              </div>
            )}
          </div>
        </div>
      )}

      <SectionHeader
        title="Expenses"
        sub="Business expenses and reimbursement requests."
      />

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <MetricCard label="Total Expenses" value={money(total)} sub={`${expenses.length} logged`} accent="#0F766E" />
            <MetricCard label="Pending Approval" value={pending} accent="#F59E0B" />
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
            headers={["Employee", "Category", "Description", "Amount", "Date", "Status", ""]}
            rows={filtered.map(e => [
              <span key="emp" style={{ fontWeight: 500 }}>{e.employeeName || "—"}</span>,
              <span key="cat" style={{ color: "#6B7280" }}>{e.category || "—"}</span>,
              <span key="desc" style={{ color: "#6B7280" }}>{e.description || "—"}</span>,
              <span key="amt" style={{ fontWeight: 600 }}>{money(e.amount)}</span>,
              <span key="date" style={{ color: "#9CA3AF", whiteSpace: "nowrap" }}>{e.expenseDate ? fmtDate(e.expenseDate) : "—"}</span>,
              <StatusBadge key="status" status={e.status} />,
              e.receiptUrl ? (
                <button key="receipt" onClick={() => setViewReceipt(e)}
                  style={{ padding: "0.3rem 0.65rem", borderRadius: 6, border: "none", background: "#F0FDF9", color: "#0F766E", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                  Receipt
                </button>
              ) : <span key="receipt" style={{ color: "#D1D5DB", fontSize: "0.75rem" }}>—</span>,
            ])}
            emptyMessage="No expenses found."
          />
        </>
      )}
    </PortalShell>
  )
}