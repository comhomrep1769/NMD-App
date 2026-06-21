import type { Metadata } from 'next'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import TrustBadges from '@/components/landing/TrustBadges'
import ServicesSection from '@/components/landing/ServicesSection'
import RecurringSection from '@/components/landing/RecurringSection'
import PricingSection from '@/components/landing/PricingSection'
import AppSection from '@/components/landing/AppSection'
import Footer from '@/components/landing/Footer'
import GuruChat from '@/components/landing/GuruChat'
import BeforeAfterSection from '@/components/landing/BeforeAfterSection'

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
        <Hero />
        <TrustBadges />

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
              <a href="/client/register" className="btn-outline-white">
                Create Client Account
              </a>
            </div>
          </div>
        </section>

        {/* Before & After */}
        <BeforeAfterSection />

        {/* App / Client Portal */}
        <AppSection />
      </main>

      <Footer />
      <GuruChat />
    </>
  )
}