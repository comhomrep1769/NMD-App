import Link from 'next/link'

const ORANGE_COUNTY_CITIES = ['Orlando', 'Winter Park', 'Kissimmee', 'Ocoee']
const BREVARD_COUNTY_CITIES = ['Melbourne', 'Cocoa', 'Palm Bay', 'Titusville']

const DEFAULTS: Record<string, string> = {
  'hero.image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1800&q=80',
  'hero.badge_text': 'Orlando & Central Florida . Brevard County',
  'hero.headline_main': 'We make every surface',
  'hero.headline_highlight': 'spotless.',
  'hero.subtext': 'Professional pressure washing for homes, businesses, and industrial properties across Orlando, Orange County & Brevard County. From driveways to rooftops - we restore every surface to its best.',
  'hero.cta_primary_text': 'Get a Free Quote',
  'hero.cta_secondary_text': 'View Services',
  'hero.stat1_value': '100+',
  'hero.stat1_label': 'Services offered',
  'hero.stat2_value': '2',
  'hero.stat2_label': 'Counties served',
  'hero.stat3_value': '20%',
  'hero.stat3_label': 'Recurring discount',
}

async function getSiteContent(): Promise<Record<string, string>> {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    const res = await fetch(`${API}/api/site-content`, { cache: 'no-store' })
    if (!res.ok) return DEFAULTS
    const data = await res.json()
    return { ...DEFAULTS, ...(data.content || {}) }
  } catch {
    return DEFAULTS
  }
}

export default async function Hero() {
  const content = await getSiteContent()

  return (
    <section className="relative overflow-hidden pt-[68px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${content['hero.image_url']}")` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(105deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.68) 55%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-12 px-6 py-20 sm:px-[65px] lg:grid-cols-[1fr_380px] lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {content['hero.badge_text']}
          </div>

          <h1 className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight !text-white sm:text-5xl lg:text-6xl">
            {content['hero.headline_main']}<br />
            <span className="text-emerald-400">{content['hero.headline_highlight']}</span>
          </h1>

          <p className="mb-8 max-w-[480px] text-base leading-relaxed !text-white/70">
            {content['hero.subtext']}
          </p>

          <div className="mb-10 flex flex-wrap gap-3">
            
             <a href="/client/request-service"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-7 py-3.5 text-base font-semibold !text-white shadow-sm hover:bg-teal-800"
            >
              {content['hero.cta_primary_text']} &rarr;
            </a>
            
            <a  href="#services"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-7 py-3.5 text-base font-semibold !text-white hover:bg-white/15"
            >
              {content['hero.cta_secondary_text']}
            </a>
          </div>

          <div className="flex gap-10">
            <div>
              <div className="text-3xl font-extrabold tracking-tight !text-white">{content['hero.stat1_value']}</div>
              <div className="mt-1 text-sm !text-white/50">{content['hero.stat1_label']}</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight !text-white">{content['hero.stat2_value']}</div>
              <div className="mt-1 text-sm !text-white/50">{content['hero.stat2_label']}</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-emerald-400">{content['hero.stat3_value']}</div>
              <div className="mt-1 text-sm !text-white/50">{content['hero.stat3_label']}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 p-7 backdrop-blur-xl">
          <div className="mb-4 text-[10px] font-bold uppercase tracking-wider !text-white/40">Service Areas</div>
          <h2 className="mb-2 text-xl font-bold !text-white">We come to you.</h2>
          <p className="mb-5 text-sm leading-relaxed !text-white/60">
            Fully mobile &mdash; we serve residential, commercial, and industrial
            properties across two counties.
          </p>

          <div className="mb-6 flex flex-col gap-3">
            <div className="border-b border-white/10 pb-3">
              <div className="mb-2 flex items-center gap-1.5">
                <strong className="text-sm font-semibold !text-white">Orange County</strong>
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide !text-white">
                  Primary
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ORANGE_COUNTY_CITIES.map((c) => (
                  <span key={c} className="rounded-md bg-white/10 px-2.5 py-1 text-xs !text-white/70">{c}</span>
                ))}
              </div>
            </div>

            <div>
              <strong className="mb-2 block text-sm font-semibold !text-white">Brevard County</strong>
              <div className="flex flex-wrap gap-1.5">
                {BREVARD_COUNTY_CITIES.map((c) => (
                  <span key={c} className="rounded-md bg-white/10 px-2.5 py-1 text-xs !text-white/70">{c}</span>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/client/request-service"
            className="flex w-full items-center justify-center rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold !text-white hover:bg-teal-800"
          >
            Request Service in My Area
          </Link>

          <p className="mt-3 text-center text-xs !text-white/40">
            Not sure if we cover your area? Request a quote and we&apos;ll confirm.
          </p>
        </div>
      </div>
    </section>
  )
}
