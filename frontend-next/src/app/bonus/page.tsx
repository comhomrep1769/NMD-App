"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, money } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Employee = {
  userId: string; displayName: string; email: string
  weeklyRevenue: number; bonusPct: number; bonusAmount: number
  jobsCompleted: number; tier: number; status: string
}

type Summary = {
  employees: Employee[]
  totalBonus: number
  totalRevenue: number
}

export default function BonusPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [approving, setApproving] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/bonus/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError("Could not load bonus data."); setLoading(false) })
  }, [])

  const approve = async (emp: Employee) => {
    setApproving(emp.userId)
    const token = getNmdToken()
    try {
      await fetch(`${API}/api/bonus/approve/${emp.userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: emp.bonusAmount, notes: notes[emp.userId] || "" })
      })
      alert(`Bonus of ${money(emp.bonusAmount)} approved for ${emp.displayName}`)
    } catch {
      alert("Approval failed.")
    }
    setApproving(null)
  }

  const tierColor = (tier: number) => tier === 4 ? "#1f6132" : tier === 3 ? "#124d83" : tier === 2 ? "#e67e22" : "#8494b0"
  const tierLabel = (tier: number) => `Tier ${tier} — ${tier === 1 ? "2%" : tier === 2 ? "4%" : tier === 3 ? "6%" : "8%"}`

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Admin Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Bonus Tracker</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>7-day rolling employee revenue and bonus calculations. Admin approval required before payout.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Team Revenue (7d)</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{money(data.totalRevenue)}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Total Pending Bonuses</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1f6132" }}>{money(data.totalBonus)}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Employees Tracked</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117" }}>{data.employees.length}</div>
            </div>
          </div>

          <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#0e1117", marginBottom: "0.5rem" }}>Bonus Tiers</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "Tier 1", range: "$0 - $1,000", pct: "2%" },
                { label: "Tier 2", range: "$1,000 - $2,000", pct: "4%" },
                { label: "Tier 3", range: "$2,000 - $3,500", pct: "6%" },
                { label: "Tier 4", range: "$3,500+", pct: "8%" },
              ].map(t => (
                <div key={t.label} style={{ background: "#f4f7fb", borderRadius: 8, padding: "0.5rem 0.85rem", fontSize: "0.8rem", color: "#3a4660" }}>
                  <strong>{t.label}</strong> {t.range} = <strong style={{ color: "#1f6132" }}>{t.pct}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data.employees.map(emp => (
              <div key={emp.userId} style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0e1117" }}>{emp.displayName}</div>
                    <div style={{ fontSize: "0.78rem", color: "#8494b0" }}>{emp.email}</div>
                  </div>
                  <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 20, background: "#eaf7ef", color: tierColor(emp.tier), fontWeight: 700 }}>{tierLabel(emp.tier)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ background: "#f4f7fb", borderRadius: 8, padding: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "#8494b0", marginBottom: 2 }}>Weekly Revenue</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0e1117" }}>{money(emp.weeklyRevenue)}</div>
                  </div>
                  <div style={{ background: "#f4f7fb", borderRadius: 8, padding: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "#8494b0", marginBottom: 2 }}>Bonus %</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1f6132" }}>{emp.bonusPct}%</div>
                  </div>
                  <div style={{ background: "#eaf7ef", borderRadius: 8, padding: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "#8494b0", marginBottom: 2 }}>Bonus Amount</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1f6132" }}>{money(emp.bonusAmount)}</div>
                  </div>
                  <div style={{ background: "#f4f7fb", borderRadius: 8, padding: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "#8494b0", marginBottom: 2 }}>Jobs Completed</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0e1117" }}>{emp.jobsCompleted}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    placeholder="Approval notes (optional)..."
                    value={notes[emp.userId] || ""}
                    onChange={e => setNotes(prev => ({ ...prev, [emp.userId]: e.target.value }))}
                    style={{ flex: 1, padding: "0.55rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.82rem", fontFamily: "DM Sans, sans-serif", outline: "none" }}
                  />
                  <button
                    onClick={() => approve(emp)}
                    disabled={approving === emp.userId || emp.bonusAmount === 0}
                    style={{ padding: "0.55rem 1.25rem", borderRadius: 8, border: "none", background: emp.bonusAmount > 0 ? "linear-gradient(135deg, #1f6132, #124d83)" : "#dde4ef", color: emp.bonusAmount > 0 ? "white" : "#8494b0", fontWeight: 600, cursor: emp.bonusAmount > 0 ? "pointer" : "not-allowed", fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                  >
                    {approving === emp.userId ? "Approving..." : "Approve Bonus"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PortalShell>
  )
}