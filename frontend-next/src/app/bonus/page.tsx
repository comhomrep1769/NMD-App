"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, SectionHeader, MetricCard, money } from "@/components/portal/PortalUI"
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

const TIER_STYLE: Record<number, { bg: string; color: string }> = {
  1: { bg: "#F3F4F6", color: "#6B7280" },
  2: { bg: "#FEF9C3", color: "#92400E" },
  3: { bg: "#EFF6FF", color: "#1D4ED8" },
  4: { bg: "#F0FDF9", color: "#0F766E" },
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

  const tierStyle = (tier: number) => TIER_STYLE[tier] || TIER_STYLE[1]
  const tierLabel = (tier: number) => `Tier ${tier} — ${tier === 1 ? "2%" : tier === 2 ? "4%" : tier === 3 ? "6%" : "8%"}`

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <SectionHeader
        title="Bonus Tracker"
        sub="7-day rolling employee revenue and bonus calculations. Admin approval required before payout."
      />

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <MetricCard label="Total Team Revenue (7d)" value={money(data.totalRevenue)} accent="#1D4ED8" />
            <MetricCard label="Total Pending Bonuses" value={money(data.totalBonus)} accent="#0F766E" />
            <MetricCard label="Employees Tracked" value={data.employees.length} accent="#6D28D9" />
          </div>

          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#111827", marginBottom: "0.5rem" }}>Bonus Tiers</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "Tier 1", range: "$0 - $1,000", pct: "2%" },
                { label: "Tier 2", range: "$1,000 - $2,000", pct: "4%" },
                { label: "Tier 3", range: "$2,000 - $3,500", pct: "6%" },
                { label: "Tier 4", range: "$3,500+", pct: "8%" },
              ].map(t => (
                <div key={t.label} style={{ background: "#F9FAFB", borderRadius: 8, padding: "0.5rem 0.85rem", fontSize: "0.8rem", color: "#374151" }}>
                  <strong>{t.label}</strong> {t.range} = <strong style={{ color: "#0F766E" }}>{t.pct}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data.employees.map(emp => {
              const ts = tierStyle(emp.tier)
              return (
                <div key={emp.userId} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>{emp.displayName}</div>
                      <div style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>{emp.email}</div>
                    </div>
                    <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 20, background: ts.bg, color: ts.color, fontWeight: 700 }}>{tierLabel(emp.tier)}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "0.75rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#9CA3AF", marginBottom: 2 }}>Weekly Revenue</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>{money(emp.weeklyRevenue)}</div>
                    </div>
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "0.75rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#9CA3AF", marginBottom: 2 }}>Bonus %</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F766E" }}>{emp.bonusPct}%</div>
                    </div>
                    <div style={{ background: "#F0FDF9", borderRadius: 8, padding: "0.75rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#9CA3AF", marginBottom: 2 }}>Bonus Amount</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F766E" }}>{money(emp.bonusAmount)}</div>
                    </div>
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "0.75rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#9CA3AF", marginBottom: 2 }}>Jobs Completed</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>{emp.jobsCompleted}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      placeholder="Approval notes (optional)..."
                      value={notes[emp.userId] || ""}
                      onChange={e => setNotes(prev => ({ ...prev, [emp.userId]: e.target.value }))}
                      style={{ flex: 1, padding: "0.55rem 0.85rem", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: "0.82rem", fontFamily: "DM Sans, sans-serif", outline: "none", color: "#111827", background: "white" }}
                    />
                    <button
                      onClick={() => approve(emp)}
                      disabled={approving === emp.userId || emp.bonusAmount === 0}
                      style={{ padding: "0.55rem 1.25rem", borderRadius: 8, border: "none", background: emp.bonusAmount > 0 ? "#0F766E" : "#E5E7EB", color: emp.bonusAmount > 0 ? "white" : "#9CA3AF", fontWeight: 600, cursor: emp.bonusAmount > 0 ? "pointer" : "not-allowed", fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                    >
                      {approving === emp.userId ? "Approving..." : "Approve Bonus"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </PortalShell>
  )
}