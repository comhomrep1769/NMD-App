"use client"
import { useEffect, useState } from "react"
import type { FormEvent, CSSProperties, ReactNode } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, DataTable, SearchInput } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Pricing = {
  id: string; serviceType: string; surfaceType: string; pricingModel: string
  flatPrice: number; sqftPrice: number; hourlyRate: number; notes: string
}

type PricingModel = "per_sqft" | "flat_rate" | "hourly" | "custom"

const MODEL_LABELS: Record<string, string> = {
  per_sqft: "Per Sqft",
  flat_rate: "Flat Rate",
  hourly: "Hourly",
  custom: "Custom",
}

function fmtPrice(model: string, p: Pricing) {
  if (model === "per_sqft") return `$${p.sqftPrice}/sqft`
  if (model === "flat_rate") return `$${p.flatPrice} flat`
  if (model === "hourly") return `$${p.hourlyRate}/hr`
  return "Custom"
}

const emptyForm = {
  serviceType: "",
  surfaceType: "",
  pricingModel: "per_sqft" as PricingModel,
  priceValue: "",
  notes: "",
}

export default function PricingPage() {
  const [items, setItems] = useState<Pricing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [seeding, setSeeding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  function authHeaders() {
    const token = getNmdToken()
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  }

  function loadData() {
    setLoading(true)
    fetch(`${API}/api/pricing`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d) ? d : d.pricingItems || d.pricing || []); setLoading(false) })
      .catch(() => { setError("Could not load pricing data."); setLoading(false) })
  }

  useEffect(() => { loadData() }, [])

  const filtered = items.filter(i =>
    !search ||
    i.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
    i.surfaceType?.toLowerCase().includes(search.toLowerCase())
  )

  function openAddModal() {
    setForm(emptyForm)
    setFormError("")
    setShowAddModal(true)
  }

  async function handleAddSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.serviceType.trim() || !form.surfaceType.trim()) {
      setFormError("Service and surface type are required.")
      return
    }
    if (form.pricingModel !== "custom" && !form.priceValue.trim()) {
      setFormError("Enter a price for this pricing model.")
      return
    }
    setSaving(true)
    setFormError("")
    const priceNum = parseFloat(form.priceValue) || 0
    const body = {
      serviceType: form.serviceType.trim(),
      surfaceType: form.surfaceType.trim(),
      pricingModel: form.pricingModel,
      flatPrice: form.pricingModel === "flat_rate" ? priceNum : 0,
      sqftPrice: form.pricingModel === "per_sqft" ? priceNum : 0,
      hourlyRate: form.pricingModel === "hourly" ? priceNum : 0,
      notes: form.notes.trim(),
    }
    try {
      const res = await fetch(`${API}/api/pricing`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) })
      if (!res.ok) throw new Error("Request failed")
      setShowAddModal(false)
      loadData()
    } catch {
      setFormError("Could not save pricing item. Try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this pricing item?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`${API}/api/pricing/${id}`, { method: "DELETE", headers: authHeaders() })
      if (!res.ok) throw new Error("Request failed")
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {
      alert("Could not delete this pricing item.")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSeedHomewyse() {
    if (!window.confirm("Seed Homewyse benchmark pricing? This adds reference rows you can edit or remove afterward.")) return
    setSeeding(true)
    try {
      const res = await fetch(`${API}/api/pricing/seed-homewyse`, { method: "POST", headers: authHeaders() })
      if (!res.ok) throw new Error("Request failed")
      loadData()
    } catch {
      alert("Could not seed Homewyse benchmarks.")
    } finally {
      setSeeding(false)
    }
  }

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0F766E", marginBottom: 6 }}>NMD Portal</div>
          <h1 style={{ fontFamily: "DM Sans, sans-serif", fontSize: "28px", fontWeight: 800, color: "#111827", letterSpacing: "-0.025em", marginBottom: 6 }}>Pricing</h1>
          <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>Service pricing reference and Homewyse benchmarks.</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            onClick={handleSeedHomewyse}
            disabled={seeding}
            style={ghostButtonStyle(seeding)}
          >
            {seeding ? "Seeding..." : "Seed Homewyse Benchmarks"}
          </button>
          <button
            onClick={openAddModal}
            style={primaryButtonStyle(false)}
          >
            + Add Pricing Item
          </button>
        </div>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: "1rem", maxWidth: 320 }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search services or surfaces..."
            />
          </div>

          <DataTable
            headers={["Service", "Surface", "Model", "Price", "Notes", ""]}
            rows={filtered.map(i => [
              i.serviceType || "N/A",
              i.surfaceType || "N/A",
              MODEL_LABELS[i.pricingModel] || i.pricingModel || "N/A",
              fmtPrice(i.pricingModel, i),
              i.notes ? i.notes.slice(0, 80) + (i.notes.length > 80 ? "..." : "") : "N/A",
              <button
                key={i.id}
                onClick={() => handleDelete(i.id)}
                disabled={deletingId === i.id}
                style={deleteLinkStyle(deletingId === i.id)}
              >
                {deletingId === i.id ? "Deleting..." : "Delete"}
              </button>
            ])}
            emptyMessage="No pricing data found."
          />
        </>
      )}

      {showAddModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(17,24,39,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem",
          }}
          onClick={() => !saving && setShowAddModal(false)}
        >
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleAddSubmit}
            style={{
              background: "#fff", borderRadius: 10, padding: "1.75rem", width: "100%", maxWidth: 440,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", marginBottom: "1.1rem" }}>
              Add Pricing Item
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <Field label="Service Type">
                <input
                  value={form.serviceType}
                  onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                  style={inputStyle}
                  placeholder="e.g. House Washing"
                />
              </Field>

              <Field label="Surface Type">
                <input
                  value={form.surfaceType}
                  onChange={e => setForm(f => ({ ...f, surfaceType: e.target.value }))}
                  style={inputStyle}
                  placeholder="e.g. Vinyl Siding"
                />
              </Field>

              <Field label="Pricing Model">
                <select
                  value={form.pricingModel}
                  onChange={e => setForm(f => ({ ...f, pricingModel: e.target.value as PricingModel, priceValue: "" }))}
                  style={inputStyle}
                >
                  <option value="per_sqft">Per Sqft</option>
                  <option value="flat_rate">Flat Rate</option>
                  <option value="hourly">Hourly</option>
                  <option value="custom">Custom (quote on request)</option>
                </select>
              </Field>

              {form.pricingModel !== "custom" && (
                <Field label={form.pricingModel === "per_sqft" ? "Price per Sqft ($)" : form.pricingModel === "hourly" ? "Hourly Rate ($)" : "Flat Price ($)"}>
                  <input
                    type="number"
                    step="0.01"
                    value={form.priceValue}
                    onChange={e => setForm(f => ({ ...f, priceValue: e.target.value }))}
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </Field>
              )}

              <Field label="Notes (optional)">
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                  placeholder="Any reference notes for this rate..."
                />
              </Field>
            </div>

            {formError && (
              <div style={{ color: "#B91C1C", fontSize: "0.8rem", marginTop: "0.75rem" }}>{formError}</div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.4rem" }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                style={ghostButtonStyle(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={primaryButtonStyle(saving)}
              >
                {saving ? "Saving..." : "Save Pricing Item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </PortalShell>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>{label}</span>
      {children}
    </label>
  )
}

const inputStyle: CSSProperties = {
  padding: "0.55rem 0.75rem",
  borderRadius: 8,
  border: "1.5px solid #E5E7EB",
  fontSize: "0.875rem",
  fontFamily: "DM Sans, sans-serif",
  outline: "none",
  color: "#111827",
  width: "100%",
}

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: "0.6rem 1.1rem",
    borderRadius: 8,
    border: "none",
    background: "#0F766E",
    color: "#fff",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.7 : 1,
  }
}

function ghostButtonStyle(disabled: boolean): CSSProperties {
  return {
    padding: "0.6rem 1rem",
    borderRadius: 8,
    border: "1.5px solid #E5E7EB",
    background: "#fff",
    color: "#374151",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
  }
}

function deleteLinkStyle(disabled: boolean): CSSProperties {
  return {
    border: "none",
    background: "none",
    color: "#B91C1C",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  }
}