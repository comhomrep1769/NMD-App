export default function PricingSection() {
  const services = [
    { name: "Decks", desc: "Bring your deck back to life.", price: "$120", unit: "Up to 300 sq ft" },
    { name: "RVs", desc: "Make your RV shine like new.", price: "$150", unit: "Up to 30 ft" },
    { name: "Fence", desc: "Clean, protect, and enhance.", price: "$100", unit: "Up to 100 ft" },
    { name: "Driveways", desc: "Remove stains. Boost curb appeal.", price: "$120", unit: "Up to 500 sq ft" },
    { name: "Houses", desc: "Soft wash for a clean, bright home.", price: "$180", unit: "Up to 2,000 sq ft" },
  ]
  const packages = [
    { name: "Bronze Package", items: ["House", "Driveway"], price: "$250", savings: "Save $50", featured: false },
    { name: "Silver Package", items: ["House", "Driveway", "Fence"], price: "$450", savings: "Save $100", featured: true },
    { name: "Gold Package", items: ["House", "Driveway", "Fence", "Deck"], price: "$600", savings: "Save $150", featured: false },
  ]
  return (
    <section id="pricing" style={{ background: "#f4f7fb", padding: "5rem 1.5rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1f6132", marginBottom: 10 }}>Transparent Pricing</p>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 12 }}>Simple starting prices.</h2>
          <p style={{ fontSize: "1rem", color: "#5a6a88", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>Every property is different. These are our starting rates - final pricing is based on your property size, condition, and scope.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "3rem" }}>
          {services.map(s => (
            <div key={s.name} style={{ background: "white", borderRadius: 14, border: "1.5px solid #dde4ef", padding: "1.5rem", textAlign: "center", boxShadow: "0 2px 12px rgba(14,17,23,0.04)" }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#0e1117", marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: "0.82rem", color: "#8494b0", marginBottom: "1rem", lineHeight: 1.4 }}>{s.desc}</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8494b0", marginBottom: 4 }}>Starting at</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: "2rem", fontWeight: 800, color: "#1f6132", lineHeight: 1 }}>{s.price}</div>
              <div style={{ fontSize: "0.75rem", color: "#8494b0", marginTop: 4 }}>{s.unit}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-block", background: "linear-gradient(135deg, #1f6132, #124d83)", borderRadius: 10, padding: "0.5rem 1.25rem", marginBottom: "1.5rem" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.05em" }}>PACKAGE DEAL - SAVE MORE!</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#5a6a88" }}>Bundle and Save - The more you clean, the more you save!</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {packages.map(p => (
            <div key={p.name} style={{ background: p.featured ? "linear-gradient(135deg, #1f6132, #124d83)" : "white", borderRadius: 16, border: p.featured ? "none" : "1.5px solid #dde4ef", padding: "1.75rem", textAlign: "center", boxShadow: p.featured ? "0 8px 32px rgba(31,97,50,0.25)" : "0 2px 12px rgba(14,17,23,0.04)", transform: p.featured ? "scale(1.03)" : "none" }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: "1rem", fontWeight: 700, color: p.featured ? "rgba(255,255,255,0.9)" : "#0e1117", marginBottom: "1rem" }}>{p.name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginBottom: "1.25rem" }}>
                {p.items.map(item => (
                  <span key={item} style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 20, background: p.featured ? "rgba(255,255,255,0.15)" : "#eaf7ef", color: p.featured ? "white" : "#1f6132", fontWeight: 600 }}>{item}</span>
                ))}
              </div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: p.featured ? "rgba(255,255,255,0.6)" : "#8494b0", marginBottom: 4 }}>Starting at</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: "2.25rem", fontWeight: 800, color: p.featured ? "white" : "#0e1117", lineHeight: 1 }}>{p.price}</div>
              <div style={{ marginTop: 8, display: "inline-block", background: p.featured ? "rgba(255,255,255,0.2)" : "#eaf7ef", borderRadius: 20, padding: "3px 12px", fontSize: "0.78rem", fontWeight: 700, color: p.featured ? "white" : "#1f6132" }}>{p.savings}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <a href="/client/request-service" style={{ display: "inline-block", padding: "0.85rem 2rem", borderRadius: 10, background: "linear-gradient(135deg, #1f6132, #124d83)", color: "white", fontWeight: 700, fontSize: "1rem", textDecoration: "none", fontFamily: "DM Sans, sans-serif" }}>Get a Free Estimate</a>
          <p style={{ marginTop: "1rem", fontSize: "0.82rem", color: "#8494b0" }}>Free estimates. No contracts. Fully insured.</p>
        </div>
      </div>
    </section>
  )
}