'use client'

import { motion, type Variants } from 'framer-motion'

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function RecurringSection() {
  const plans = [
    { freq: 'Weekly',    note: 'Best for high-traffic commercial',  featured: false },
    { freq: 'Biweekly', note: 'Popular for commercial properties',  featured: false },
    { freq: 'Monthly',  note: 'Perfect for residential upkeep',     featured: true  },
    { freq: 'Quarterly',note: 'Seasonal maintenance',               featured: false },
    { freq: 'Bi-Annual',note: 'Twice-a-year deep clean',            featured: false },
    { freq: 'Annual',   note: 'Yearly property refresh',            featured: false },
  ]

  return (
    <section className="bg-white px-4 py-24 sm:px-[65px]" id="recurring">
      <div className="mx-auto max-w-[1440px]">
        <motion.div
          className="mb-12 flex flex-wrap items-start justify-between gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
        >
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-teal-700">Recurring plans</p>
            <h2 className="mb-4 max-w-[500px] text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Save 20% on every recurring service.
            </h2>
            <p className="max-w-[520px] text-base leading-relaxed text-gray-500">
              Lock in a recurring plan after your first service and save 20% on every
              future visit. Choose the cadence that fits your property &mdash; we handle
              the scheduling automatically.
            </p>
          </div>
          <div className="flex-shrink-0 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
            &#9201; All plans include 20% off every service
          </div>
        </motion.div>

        <motion.div
          className="grid-recurring grid grid-cols-6 gap-4"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.freq}
              variants={fadeUp}
              className={plan.featured ? 'flex flex-col gap-2.5 rounded-xl bg-teal-700 px-4 py-5' : 'flex flex-col gap-2.5 rounded-xl border border-gray-200 bg-[#F8FAF9] px-4 py-5'}
              style={plan.featured ? { position: 'relative' } : undefined}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0C5A54] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Popular</div>
              )}
              <div className={	ext-[13px] font-bold }>{plan.freq}</div>
              <div className={plan.featured ? 'inline-flex w-fit items-center rounded-md bg-white/[0.18] px-2 py-[3px] text-[11px] font-bold text-white' : 'inline-flex w-fit items-center rounded-md bg-[#F0FDF9] px-2 py-[3px] text-[11px] font-bold text-[#0F766E]'}>
                20% off
              </div>
              <p className={	ext-xs leading-relaxed }>{plan.note}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-8 flex items-center gap-5 rounded-xl border border-blue-100 bg-blue-50 p-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' as const }}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg text-blue-700">&#8505;</div>
          <div>
            <h4 className="mb-1 text-sm font-bold text-gray-900">First service is billed at the standard rate</h4>
            <p className="text-sm leading-relaxed text-gray-500">
              Your recurring discount activates from the second visit onward. Pricing is
              calculated after your first service based on your property size and scope &mdash;
              no hidden fees, no locked-in contracts.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' as const }}
        >
          <a href="/client/request-service" className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-7 py-3.5 text-base font-semibold !text-white shadow-sm hover:bg-teal-800">
            Start a Recurring Plan &rarr;
          </a>
        </motion.div>
      </div>
    </section>
  )
}
