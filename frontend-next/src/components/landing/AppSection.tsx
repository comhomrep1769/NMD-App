export default function AppSection() {
  const features = [
    {
      icon: '📋',
      title: 'Track your quotes & invoices',
      desc: 'View estimates, approve quotes, and see all invoices in one place.',
    },
    {
      icon: '📅',
      title: 'Manage appointments',
      desc: 'See upcoming service dates, request reschedules, and get reminders.',
    },
    {
      icon: '🔄',
      title: 'Manage your recurring plan',
      desc: 'Enroll, pause, or adjust your recurring service schedule anytime.',
    },
    {
      icon: '💬',
      title: 'Chat directly with our team',
      desc: 'Send messages, photos, and service updates straight from the app.',
    },
  ]

  return (
    <section className="nmd-section" id="get-app">
      <div className="nmd-app-section">
        {/* Left — content */}
        <div>
          <p className="nmd-section-eyebrow">Client app</p>
          <h2 className="nmd-section-title">
            Your property.<br />Your schedule.<br />Your portal.
          </h2>
          <p className="nmd-section-sub" style={{ marginTop: '1rem' }}>
            Create a free client account to manage quotes, invoices, appointments,
            and recurring services — all from your phone or desktop.
          </p>

          <div className="nmd-app-store-btns">
            <a href="/client/register" className="btn-primary btn-lg">
              Create Client Account
            </a>
          </div>

          <div className="nmd-app-features">
            {features.map((f) => (
              <div key={f.title} className="nmd-app-feature">
                <div className="nmd-app-feature-icon">{f.icon}</div>
                <div className="nmd-app-feature-text">
                  <h5>{f.title}</h5>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — phone mockup */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="nmd-phone-mockup">
            <div className="nmd-phone-screen">
              <div className="nmd-phone-logo">NMD</div>
              <div className="nmd-phone-app-name">NMD Client Portal</div>
              <div className="nmd-phone-app-sub">
                Quotes · Invoices · Appointments<br />
                Recurring Services · Photos
              </div>
              <a
                href="/client/register"
                className="btn-primary"
                style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.5rem 1.1rem' }}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
