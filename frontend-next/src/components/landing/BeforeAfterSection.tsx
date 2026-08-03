'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type GalleryItem = {
  id: string
  title: string
  serviceCategory: string
  city: string
  state: string
  description: string | null
  jobDate: string | null
  beforeImage: string
  afterImage: string
}

const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  Residential: { bg: '#F0FDF9', color: '#0F766E' },
  Commercial: { bg: '#EFF6FF', color: '#1D4ED8' },
  Industrial: { bg: '#F5F3FF', color: '#6D28D9' },
  Specialty: { bg: '#FEF3C7', color: '#92400E' },
  Seasonal: { bg: '#F0FDF9', color: '#059669' },
}

const INITIAL_COUNT = 4

export default function BeforeAfterSection() {
  const [items, setItems] = useState<GalleryItem[] | null>(null)
  const [afterState, setAfterState] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://nmd-backend.onrender.com'
    fetch(`${API}/api/gallery`)
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setItems([]))
  }, [])

  const toggle = (id: string) => setAfterState(prev => ({ ...prev, [id]: !prev[id] }))

  // Nothing published yet means no section at all. An empty gallery is worse
  // than a shorter page, and a fabricated one is worse than both.
  if (!items || items.length === 0) return null

  const visible = expanded ? items : items.slice(0, INITIAL_COUNT)
  const hasMore = items.length > INITIAL_COUNT

  return (
    <section className="bg-[#F8FAF9] px-4 py-24 sm:px-[65px]">
      <style>{`
        .nmd-gallery-card { transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; }
        .nmd-gallery-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,0.10); }
        .nmd-gallery-frame img { transition: opacity 0.18s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .nmd-gallery-card, .nmd-gallery-card:hover, .nmd-gallery-frame img {
            transition: none; transform: none;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12">
          <h2 className="mb-3.5 max-w-[600px] text-[40px] font-bold leading-[1.1] tracking-[-0.025em] text-gray-900">The Proof Is in the Photos.</h2>
          <p className="max-w-[480px] text-base leading-relaxed text-gray-500">Real jobs, photographed before we started and after we finished. Tap any photo to switch.</p>
        </div>

        <div className="grid-gallery grid grid-cols-2 gap-6">
          {visible.map((item, i) => {
            const showAfter = !!afterState[item.id]
            const src = showAfter ? item.afterImage : item.beforeImage
            const tag = CATEGORY_STYLES[item.serviceCategory] || CATEGORY_STYLES.Residential
            const place = `${item.city}, ${item.state}`
            const alt = showAfter
              ? `After: ${item.title.toLowerCase()} completed in ${place}`
              : `Before: ${item.title.toLowerCase()} showing the surface in ${place} prior to cleaning`
            return (
              <div key={item.id} className="nmd-gallery-card overflow-hidden rounded-xl border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={showAfter}
                  aria-label={
                    showAfter
                      ? `${item.title} in ${place}, showing the finished result. Activate to see the before photo.`
                      : `${item.title} in ${place}, showing the condition before cleaning. Activate to see the after photo.`
                  }
                  className="nmd-gallery-frame relative block h-[280px] w-full cursor-pointer overflow-hidden p-0"
                >
                  <Image
                    key={src}
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
                    priority={false}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="object-cover"
                    unoptimized
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.34) 0%, transparent 55%)' }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-3.5 right-3.5 flex min-h-[44px] items-center gap-2 rounded-full bg-black/65 px-4 text-xs font-semibold text-white"
                  >
                    {showAfter ? 'After' : 'Before'}
                    <span className="font-normal text-white/70">Tap to swap</span>
                  </span>
                </button>
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {place}
                      {item.jobDate ? ` · ${new Date(item.jobDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}
                    </div>
                    {item.description && (
                      <div className="mt-1.5 text-xs leading-relaxed text-gray-500">{item.description}</div>
                    )}
                  </div>
                  <span className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: tag.bg, color: tag.color }}>
                    {item.serviceCategory}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {hasMore && (
          <div className="mt-10">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="rounded-[10px] border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:border-teal-700 hover:text-teal-700"
              style={{ transition: 'border-color 0.15s ease-out, color 0.15s ease-out' }}
            >
              {expanded ? 'Show fewer jobs' : `See ${items.length - INITIAL_COUNT} more jobs`}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}