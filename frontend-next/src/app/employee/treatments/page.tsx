"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Treatment = {
  id: string; name: string; category: string; chemical: string | null
  dilutionRatio: string | null; useCase: string | null; safetyNotes: string | null
  instructions: string | null; surfaceTypes: string[]
}

export default function EmployeeTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/treatments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setTreatments(Array.isArray(d) ? d : d.treatments || []); setLoading(false) })
      .catch(() => { setError("Could not load treatments."); setLoading(false) })
  }, [])

  const categories = ["All", ...Array.from(new Set(treatments.map(t => t.category).filter(Boolean)))]
  const filtered = treatments.filter(t => {
    const matchCat = category === "All" || t.category === category
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0F766E", marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: "DM Sans, sans-serif", fontSize: "28px", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", marginBottom: 6 }}>Treatments</h1>
        <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>Chemical treatments, dilution ratios, and safety notes.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <input
              placeholder="Search treatments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "0.55rem 0.85rem", borderRadius: 8, border: "1.5px solid #E5E7EB", fontSize: "0.875rem", fontFamily: "DM Sans, sans-serif", outline: "none", minWidth: 200, color: "#111827" }}
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ padding: "0.55rem 0.85rem", borderRadius: 8, border: "1.5px solid #E5E7EB", fontSize: "0.875rem", fontFamily: "DM Sans, sans-serif", outline: "none", color: "#111827", background: "white" }}
            >
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {filtered.length === 0 ? (
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "3rem", textAlign: "center", color: "#9CA3AF" }}>No treatments found.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {filtered.map(t => (
                <div key={t.id} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>{t.name}</div>
                    {t.category && <span style={{ fontSize: "0.7rem", background: "#F0FDF9", color: "#0F766E", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{t.category}</span>}
                  </div>
                  {t.chemical && <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: 4 }}><strong>Chemical:</strong> {t.chemical}</div>}
                  {t.dilutionRatio && <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: 4 }}><strong>Dilution:</strong> {t.dilutionRatio}</div>}
                  {t.useCase && <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: 4 }}><strong>Use:</strong> {t.useCase}</div>}
                  {t.surfaceTypes && t.surfaceTypes.length > 0 && (
                    <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 500 }}>Surfaces:</span>
                      {t.surfaceTypes.map(s => (
                        <span key={s} style={{ fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#F8FAF9", color: "#6B7280", border: "1px solid #E5E7EB" }}>{s}</span>
                      ))}
                    </div>
                  )}
                  {t.safetyNotes && <div style={{ fontSize: "0.8rem", color: "#B91C1C", marginTop: 8, background: "#FEF2F2", borderRadius: 6, padding: "6px 10px" }}><strong>Safety:</strong> {t.safetyNotes}</div>}
                  {t.instructions && <div style={{ fontSize: "0.8rem", color: "#6B7280", marginTop: 8 }}><strong>Instructions:</strong> {t.instructions}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PortalShell>
  )
}