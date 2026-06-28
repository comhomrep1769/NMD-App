const SERVICES_LINKS = ['Residential', 'Commercial', 'Industrial', 'Specialty & Restoration', 'Recurring Plans']
const AREA_LINKS = ['Orange County FL', 'Orlando FL', 'Winter Park FL', 'Kissimmee FL', 'Brevard County FL', 'Melbourne FL', 'Palm Bay FL']

export default function Footer() {
  return (
    <footer className="bg-gray-900 pt-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-[65px]">
        <div className="grid-footer grid grid-cols-[2fr_1fr_1fr_1fr] gap-12 border-b border-white/10 pb-12">
          <div>
            <div className="mb-4 flex flex-col leading-tight">
              <span className="text-[17px] font-bold tracking-tight text-white">NMD Pressure Washing</span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] !text-teal-500">Services LLC</span>
            </div>
            <p className="mb-5 max-w-[300px] text-sm leading-relaxed !text-white/40">
              Professional pressure washing for homes, businesses, and industrial properties
              across Central Florida. Licensed, insured, and committed to results.
            </p>
            <p className="text-[13px] !text-white/30">(407) 555-0182 &middot; hello@nmdpressure.com</p>
          </div>

          <div>
            <div className="mb-5 text-[10px] font-bold uppercase tracking-[0.12em] !text-white/28">Services</div>
            <div className="flex flex-col gap-2.5">
              {SERVICES_LINKS.map((label) => (
                <a key={label} href="#services" className="text-sm !text-white/50">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 text-[10px] font-bold uppercase tracking-[0.12em] !text-white/28">Service Areas</div>
            <div className="flex flex-col gap-2.5">
              {AREA_LINKS.map((label) => (
                <a key={label} href="#service-areas" className="text-sm !text-white/50">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 text-[10px] font-bold uppercase tracking-[0.12em] !text-white/28">Company</div>
            <div className="flex flex-col gap-2.5">
              <a href="/client/request-service" className="text-sm !text-white/50">Get a Free Quote</a>
              <a href="/client/register" className="text-sm !text-white/50">Create Client Account</a>
              <a href="/mission" className="text-sm !text-white/50">Our Mission</a>
              <a href="/join-our-team" className="text-sm !text-white/50">Join Our Team</a>
              <a href="#" className="text-sm !text-white/50">Follow Us</a>
              <div className="my-1.5 h-px bg-white/10" />
              <a href="/admin/login" className="flex items-center gap-1.5 text-sm !text-white/35">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Admin Portal
              </a>
              <a href="/employee/login" className="flex items-center gap-1.5 text-sm !text-white/35">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="4" r="2.2" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M1.5 10.5c0-2.21 2.015-4 4.5-4s4.5 1.79 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Employee Portal
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <span className="text-xs !text-white/22">&copy; 2025 NMD Pressure Washing Services LLC. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="text-xs !text-white/22">Privacy Policy</a>
            <a href="#" className="text-xs !text-white/22">Terms of Service</a>
            <a href="#" className="text-xs !text-white/22">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
