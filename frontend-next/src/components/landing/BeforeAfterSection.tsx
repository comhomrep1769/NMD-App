'use client'

import { useState, useEffect } from 'react'

type Item = {
  title: string
  location: string
  tag: string
  tagBg: string
  tagColor: string
  imageKey: string
  defaultImg: string
}

const ITEMS: Item[] = [
  { title: 'Driveway Cleaning', location: 'Winter Park, FL', tag: 'Residential', tagBg: '#F0FDF9', tagColor: '#0F766E', imageKey: 'gallery.driveway_image_url', defaultImg: 'https://picsum.photos/seed/nmd-driveway/900/600' },
  { title: 'Roof Soft Wash', location: 'Orlando, FL', tag: 'Specialty', tagBg: '#F0FDF9', tagColor: '#0F766E', imageKey: 'gallery.roof_image_url', defaultImg: 'https://picsum.photos/seed/nmd-roof/900/600' },
  { title: 'Commercial Parking Lot', location: 'Kissimmee, FL', tag: 'Commercial', tagBg: '#EFF6FF', tagColor: '#1D4ED8', imageKey: 'gallery.parking_lot_image_url', defaultImg: 'https://picsum.photos/seed/nmd-parkinglot/900/600' },
  { title: 'Fence Restoration', location: 'Melbourne, FL', tag: 'Specialty', tagBg: '#FEF3C7', tagColor: '#92400E', imageKey: 'gallery.fence_image_url', defaultImg: 'https://picsum.photos/seed/nmd-fence/900/600' },
]

export default function BeforeAfterSection() {
  const [afterState, setAfterState] = useState<boolean[]>(ITEMS.map(() => false))
  const [siteImages, setSiteImages] = useState<Record<string, string>>({})
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/site-content`)
      .then(r => r.json())
      .then(d => { if (d.content) setSiteImages(d.content) })
      .catch(() => {})
  }, [])

  const toggle = (i: number, value: boolean) => {
    setAfterState((prev) => { const next = [...prev]; next[i] = value; return next })
  }

  return (
    <section className="bg-[#F8FAF9] px-4 py-24 sm:px-[65px]">
      <style>{`
        @keyframes nmdFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .nmd-gallery-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }
        .nmd-gallery-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.10);
        }
        .nmd-gallery-img {
          transition: filter 0.55s ease;
        }
      `}</style>

      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-teal-700">Gallery</p>
          <h2 className="mb-3.5 max-w-[600px] text-[40px] font-bold leading-[1.1] tracking-[-0.025em] text-gray-900">The Proof Is in the Photos.</h2>
          <p className="max-w-[480px] text-base leading-relaxed text-gray-500">Real jobs. Real results. Toggle between before and after on any card.</p>
        </div>

        <div className="grid-gallery grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          {ITEMS.map((item, i) => {
            const showAfter = afterState[i]
            const imgUrl = siteImages[item.imageKey] || item.defaultImg
            return (
              <div
                key={item.title}
                className="nmd-gallery-card overflow-hidden rounded-xl border border-gray-200 bg-white"
                style={mounted ? { animation: `nmdFadeUp 0.5s ease both`, animationDelay: `${i * 100}ms` } : { opacity: 0 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="relative h-[200px] overflow-hidden sm:h-[280px]">
                  <img
                    src={imgUrl}
                    alt={`${showAfter ? 'After' : 'Before'} — ${item.title}`}
                    className="nmd-gallery-img h-full w-full object-cover"
                    style={showAfter ? { filter: 'brightness(1.08) saturate(1.12)' } : { filter: 'brightness(0.7) saturate(0.4) sepia(0.25)' }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: showAfter ? 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 55%)' : 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)', transition: 'background 0.55s ease' }}
                  />
                  <div className="absolute bottom-3.5 right-3.5 flex gap-0.5 rounded-full bg-black/65 p-[3px]">
                    <button onClick={() => toggle(i, false)} className={!showAfter ? 'rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900' : 'rounded-full px-3 py-1.5 text-xs font-normal text-white/70'} style={{ transition: 'background 0.2s ease, color 0.2s ease' }}>Before</button>
                    <button onClick={() => toggle(i, true)} className={showAfter ? 'rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900' : 'rounded-full px-3 py-1.5 text-xs font-normal text-white/70'} style={{ transition: 'background 0.2s ease, color 0.2s ease' }}>After</button>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                    <div className="mt-0.5 text-xs text-gray-500">{item.location}</div>
                  </div>
                  <span className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: item.tagBg, color: item.tagColor }}>{item.tag}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

