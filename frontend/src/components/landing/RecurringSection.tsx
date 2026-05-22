export default function RecurringSection() {
  const plans = [
    { freq: 'Weekly', note: 'Best for high-traffic commercial', featured: false },
    { freq: 'Biweekly', note: 'Popular for commercial properties', featured: false },
    { freq: 'Monthly', note: 'Perfect for residential upkeep', featured: true },
    { freq: 'Quarterly', note: 'Seasonal maintenance', featured: false },
    { freq: 'Bi-Annual', note: 'Twice-a-year deep clean', featured: false },
    { freq: 'Annual', note: 'Yearly property refresh', featured: false },
  ]

  return (
    <section className="nmd-section" id="recurring">
      <div className="nmd-section-header">
        <p className="nmd-section-eyebrow">Recurring plans</p>
        <h2 className="nmd-section-title">
          Save 20% on every<br />recurring service.
        </h2>
        <p className="nmd-section-sub">
          Lock in a recurring plan after your first service and save 20% on every
          future visit. Choose the cadence that fits your property — we handle
          the scheduling automatically.
        </p>
      </div>

      <div className="nmd-plans-grid">
        {plans.map((plan) => (
          <div key={plan.freq} className={`nmd-plan-card${plan.featured ? ' featured' : ''}`}>
            <div className="nmd-plan-freq">{plan.freq}</div>
            <div className="nmd-plan-discount">20% off</div>
            <hr className="nmd-plan-divider" />
            <p className="nmd-plan-note">{plan.note}</p>
          </div>
        ))}
      </div>

      <div className="nmd-first-service-banner">
        <div className="nmd-first-service-icon">ℹ</div>
        <div className="nmd-first-service-text">
          <h4>First service is billed at the standard rate</h4>
          <p>
            Your recurring discount activates from the second visit onward. Pricing is
            calculated after your first service based on your property size and scope —
            no hidden fees, no locked-in contracts.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a href="/client/request-service" className="btn-primary btn-lg">
          Start a Recurring Plan →
        </a>
      </div>
    </section>
  )
}
