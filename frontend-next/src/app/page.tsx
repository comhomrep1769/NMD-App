import type { Metadata } from 'next'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import TrustBadges from '@/components/landing/TrustBadges'
import ServicesSection from '@/components/landing/ServicesSection'
import RecurringSection from '@/components/landing/RecurringSection'
import CtaBand from '@/components/landing/CtaBand'
import PricingSection from '@/components/landing/PricingSection'
import AppSection from '@/components/landing/AppSection'
import Footer from '@/components/landing/Footer'
import GuruChat from '@/components/landing/GuruChat'
import BeforeAfterSection from '@/components/landing/BeforeAfterSection'

// Fallback defaults — exact current values from this file — used if the
// site-content API is unreachable, so metadata is never blank even if the
// backend/DB is temporarily down.
const SEO_DEFAULTS: Record<string, string> = {
  'seo.home.title': 'NMD Pressure Washing | Brevard & Orange County, FL',
  'seo.home.description': 'Professional pressure washing in Brevard County & Orange County, FL. Residential, commercial, industrial, and specialty restoration. Free quotes. 20% off recurring plans.',
  'seo.home.og_image': '/og-image.jpg',
}

async function getSiteSeo(): Promise<Record<string, string>> {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    const res = await fetch(`${API}/api/site-content`, { cache: 'no-store' })
    if (!res.ok) return SEO_DEFAULTS
    const data = await res.json()
    return { ...SEO_DEFAULTS, ...(data.content || {}) }
  } catch {
    return SEO_DEFAULTS
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeo()
  const title = seo['seo.home.title']
  const description = seo['seo.home.description']
  const ogImage = seo['seo.home.og_image']

  return {
    title,
    description,
    alternates: { canonical: 'https://nmdpowash.com' },
    // NOTE: declaring openGraph/twitter here fully replaces the root
    // layout's versions for this page (Next.js does not deep-merge these
    // objects) — that's intentional, so the homepage's social previews stay
    // in sync with the admin-edited title/description/image above.
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://nmdpowash.com',
      siteName: 'NMD Pressure Washing',
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'NMD Pressure Washing — Brevard & Orange County Florida',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
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
        <PricingSection />
        <RecurringSection />

        <CtaBand />

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