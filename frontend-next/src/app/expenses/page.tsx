"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, StatusBadge, fmtDate, money } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Expense = {
  id: string; employeeName: string; category: string; description: string
  amount: number; expenseDate: string; status: string; receiptUrl: string | null
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
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

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Admin Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Expenses</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Business expenses and reimbursement requests.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Expenses</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{money(total)}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Pending Approval</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#e67e22" }}>{pending}</div>
            </div>
          </div>
          <DataTable
            headers={["Employee", "Category", "Description", "Amount", "Date", "Status"]}
            rows={expenses.map(e => [
              e.employeeName || "N/A",
              e.category || "N/A",
              e.description || "N/A",
              money(e.amount),
              e.expenseDate ? fmtDate(e.expenseDate) : "N/A",
              <StatusBadge key={e.id} status={e.status} />
            ])}
            emptyMessage="No expenses found."
          />
        </>
      )}
    </PortalShell>
  )
}
