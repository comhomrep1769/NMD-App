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
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Treatments</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Chemical treatments, dilution ratios, and safety notes.</p>
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
              style={{ padding: "0.55rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.875rem", fontFamily: "DM Sans, sans-serif", outline: "none", minWidth: 200 }}
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ padding: "0.55rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.875rem", fontFamily: "DM Sans, sans-serif", outline: "none" }}
            >
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {filtered.length === 0 ? (
            <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, padding: "3rem", textAlign: "center", color: "#8494b0" }}>No treatments found.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {filtered.map(t => (
                <div key={t.id} style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0e1117" }}>{t.name}</div>
                    {t.category && <span style={{ fontSize: "0.7rem", background: "#eaf7ef", color: "#1f6132", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{t.category}</span>}
                  </div>
                  {t.chemical && <div style={{ fontSize: "0.8rem", color: "#5a6a88", marginBottom: 4 }}><strong>Chemical:</strong> {t.chemical}</div>}
                  {t.dilutionRatio && <div style={{ fontSize: "0.8rem", color: "#5a6a88", marginBottom: 4 }}><strong>Dilution:</strong> {t.dilutionRatio}</div>}
                  {t.useCase && <div style={{ fontSize: "0.8rem", color: "#5a6a88", marginBottom: 4 }}><strong>Use:</strong> {t.useCase}</div>}
                  {t.safetyNotes && <div style={{ fontSize: "0.8rem", color: "#a32d2d", marginTop: 8, background: "#fcebeb", borderRadius: 6, padding: "6px 10px" }}><strong>Safety:</strong> {t.safetyNotes}</div>}
                  {t.instructions && <div style={{ fontSize: "0.8rem", color: "#5a6a88", marginTop: 8 }}><strong>Instructions:</strong> {t.instructions}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PortalShell>
  )
}
