'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type Item = {
  title: string
  location: string
  tag: string
  tagBg: string
  tagColor: string
  imageKey: string
  altBefore: string
  altAfter: string
}

const ITEMS: Item[] = [
  {
    title: 'Driveway Cleaning',
    location: 'Winter Park, FL',
    tag: 'Residential',
    tagBg: '#F0FDF9',
    tagColor: '#0F766E',
    imageKey: 'gallery.driveway_image_url',
    altBefore: 'Before: green algae and dirt staining a concrete driveway, Winter Park FL',
    altAfter: 'After: the same concrete driveway cleaned back to bare concrete, Winter Park FL',
  },
  {
    title: 'Roof Soft Wash',
    location: 'Orlando, FL',
    tag: 'Specialty',
    tagBg: '#F0FDF9',
    tagColor: '#0F766E',
    imageKey: 'gallery.roof_image_url',
    altBefore: 'Before: black streaking across asphalt roof shingles, Orlando FL',
    altAfter: 'After: the same roof shingles soft washed clean of streaking, Orlando FL',
  },
  {
    title: 'Commercial Parking Lot',
    location: 'Kissimmee, FL',
    tag: 'Commercial',
    tagBg: '#EFF6FF',
    tagColor: '#1D4ED8',
    imageKey: 'gallery.parking_lot_image_url',
    altBefore: 'Before: oil stains and tire marks on a commercial parking lot, Kissimmee FL',
    altAfter: 'After: the same parking lot pressure washed with markings visible again, Kissimmee FL',
  },
  {
    title: 'Fence Restoration',
    location: 'Melbourne, FL',
    tag: 'Specialty',
    tagBg: '#FEF3C7',
    tagColor: '#92400E',
    imageKey: 'gallery.fence_image_url',
    altBefore: 'Before: a wooden fence grayed with mildew and weathering, Melbourne FL',
    altAfter: 'After: the same wooden fence restored to clean grain, Melbourne FL',
  },
]

export default function BeforeAfterSection() {
  const [afterState, setAfterState] = useState<Record<string, boolean>>({})
  const [siteImages, setSiteImages] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://nmd-backend.onrender.com'
    fetch(`${API}/api/site-content`)
      .then(r => r.json())
      .then(d => setSiteImages(d.content || {}))
      .catch(() => setSiteImages({}))
  }, [])

  const toggle = (key: string) => {
    setAfterState(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Cards with no uploaded photo are dropped entirely. A missing photo means
  // no card, never an empty frame or a gray placeholder.
  const visible = siteImages
    ? ITEMS.filter(item => {
        const url = siteImages[item.imageKey]
        return typeof url === 'string' && url.trim() !== ''
      })
    : []

  // Nothing to prove yet, so the section does not exist. This also keeps the
  // section out of the server-rendered HTML until real photos are uploaded.
  if (!siteImages || visible.length === 0) return null

  return (
    <section className="bg-[#F8FAF9] px-4 py-24 sm:px-[65px]">
      <style>{`
        .nmd-gallery-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }
        .nmd-gallery-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.10);
        }
        .nmd-gallery-frame img {
          transition: opacity 0.22s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .nmd-gallery-card,
          .nmd-gallery-card:hover,
          .nmd-gallery-frame img {
            transition: none;
            transform: none;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-teal-700">Gallery</p>
          <h2 className="mb-3.5 max-w-[600px] text-[40px] font-bold leading-[1.1] tracking-[-0.025em] text-gray-900">The Proof Is in the Photos.</h2>
          <p className="max-w-[480px] text-base leading-relaxed text-gray-500">Real jobs. Real results. Tap any photo to see it before we started.</p>
        </div>

        <div className="grid-gallery grid grid-cols-2 gap-6">
          {visible.map((item, i) => {
            const showAfter = !!afterState[item.imageKey]
            const src = siteImages[item.imageKey]
            return (
              <div
                key={item.imageKey}
                className="nmd-gallery-card overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.imageKey)}
                  aria-pressed={showAfter}
                  aria-label={
                    showAfter
                      ? `${item.title} in ${item.location}, showing the finished result. Tap to see it before cleaning.`
                      : `${item.title} in ${item.location}, showing the condition before cleaning. Tap to see the finished result.`
                  }
                  className="nmd-gallery-frame relative block h-[280px] w-full cursor-pointer overflow-hidden p-0"
                >
                  <Image
                    src={src}
                    alt={showAfter ? item.altAfter : item.altBefore}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
                    priority={false}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="object-cover"
                    style={
                      showAfter
                        ? { filter: 'brightness(1.08) saturate(1.12)' }
                        : { filter: 'brightness(0.7) saturate(0.4) sepia(0.25)' }
                    }
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: showAfter
                        ? 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 55%)'
                        : 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)',
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-3.5 right-3.5 flex min-h-[44px] items-center gap-2 rounded-full bg-black/65 px-4 text-xs font-semibold text-white"
                  >
                    {showAfter ? 'After' : 'Before'}
                    <span className="font-normal text-white/70">Tap to swap</span>
                  </span>
                </button>
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