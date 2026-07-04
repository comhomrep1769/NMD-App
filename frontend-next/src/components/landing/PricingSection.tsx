'use client'

import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export default function PricingSection() {
  const services = [
    { name: 'Driveway', desc: 'Concrete & asphalt driveways, up to 600 sq ft.', price: '$89' },
    { name: 'House Exterior', desc: 'Single-story home soft wash, up to 2,000 sq ft.', price: '$249' },
    { name: 'Deck & Patio', desc: 'Wood or composite decks & pavers, up to 400 sq ft.', price: '$149' },
    { name: 'Fence', desc: 'Wood, vinyl & chain-link fences, up to 100 linear ft.', price: '$99' },
    { name: 'RV Cleaning', desc: 'Full exterior RV & boat wash, oxidation treatment.', price: '$199' },
  ]
  const packages = [
    { tier: 'Bronze', price: '$329', items: ['Driveway & Sidewalk Cleaning', 'Fence Washing', 'Pool Deck Cleaning'] },
    { tier: 'Silver', price: '$549', items: ['Driveway & Sidewalk Cleaning', 'House Exterior Soft Wash', 'Deck & Patio Cleaning', 'Fence Washing'] },
    { tier: 'Gold', price: '$849', items: ['Full Property Deep Clean', 'Roof Soft Wash Included', 'All Hardscape Surfaces', 'Priority Scheduling'] },
  ]

  return (
    <section id="pricing" className="bg-[#F8FAF9] px-4 py-24 sm:px-[65px]">
      <div className="mx-auto max-w-[1440px]">

        {/* Header */}
        <motion.div
          className="mb-12 max-w-[600px]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-teal-700">Pricing</p>
          <h2 className="mb-3.5 text-[40px] font-bold leading-[1.1] tracking-[-0.025em] text-gray-900">
            Transparent Pricing. No Surprises.
          </h2>
          <p className="text-base leading-relaxed text-gray-500">
            Starting prices for common services. Final quotes depend on size and condition &mdash; always provided before work begins.
          </p>
        </motion.div>

        {/* Service cards */}
        <motion.div
          className="grid-pricing-cards mb-12 grid grid-cols-2 gap-4 sm:grid-cols-5"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {services.map((s) => (
            <motion.div key={s.name} variants={fadeUp} className="flex flex-col rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-teal-700">{s.name}</div>
              <div className="mb-0.5 text-3xl font-extrabold leading-none text-gray-900">{s.price}</div>
              <div className="mb-4 text-xs text-gray-400">starting price</div>
              <p className="flex-1 text-[13px] leading-relaxed text-gray-500">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          className="mb-8 flex items-center gap-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="h-px flex-1 bg-gray-200" />
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-gray-500">Complete Packages</span>
          <div className="h-px flex-1 bg-gray-200" />
        </motion.div>

        {/* Package cards */}
        <motion.div
          className="grid-packages grid grid-cols-1 gap-5 sm:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {/* Bronze */}
          <motion.div variants={fadeUp} className="rounded-xl border border-gray-200 bg-white p-7">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-800">Bronze</div>
            <div className="mb-1 text-4xl font-extrabold leading-none text-gray-900">{packages[0].price}</div>
            <div className="mb-5 text-xs text-gray-400">one-time service</div>
            <div className="mb-6 flex flex-col gap-2.5">
              {packages[0].items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-[#F0FDF9] text-teal-700">&#10003;</span>
                  {item}
                </div>
              ))}
            </div>
            <a href="/client/request-service" className="block rounded-lg border border-gray-200 py-2.5 text-center text-sm font-semibold text-gray-700">Get a Quote</a>
          </motion.div>

          {/* Silver */}
          <motion.div variants={fadeUp} className="relative rounded-xl border-2 border-teal-700 bg-white p-7 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-teal-700 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider !text-white">Most Popular</div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-teal-700">Silver</div>
            <div className="mb-1 text-4xl font-extrabold leading-none text-gray-900">{packages[1].price}</div>
            <div className="mb-5 text-xs text-gray-400">one-time service</div>
            <div className="mb-6 flex flex-col gap-2.5">
              {packages[1].items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">&#10003;</span>
                  {item}
                </div>
              ))}
            </div>
            <a href="/client/request-service" className="block rounded-lg bg-teal-700 py-2.5 text-center text-sm font-semibold !text-white">Get a Quote</a>
          </motion.div>

          {/* Gold */}
          <motion.div variants={fadeUp} className="rounded-xl bg-[#0C3D38] p-7">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6EE7B7]">Gold</div>
            <div className="mb-1 text-4xl font-extrabold leading-none !text-white">{packages[2].price}</div>
            <div className="mb-5 text-xs text-white/40">one-time service</div>
            <div className="mb-6 flex flex-col gap-2.5">
              {packages[2].items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-white/85">
                  <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-400">&#10003;</span>
                  {item}
                </div>
              ))}
            </div>
            <a href="/client/request-service" className="block rounded-lg border border-white/20 bg-white/[0.12] py-2.5 text-center text-sm font-semibold !text-white">Get a Quote</a>
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <a href="/client/request-service" className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-7 py-3.5 text-base font-semibold !text-white shadow-sm hover:bg-teal-800">
            Get a Free Estimate
          </a>
          <p className="mt-4 text-sm text-gray-400">Free estimates. No contracts. Fully insured.</p>
        </motion.div>
      </div>
    </section>
  )
}
