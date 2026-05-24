"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, money } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type BonusData = {
  weeklyRevenue: number; jobsCompleted: number
  bonusPct: number; bonusAmount: number; tier: number
  toNextTier: number; nextTierPct: number | null; status: string
}

export default function EmployeeBonusPage() {
  const [data, setData] = useState<BonusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/bonus/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError("Could not load bonus data."); setLoading(false) })
  }, [])

  const tiers = [
    { tier: 1, label: "Tier 1", range: "$0 - $1,000", pct: "2%" },
    { tier: 2, label: "Tier 2", range: "$1,000 - $2,000", pct: "4%" },
    { tier: 3, label: "Tier 3", range: "$2,000 - $3,500", pct: "6%" },
    { tier: 4, label: "Tier 4", range: "$3,500+", pct: "8%" },
  ]

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>My Bonus</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Your 7-day rolling revenue and estimated bonus. Bonuses require admin approval before payout.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Weekly Revenue</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0e1117" }}>{money(data.weeklyRevenue)}</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Bonus Rate</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1f6132" }}>{data.bonusPct}%</div>
            </div>
            <div style={{ background: "linear-gradient(135deg, #eaf7ef, #e8f3fd)", border: "1.5px solid #c0dd97", borderRadius: 12, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1f6132", marginBottom: 6 }}>Estimated Bonus</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1f6132" }}>{money(data.bonusAmount)}</div>
              <div style={{ fontSize: "0.72rem", color: "#5a6a88", marginTop: 4 }}>Pending approval</div>
            </div>
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8494b0", marginBottom: 6 }}>Jobs Completed</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0e1117" }}>{data.jobsCompleted}</div>
            </div>
          </div>

          {data.toNextTier > 0 && data.nextTierPct && (
            <div style={{ background: "#fff9e6", border: "1.5px solid #f5e6a0", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#8a6a00", marginBottom: 4 }}>Next Tier Unlock</div>
              <p style={{ fontSize: "0.85rem", color: "#8a6a00", margin: 0 }}>
                Generate <strong>{money(data.toNextTier)}</strong> more in revenue this week to reach the next tier and earn <strong>{data.nextTierPct}%</strong> bonus instead.
              </p>
            </div>
          )}

          <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, padding: "1.25rem" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#0e1117", marginBottom: "1rem" }}>Bonus Tier System</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tiers.map(t => (
                <div key={t.tier} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem 1rem", borderRadius: 8, background: data.tier === t.tier ? "linear-gradient(135deg, #eaf7ef, #e8f3fd)" : "#f4f7fb", border: data.tier === t.tier ? "1.5px solid #c0dd97" : "1.5px solid transparent" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: data.tier === t.tier ? "linear-gradient(135deg, #1f6132, #124d83)" : "#dde4ef", display: "flex", alignItems: "center", justifyContent: "center", color: data.tier === t.tier ? "white" : "#8494b0", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>{t.tier}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0e1117" }}>{t.range}</div>
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: data.tier === t.tier ? "#1f6132" : "#8494b0" }}>{t.pct}</div>
                  {data.tier === t.tier && <span style={{ fontSize: "0.72rem", background: "#1f6132", color: "white", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Current</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#f4f7fb", border: "1.5px solid #dde4ef", borderRadius: 10, padding: "1rem", fontSize: "0.82rem", color: "#5a6a88", lineHeight: 1.6 }}>
            Revenue is calculated from completed jobs over the last 7 days. If you worked a job with other employees, revenue is split evenly. Bonuses are estimated and require admin approval before payout.
          </div>
        </div>
      )}
    </PortalShell>
  )
}