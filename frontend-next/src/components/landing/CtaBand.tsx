'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const PHONE_DEFAULT = '(407) 555-0182'

export default function CtaBand() {
  const [phone, setPhone] = useState(PHONE_DEFAULT)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/site-content`)
      .then(r => r.json())
      .then(d => { if (d.content?.['site.phone']) setPhone(d.content['site.phone']) })
      .catch(() => {})
  }, [])

  return (
    <section className="relative overflow-hidden bg-gray-900 px-4 py-24 sm:px-[65px]">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.013) 0, rgba(255,255,255,0.013) 1px, transparent 0, transparent 50%)', backgroundSize: '32px 32px' }} />
      <div className="relative mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-12">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: 'easeOut' as const }}
        >
          <h2 className="mb-4 max-w-[520px] text-[44px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
            Ready for a Cleaner Property?
          </h2>
          <p className="max-w-[460px] text-[17px] leading-[1.6] text-white/50">
            Get your free quote today. Most jobs scheduled within 48&ndash;72 hours. No hidden fees, ever.
          </p>
        </motion.div>
        <motion.div
          className="flex flex-col items-start gap-3"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, delay: 0.15, ease: 'easeOut' as const }}
        >
          <a href="/client/request-service" className="inline-flex items-center whitespace-nowrap rounded-lg bg-teal-700 px-[30px] py-3.5 text-[15px] font-semibold !text-white">
            Get a Free Quote
          </a>
          <span className="px-1 text-[13px] text-white/35">or call {phone}</span>
        </motion.div>
      </div>
    </section>
  )
}
