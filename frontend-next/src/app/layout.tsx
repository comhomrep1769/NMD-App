import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './tailwind-base.css'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
  display: 'swap',
})

// Fallback defaults — exact current values from this file — used if the
// site-content API is unreachable, so metadata is never blank even if the
// backend/DB is temporarily down.
const SITE_DEFAULTS: Record<string, string> = {
  'seo.global.description':
    'Professional pressure washing services in Brevard County and Orange County, Florida. Residential, commercial, industrial, and specialty restoration. Get a free quote today.',
  'seo.global.search_console_verification': '',
}

async function getGlobalSiteContent(): Promise<Record<string, string>> {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    const res = await fetch(`${API}/api/site-content`, { cache: 'no-store' })
    if (!res.ok) return SITE_DEFAULTS
    const data = await res.json()
    return { ...SITE_DEFAULTS, ...(data.content || {}) }
  } catch {
    return SITE_DEFAULTS
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getGlobalSiteContent()
  const verificationCode = site['seo.global.search_console_verification']

  return {
    metadataBase: new URL('https://nmdpowash.com'),
    title: {
      default: 'NMD Pressure Washing | Brevard & Orange County, FL',
      template: '%s | NMD Pressure Washing',
    },
    description: site['seo.global.description'],
    keywords: [
      'pressure washing Brevard County',
      'pressure washing Orange County Florida',
      'house washing Melbourne FL',
      'roof cleaning Brevard County',
      'driveway cleaning Florida',
      'commercial pressure washing Orlando',
      'soft washing Florida',
      'NMD pressure washing',
    ],
    authors: [{ name: 'NMD Pressure Washing' }],
    creator: 'NMD Pressure Washing',
    // Next.js renders the correct <meta name="google-site-verification" .../>
    // tag automatically from this field — only included if a code is set,
    // so nothing renders until an admin actually pastes one in.
    ...(verificationCode ? { verification: { google: verificationCode } } : {}),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://nmdpowash.com',
      siteName: 'NMD Pressure Washing',
      title: 'NMD Pressure Washing | Brevard & Orange County, FL',
      description:
        'Professional pressure washing in Brevard & Orange County, FL. Residential, commercial, industrial, and specialty restoration services.',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'NMD Pressure Washing — Brevard & Orange County Florida',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'NMD Pressure Washing | Brevard & Orange County, FL',
      description:
        'Professional pressure washing in Brevard & Orange County, FL.',
      images: ['/og-image.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: 'https://nmdpowash.com',
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Local business structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'NMD Pressure Washing',
              description:
                'Professional pressure washing services in Brevard County and Orange County, Florida.',
              url: 'https://nmdpowash.com',
              telephone: '',
              areaServed: [
                {
                  '@type': 'AdministrativeArea',
                  name: 'Brevard County',
                  containedInPlace: { '@type': 'State', name: 'Florida' },
                },
                {
                  '@type': 'AdministrativeArea',
                  name: 'Orange County',
                  containedInPlace: { '@type': 'State', name: 'Florida' },
                },
              ],
              serviceType: [
                'Pressure Washing',
                'Soft Washing',
                'Roof Cleaning',
                'House Washing',
                'Driveway Cleaning',
                'Commercial Pressure Washing',
                'Rust Removal',
              ],
              priceRange: '$$',
              openingHours: 'Mo-Sa 07:00-19:00',
              sameAs: ['https://lnk.bio/NMDPowash'],
            }),
          }}
        />
      </head>
      <body className={dmSans.className}>{children}</body>
    </html>
  )
}