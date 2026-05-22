export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="nmd-footer">
      <div className="nmd-footer-inner">
        <div className="nmd-footer-top">
          {/* Brand */}
          <div>
            <div className="nmd-footer-brand-name">
              <div
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'linear-gradient(135deg, #1f6132, #124d83)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.65rem', fontWeight: 800,
                }}
              >
                NMD
              </div>
              NMD Pressure Washing Services LLC
            </div>
            <p className="nmd-footer-brand-desc">
              Professional pressure washing services in Orlando, Orange County &amp;
              Brevard County, Florida. Residential, commercial, industrial,
              and specialty restoration.
            </p>
            <div className="nmd-footer-social">
              <a
                href="https://lnk.bio/NMDPowash"
                target="_blank"
                rel="noopener noreferrer"
                className="nmd-social-btn"
                title="All Social Links"
              >
                🔗
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="nmd-footer-col-title">Services</div>
            <ul className="nmd-footer-links">
              {[
                ['#services', 'Residential'],
                ['#services', 'Commercial'],
                ['#services', 'Industrial'],
                ['#services', 'Specialty & Restoration'],
                ['#recurring', 'Recurring Plans'],
              ].map(([href, label]) => (
                <li key={label}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas */}
          <div id="service-areas">
            <div className="nmd-footer-col-title">Service Areas</div>
            <div className="nmd-footer-service-areas">
              {[
                'Orange County, FL — Primary',
                'Orlando, FL',
                'Winter Park, FL',
                'Kissimmee, FL',
                'Brevard County, FL',
                'Melbourne, FL',
                'Palm Bay, FL',
              ].map((area) => (
                <div key={area} className="nmd-footer-area">
                  <span className="nmd-footer-area-dot" />
                  {area}
                </div>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="nmd-footer-col-title">Company</div>
            <ul className="nmd-footer-links">
              <li><a href="/client/request-service">Get a Free Quote</a></li>
              <li><a href="/client/register">Create Client Account</a></li>
              <li><a href="#get-app">Client Portal</a></li>
              <li>
                <a
                  href="https://lnk.bio/NMDPowash"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Follow Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="nmd-footer-bottom">
          <p className="nmd-footer-copy">
            © {year} NMD Pressure Washing Services LLC. All rights reserved. Serving Orlando, Orange County &amp;
            Brevard County, FL.
          </p>
          <div className="nmd-footer-portal-links">
            <a href="/admin">Admin Portal</a>
            <a href="/employee">Employee Portal</a>
            <a href="/client">Client Portal</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
