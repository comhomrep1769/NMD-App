'use client'

import { motion, type Variants } from 'framer-motion'

const FEATURES = [
  { title: 'View & pay quotes and invoices instantly', desc: 'Stripe-powered payments, PDF downloads, and full history.' },
  { title: 'Book and manage appointments', desc: 'Real-time scheduling, reminders, and reschedule requests.' },
  { title: 'Submit service requests with photos', desc: 'Attach photos of the area needing work for instant quoting.' },
  { title: 'Before & after photo gallery per job', desc: 'Every completed job includes a full photo set saved to your account.' },
]

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

function FeatureIcon({ index }: { index: number }) {
  const paths = [
    <svg key="0" width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1.5" y="3" width="12" height="9" rx="1.5" stroke="#0F766E" strokeWidth="1.3" />
      <path d="M5 3V2.5C5 2 5.5 1.5 6 1.5H9C9.5 1.5 10 2 10 2.5V3" stroke="#0F766E" strokeWidth="1.3" strokeLinecap="round" />
    </svg>,
    <svg key="1" width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1.5" y="1.5" width="12" height="12" rx="2" stroke="#0F766E" strokeWidth="1.3" />
      <path d="M5 1.5V3.5M10 1.5V3.5M1.5 6H13.5" stroke="#0F766E" strokeWidth="1.3" strokeLinecap="round" />
    </svg>,
    <svg key="2" width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="2" y="1.5" width="10" height="12" rx="1.5" stroke="#0F766E" strokeWidth="1.3" />
      <circle cx="7.5" cy="7.5" r="2" stroke="#0F766E" strokeWidth="1.3" />
    </svg>,
    <svg key="3" width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M1.5 3.5L7.5 8L13.5 3.5" stroke="#0F766E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1.5" y="2.5" width="12" height="10" rx="1.5" stroke="#0F766E" strokeWidth="1.3" />
    </svg>,
  ]
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#F0FDF9]">
      {paths[index]}
    </div>
  )
}

export default function AppSection() {
  return (
    <section className="bg-white px-4 py-24 sm:px-[65px]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-20">

        <div className="min-w-0 flex-1 basis-[380px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' as const }}
          >
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-teal-700">Client App</p>
            <h2 className="mb-4.5 text-[40px] font-bold leading-[1.1] tracking-[-0.025em] text-gray-900">
              Your Property. Under Control.
            </h2>
            <p className="mb-9 max-w-[440px] text-base leading-relaxed text-gray-500">
              Manage every aspect of your service from one place. Book, pay, communicate, and
              track &mdash; all in the NMD client portal.
            </p>
          </motion.div>

          <motion.div
            className="mb-10 flex flex-col gap-4"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} className="flex items-start gap-3">
                <FeatureIcon index={i} />
                <div>
                  <div className="mb-0.5 text-sm font-semibold text-gray-900">{f.title}</div>
                  <div className="text-[13px] leading-relaxed text-gray-500">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' as const }}
          >
            <a href="/client/register" className="inline-flex items-center rounded-lg bg-teal-700 px-6 py-3.5 text-[15px] font-semibold !text-white">
              Create Client Account
            </a>
            <a href="#" className="text-sm font-medium text-teal-700">Learn more &rarr;</a>
          </motion.div>
        </div>

        <motion.div
          className="relative flex flex-shrink-0 items-center justify-center p-5"
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' as const }}
        >
          <div className="pointer-events-none absolute h-[300px] w-[300px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(15,118,110,0.12) 0%, transparent 70%)' }} />
          <div className="relative h-[516px] w-[256px] rounded-[38px] bg-[#1C1C1E] p-3" style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)' }}>
            <div className="flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-[#0F1E1D]">
              <div className="flex h-11 flex-shrink-0 items-center justify-between px-4.5">
                <span className="text-xs font-semibold text-white">9:41</span>
                <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
                  <rect x="0.5" y="0.5" width="13" height="10" rx="1.5" stroke="rgba(255,255,255,0.5)" />
                  <rect x="2" y="2" width="8" height="7" rx="0.5" fill="rgba(255,255,255,0.5)" />
                </svg>
              </div>
              <div className="flex-shrink-0 px-4 pb-3.5">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">NMD Pressure Washing</div>
                <div className="text-xl font-extrabold tracking-tight text-white">Dashboard</div>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-hidden bg-[#F0F9F8] p-2.5">
                <div className="rounded-[10px] border-l-[3px] border-teal-700 bg-white px-3 py-2.5">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-teal-700">Upcoming Job</div>
                  <div className="text-[13px] font-semibold text-gray-900">Driveway &amp; Sidewalk</div>
                  <div className="mt-0.5 text-[10px] text-gray-500">Tue, Jun 24 &middot; 9:00 AM</div>
                </div>
                <div className="rounded-[10px] border-l-[3px] border-amber-500 bg-white px-3 py-2.5">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-amber-700">Invoice Due</div>
                  <div className="text-[13px] font-semibold text-gray-900">Invoice #1042 &middot; .00</div>
                  <div className="mt-1.5 inline-block rounded bg-teal-700 px-2 py-1 text-[9px] font-bold tracking-wide text-white">PAY NOW</div>
                </div>
                <div className="rounded-[10px] border-l-[3px] border-emerald-500 bg-white px-3 py-2.5">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600">Completed</div>
                  <div className="text-[13px] font-semibold text-gray-900">Roof Soft Wash</div>
                  <div className="mt-0.5 text-[10px] text-gray-500">Jun 18 &middot; 4 photos added</div>
                </div>
                <div className="rounded-[10px] bg-teal-700 px-3 py-2.5">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/60">Recurring Plan</div>
                  <div className="text-[13px] font-semibold text-white">Monthly &middot; 20% off</div>
                  <div className="mt-0.5 text-[10px] text-white/65">Active since Jan 2025</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
