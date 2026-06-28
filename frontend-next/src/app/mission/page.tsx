import Navbar from '@/components/landing/Navbar'


const HERO_IMAGE = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80'
const FOUNDER_IMAGE = 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=600&q=80'
const EQUIPMENT_IMAGE = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'
const TRUCK_IMAGE = 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80'
const TEAM_IMAGE = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'

const VALUES = [
  {
    title: 'Accountability',
    desc: "We own every outcome. If a job isn't right, we come back. No arguments, no excuses.",
    icon: (
      <path d="M10 2L3 5.5V10C3 14 6.25 17.75 10 19C13.75 17.75 17 14 17 10V5.5L10 2Z" />
    ),
  },
  {
    title: 'Transparency',
    desc: "Every quote is itemized. Every photo is documented. You always know exactly what you're getting and why.",
    icon: (
      <>
        <circle cx="10" cy="10" r="8" />
        <path d="M7 10L9 12L13 8" />
      </>
    ),
  },
  {
    title: 'Craftsmanship',
    desc: "We don't rush. We use the right pressure, the right chemicals, and the right technique for each surface type.",
    icon: <path d="M10 2C10 2 4 8 4 12.5C4 15.5 6.75 18 10 18C13.25 18 16 15.5 16 12.5C16 8 10 2 10 2Z" />,
  },
  {
    title: 'Community',
    desc: "We live and work in Central Florida. Keeping our neighbors' properties clean is a point of genuine pride for us.",
    icon: (
      <>
        <path d="M17 8C17 12.5 10 18 10 18C10 18 3 12.5 3 8C3 5.2 6.1 3 10 3C13.9 3 17 5.2 17 8Z" />
        <circle cx="10" cy="8" r="2.5" />
      </>
    ),
  },
]

