"use client"
import { useEffect, useState } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Pricing = {
  id: string; serviceType: string; surfaceType: string; pricingModel: string
  flatPrice: number; sqftPrice: number; hourlyRate: number; notes: string
}

function fmtPrice(model: string, p: Pricing) {
  if (model === "per_sqft") return `$${p.sqftPrice}/sqft`
  if (model === "flat_rate") return `$${p.flatPrice} flat`
  if (model === "hourly") return `$${p.hourlyRate}/hr`
  return "Custom"
}

export default function PricingPage() {
  const [items, setItems] = useState<Pricing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/pricing`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d) ? d : d.pricingItems || d.pricing || []); setLoading(false) })
      .catch(() => { setError("Could not load pricing data."); setLoading(false) })
  }, [])

  const filtered = items.filter(i =>
    !search ||
    i.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
    i.surfaceType?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Admin Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Pricing</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Service pricing reference and Homewyse benchmarks.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <input
              placeholder="Search services or surfaces..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "0.55rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.875rem", fontFamily: "DM Sans, sans-serif", outline: "none", minWidth: 260 }}
            />
          </div>
          <DataTable
            headers={["Service", "Surface", "Model", "Price", "Notes"]}
            rows={filtered.map(i => [
              i.serviceType || "N/A",
              i.surfaceType || "N/A",
              i.pricingModel || "N/A",
              fmtPrice(i.pricingModel, i),
              i.notes ? i.notes.slice(0, 80) + (i.notes.length > 80 ? "..." : "") : "N/A"
            ])}
            emptyMessage="No pricing data found."
          />
        </>
      )}
    </PortalShell>
  )
}
