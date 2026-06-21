import Link from 'next/link'

const ORANGE_COUNTY_CITIES = ['Orlando', 'Winter Park', 'Kissimmee', 'Ocoee']
const BREVARD_COUNTY_CITIES = ['Melbourne', 'Cocoa', 'Palm Bay', 'Titusville']

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-[68px]">
      <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[1fr_380px] lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Orlando &amp; Central Florida · Brevard County
          </div>

          <h1 className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            We make every<br />
            surface <span className="text-teal-700">spotless.</span>
          </h1>

          <p className="mb-8 max-w-[480px] text-base leading-relaxed text-gray-600">
            Professional pressure washing for homes, businesses, and industrial
            properties across Orlando, Orange County &amp; Brevard County. From
            driveways to rooftops — we restore every surface to its best.
          </p>

          <div className="mb-10 flex flex-wrap gap-3">
            <a
              href="/client/request-service"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-7 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-teal-800"
            >
              Get a Free Quote →
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-7 py-3.5 text-base font-semibold text-gray-900 hover:bg-gray-50"
            >
              View Services
            </a>
          </div>

          <div className="flex gap-10">
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-gray-900">100+</div>
              <div className="mt-1 text-sm text-gray-500">Services offered</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-gray-900">2</div>
              <div className="mt-1 text-sm text-gray-500">Counties served</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-teal-700">20%</div>
              <div className="mt-1 text-sm text-gray-500">Recurring discount</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-lg">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
            📍 Service Areas
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">We come to you.</h2>
          <p className="mb-5 text-sm leading-relaxed text-gray-500">
            Fully mobile — we serve residential, commercial, and industrial
            properties across two counties.
          </p>

          <div className="mb-6 flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-lg">🌊</span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <strong className="text-sm text-gray-900">Orange County</strong>
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Primary
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-gray-500">{ORANGE_COUNTY_CITIES.join(' · ')}</div>
              </div>
              <span className="text-xs text-gray-400">FL</span>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-lg">🌿</span>
              <div className="flex-1">
                <strong className="text-sm text-gray-900">Brevard County</strong>
                <div className="mt-0.5 text-xs text-gray-500">{BREVARD_COUNTY_CITIES.join(' · ')}</div>
              </div>
              <span className="text-xs text-gray-400">FL</span>
            </div>
          </div>

          <Link
            href="/client/request-service"
            className="flex w-full items-center justify-center rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Request Service in My Area
          </Link>

          <p className="mt-3 text-center text-xs text-gray-400">
            Not sure if we cover your area? Request a quote and we&apos;ll confirm.
          </p>
        </div>
      </div>
    </section>
  )
}