const CREDENTIALS = [
  'Licensed & bonded in Florida',
  'Full liability insurance on every job',
  'Background-checked, certified technicians',
  'Eco-friendly biodegradable cleaning chemicals',
]

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <circle cx="8" cy="8" r="7.5" fill="#F0FDF9" />
      <path d="M5.5 8L7 9.5L10.5 6" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export default function MissionPage() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative mt-[68px] flex min-h-[520px] items-center overflow-hidden bg-[#0A2720]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 100%)' }}
        />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-20 text-center sm:px-[65px]">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">Our Mission</p>
          <h1 className="mx-auto max-w-[640px] text-[40px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[52px]">
            &ldquo;We show up, we do the work right, and we stand behind every job &mdash; every time.&rdquo;
          </h1>
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section className="bg-white px-4 py-24 sm:px-[65px]">
        <div className="grid-mission-statement mx-auto flex max-w-[1440px] gap-12">
          <div className="flex-shrink-0" style={{ width: '380px' }}>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-teal-700">Who We Are</p>
            <h2 className="mb-6 text-3xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-4xl">
              A Central Florida company built on reliability
            </h2>
            <div className="mb-6 h-[3px] w-12 rounded bg-teal-700" />
            <div className="relative h-[280px] overflow-hidden rounded-xl bg-[#C8D8D6]">
              <img src={FOUNDER_IMAGE} alt="NMD founder" className="h-full w-full object-cover" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 50%)' }}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 pt-2">
            <p className="mb-[28px] text-lg leading-relaxed text-gray-700">
              NMD Pressure Washing Services LLC was built from the ground up in Central Florida &mdash;
              not from a franchise model, not from a corporate playbook. We started with one truck, one
              commitment: do the job so well that every client refers us to someone they know.
            </p>
            <p className="mb-[28px] text-base leading-relaxed text-gray-500">
              That commitment has driven us across 6 counties, through hundreds of jobs, and into a
              team of trained, licensed professionals who genuinely care about the work. Pressure
              washing is our craft &mdash; and we take pride in it.
            </p>
            <p className="mb-[48px] text-base leading-relaxed text-gray-500">
              We believe in transparent pricing, real before-and-after documentation, and showing up
              when we say we will. These aren&apos;t marketing points &mdash; they&apos;re the minimum
              standard we hold ourselves to on every single job.
            </p>
            <div className="flex flex-wrap gap-12">
              <div>
                <div className="text-3xl font-extrabold leading-none tracking-tight text-teal-700">500+</div>
                <div className="mt-1 text-[13px] text-gray-500">Jobs completed</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold leading-none tracking-tight text-teal-700">6</div>
                <div className="mt-1 text-[13px] text-gray-500">Counties served</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold leading-none tracking-tight text-teal-700">100%</div>
                <div className="mt-1 text-[13px] text-gray-500">Satisfaction guarantee</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-[#F8FAF9] px-4 py-24 sm:px-[65px]">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-teal-700">Our Values</p>
            <h2 className="text-[40px] font-bold leading-[1.1] tracking-[-0.025em] text-gray-900">
              What we believe in
            </h2>
          </div>
          <div className="grid-values grid grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl border border-gray-200 bg-white p-7">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F0FDF9]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0F766E" strokeWidth="1.4" strokeLinejoin="round">
                    {v.icon}
                  </svg>
                </div>
                <h3 className="mb-2.5 text-base font-bold tracking-tight text-gray-900">{v.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPERATIONS PHOTO BAND */}
      <section className="bg-white px-4 py-24 sm:px-[65px]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-12">
          <div className="min-w-0 flex-1 basis-[400px]">
            <p className="mb-[16px] text-[11px] font-bold uppercase tracking-wider text-teal-700">How We Work</p>
            <h2 className="mb-[24px] text-[32px] font-bold leading-[1.1] tracking-tight text-gray-900">
              Every job is documented from start to finish
            </h2>
            <p className="mb-[28px] text-base leading-relaxed text-gray-500">
              Before any equipment is turned on, we photograph the full scope. After the job, we
              photograph again &mdash; so you have a complete visual record of every surface we touched.
            </p>
            <p className="mb-[40px] text-base leading-relaxed text-gray-500">
              Our technicians are background-checked, trained in surface-specific techniques, and
              certified for chemical handling. We carry full liability insurance and are bonded in
              the state of Florida.
            </p>
            <div className="flex flex-col gap-[14px]">
              {CREDENTIALS.map((c) => (
                <div key={c} className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-sm text-gray-700">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-4">
            <div className="relative h-[220px] overflow-hidden rounded-xl bg-[#C4C0B8]">
              <img src={EQUIPMENT_IMAGE} alt="Pressure washing equipment" className="h-full w-full object-cover" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 50%)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative h-[140px] overflow-hidden rounded-[10px] bg-[#C8D8D6]">
                <img src={TRUCK_IMAGE} alt="Service truck" className="h-full w-full object-cover" />
              </div>
              <div className="relative h-[140px] overflow-hidden rounded-[10px] bg-[#B8AC98]">
                <img src={TEAM_IMAGE} alt="NMD team" className="h-full w-full object-cover brightness-[0.88]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gray-900 px-4 py-20 sm:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-12">
          <div>
            <h2 className="mb-3.5 whitespace-nowrap text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-4xl">
              Ready to see the difference?
            </h2>
            <p className="text-base leading-relaxed text-white/50">
              Join hundreds of Central Florida property owners who trust NMD.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/client/request-service"
              className="inline-flex items-center rounded-lg bg-teal-700 px-6 py-3 text-[15px] font-semibold !text-white"
            >
              Get a Free Quote
            </a>
            <a
              href="/join-our-team"
              className="inline-flex items-center rounded-lg border border-white/20 px-5 py-3 text-sm font-medium !text-white/70"
            >
              Join Our Team
            </a>
          </div>
        </div>
      </section>

    <footer className="border-t border-white/[0.08] bg-gray-900 px-4 py-8 sm:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight !text-white">NMD Pressure Washing</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] !text-teal-700">Services LLC</span>
          </div>
          <span className="text-xs !text-white/22">&copy; 2025 NMD Pressure Washing Services LLC. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="text-xs !text-white/22">Privacy Policy</a>
            <a href="#" className="text-xs !text-white/22">Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  )
}
