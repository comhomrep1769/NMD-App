'use client'

import { useState } from 'react'

type Item = {
  title: string
  location: string
  tag: string
  tagBg: string
  tagColor: string
  seed: string
}

const ITEMS: Item[] = [
  { title: 'Driveway Cleaning', location: 'Winter Park, FL', tag: 'Residential', tagBg: '#F0FDF9', tagColor: '#0F766E', seed: 'nmd-driveway' },
  { title: 'Roof Soft Wash', location: 'Orlando, FL', tag: 'Specialty', tagBg: '#F0FDF9', tagColor: '#0F766E', seed: 'nmd-roof' },
  { title: 'Commercial Parking Lot', location: 'Kissimmee, FL', tag: 'Commercial', tagBg: '#EFF6FF', tagColor: '#1D4ED8', seed: 'nmd-parkinglot' },
  { title: 'Fence Restoration', location: 'Melbourne, FL', tag: 'Specialty', tagBg: '#FEF3C7', tagColor: '#92400E', seed: 'nmd-fence' },
]

export default function BeforeAfterSection() {
  const [afterState, setAfterState] = useState<boolean[]>(ITEMS.map(() => false))

  const toggle = (i: number, value: boolean) => {
    setAfterState((prev) => {
      const next = [...prev]
      next[i] = value
      return next
    })
  }

  return (
    <section className="bg-[#F8FAF9] px-4 py-24 sm:px-[65px]">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-teal-700">Gallery</p>
          <h2 className="mb-3.5 max-w-[600px] text-[40px] font-bold leading-[1.1] tracking-[-0.025em] text-gray-900">
            The Proof Is in the Photos.
          </h2>
          <p className="max-w-[480px] text-base leading-relaxed text-gray-500">
            Real jobs. Real results. Toggle between before and after on any card.
          </p>
        </div>

        <div className="grid-gallery grid grid-cols-2 gap-6">
          {ITEMS.map((item, i) => {
            const showAfter = afterState[i]
            const imgUrl = `https://picsum.photos/seed/${item.seed}/900/600`
            return (
              <div key={item.title} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="relative h-[280px] overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={`${showAfter ? 'After' : 'Before'} — ${item.title}`}
                    className="h-full w-full object-cover"
                    style={
                      showAfter
                        ? { filter: 'brightness(1.08) saturate(1.12)' }
                        : { filter: 'brightness(0.7) saturate(0.4) sepia(0.25)' }
                    }
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: showAfter
                        ? 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 55%)'
                        : 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)',
                    }}
                  />
                  <div className="absolute bottom-3.5 right-3.5 flex gap-0.5 rounded-full bg-black/65 p-[3px]">
                    <button
                      onClick={() => toggle(i, false)}
                      className={
                        !showAfter
                          ? 'rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900'
                          : 'rounded-full px-3 py-1.5 text-xs font-normal text-white/70'
                      }
                    >
                      Before
                    </button>
                    <button
                      onClick={() => toggle(i, true)}
                      className={
                        showAfter
                          ? 'rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900'
                          : 'rounded-full px-3 py-1.5 text-xs font-normal text-white/70'
                      }
                    >
                      After
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                    <div className="mt-0.5 text-xs text-gray-500">{item.location}</div>
                  </div>
                  <span
                    className="rounded-md px-2 py-1 text-[11px] font-semibold"
                    style={{ background: item.tagBg, color: item.tagColor }}
                  >
                    {item.tag}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}