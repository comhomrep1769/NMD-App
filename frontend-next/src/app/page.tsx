import type { Metadata } from 'next'
import Navbar from '@/components/landing/Navbar'
import ServicesSection from '@/components/landing/ServicesSection'
import RecurringSection from '@/components/landing/RecurringSection'
import PricingSection from '@/components/landing/PricingSection'
import AppSection from '@/components/landing/AppSection'
import Footer from '@/components/landing/Footer'
import GuruChat from '@/components/landing/GuruChat'

export const metadata: Metadata = {
  title: 'NMD Pressure Washing | Brevard & Orange County, FL',
  description:
    'Professional pressure washing in Brevard County & Orange County, FL. Residential, commercial, industrial, and specialty restoration. Free quotes. 20% off recurring plans.',
  alternates: { canonical: 'https://nmdpowash.com' },
}

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main>
        <section className="nmd-hero">
          <div className="nmd-hero-bg" aria-hidden="true" />
          <div className="nmd-hero-grid" aria-hidden="true" />

          <div className="nmd-hero-inner">
            {/* Left - copy */}
            <div>
              <div className="nmd-hero-eyebrow fade-up fade-up-1">
                <span className="nmd-hero-eyebrow-dot" />
                Orlando & Central Florida · Brevard County
              </div>

              <h1 className="nmd-hero-h1 fade-up fade-up-2">
                We make every<br />
                surface <em>spotless.</em>
              </h1>

              <p className="nmd-hero-sub fade-up fade-up-3">
                Professional pressure washing for homes, businesses, and industrial
                properties across Orlando, Orange County &amp; Brevard County. From driveways to rooftops —
                we restore every surface to its best.
              </p>

              <div className="nmd-hero-actions fade-up fade-up-4">
                <a href="/client/request-service" className="btn-primary btn-lg">
                  Get a Free Quote →
                </a>
                <a href="#services" className="btn-outline btn-lg">
                  View Services
                </a>
              </div>

              <div className="nmd-hero-stats fade-up fade-up-5">
                <div className="nmd-stat-item">
                  <div className="nmd-stat-num">100+</div>
                  <div className="nmd-stat-label">Services offered</div>
                </div>
                <div className="nmd-stat-item">
                  <div className="nmd-stat-num">2</div>
                  <div className="nmd-stat-label">Counties served</div>
                </div>
                <div className="nmd-stat-item">
                  <div className="nmd-stat-num">20%</div>
                  <div className="nmd-stat-label">Recurring discount</div>
                </div>
              </div>
            </div>

            {/* Right - service area card */}
            <div className="fade-up fade-up-3">
              <div className="nmd-area-card">
                <div className="nmd-area-badge">
                  📍 Service Areas
                </div>
                <h2 className="nmd-area-title">We come to you.</h2>
                <p className="nmd-area-sub">
                  Fully mobile — we serve residential, commercial, and industrial
                  properties across two counties.
                </p>

                <div className="nmd-county-list">
                  <div className="nmd-county-item" style={{ border: '1.5px solid var(--nmd-blue-200)', background: 'var(--nmd-blue-50)' }}>
                    <div className="nmd-county-icon blue">🌊</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong>Orange County</strong>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em',
                          textTransform: 'uppercase', background: 'var(--nmd-blue-500)',
                          color: 'white', padding: '1px 6px', borderRadius: 4
                        }}>Primary</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)', marginTop: 2 }}>
                        Orlando · Winter Park · Kissimmee · Ocoee
                      </div>
                    </div>
                    <span className="nmd-county-state">FL</span>
                  </div>

                  <div className="nmd-county-item">
                    <div className="nmd-county-icon green">🌿</div>
                    <div>
                      <strong>Brevard County</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)', marginTop: 2 }}>
                        Melbourne · Cocoa · Palm Bay · Titusville
                      </div>
                    </div>
                    <span className="nmd-county-state">FL</span>
                  </div>
                </div>

                <a href="/client/request-service" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Request Service in My Area
                </a>

                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', textAlign: 'center', marginTop: '0.75rem' }}>
                  Not sure if we cover your area? Request a quote and we&apos;ll confirm.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <div
          style={{
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
            padding: '1.5rem 2.5rem',
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              ['✅', 'Licensed & Insured'],
              ['🏠', 'Residential & Commercial'],
              ['🔬', 'Soft Wash Specialists'],
              ['📍', 'Orlando & Orange County — Primary'],
              ['📍', 'Brevard County'],
              ['🔄', '20% Recurring Discount'],
            ].map(([icon, label]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-text-2)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <ServicesSection />

        {/* Recurring Plans */}
        <div style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
          <PricingSection />
          <RecurringSection />
        </div>

        {/* Quote CTA */}
        <section className="nmd-cta-section">
          <div className="nmd-cta-inner">
            <div className="nmd-cta-eyebrow">
              <span>◉</span> Free estimates
            </div>
            <h2 className="nmd-cta-title">
              Ready for a cleaner property?
            </h2>
            <p className="nmd-cta-sub">
              Get a free quote in minutes. Tell us about your property, upload a few
              photos, and we&apos;ll come to you. Serving Brevard &amp; Orange County.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/client/request-service" className="btn-white">
                Request a Free Quote →
              </a>
              
                href="/client/register"
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.75)',
                  padding: '0.9rem 2rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                Create Client Account
              </a>
            </div>
          </div>
        </section>

        {/* App / Client Portal */}
        <AppSection />
      </main>

      <Footer />
      <GuruChat />
    </>
  )
}