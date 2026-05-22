import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://nmdpowash.com'),
  title: {
    default: 'NMD Pressure Washing | Brevard & Orange County, FL',
    template: '%s | NMD Pressure Washing',
  },
  description:
    'Professional pressure washing services in Brevard County and Orange County, Florida. Residential, commercial, industrial, and specialty restoration. Get a free quote today.',
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
      <body>{children}</body>
    </html>
  )
}
