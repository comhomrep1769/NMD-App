'use client'

import { useState } from 'react'

const BEFORE_AFTER_ITEMS = [
  {
    id: 1,
    label: 'Driveway Cleaning',
    location: 'Orlando, FL',
    before: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
  },
  {
    id: 2,
    label: 'House Washing',
    location: 'Melbourne, FL',
    before: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80',
  },
  {
    id: 3,
    label: 'Roof Cleaning',
    location: 'Kissimmee, FL',
    before: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
  },
  {
    id: 4,
    label: 'Patio Cleaning',
    location: 'Cocoa, FL',
    before: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',
  },
]

function BeforeAfterCard({ item }: { item: typeof BEFORE_AFTER_ITEMS[0] }) {
  const [showAfter, setShowAfter] = useState(false)

  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      boxShadow: '0 4px 24px rgba(14,17,23,0.06)',
    }}>
      {/* Image container */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setShowAfter(!showAfter)}>
        {/* Before image */}
        <img
          src={item.before}
          alt={`Before ${item.label}`}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: showAfter ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
        />
        {/* After image */}
        <img
          src={item.after}
          alt={`After ${item.label}`}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: showAfter ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: showAfter ? '#1f6132' : '#8494b0',
          color: 'white', fontSize: '0.7rem', fontWeight: 700,
          padding: '3px 10px', borderRadius: 20,
          letterSpacing: '0.05em', textTransform: 'uppercase',
          transition: 'background 0.3s',
        }}>
          {showAfter ? 'After' : 'Before'}
        </div>

        {/* Tap hint */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          background: 'rgba(0,0,0,0.55)', color: 'white',
          fontSize: '0.72rem', fontWeight: 500,
          padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(4px)',
        }}>
          Tap to {showAfter ? 'see before' : 'see after'}
        </div>
      </div>

      {/* Toggle bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
        {['Before', 'After'].map((label) => (
          <button
            key={label}
            onClick={() => setShowAfter(label === 'After')}
            style={{
              flex: 1, padding: '0.6rem',
              border: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.82rem', fontWeight: 600,
              background: (label === 'After') === showAfter
                ? 'linear-gradient(135deg, #1f6132, #124d83)'
                : 'transparent',
              color: (label === 'After') === showAfter ? 'white' : 'var(--color-text-3)',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Info */}
      <div style={{ padding: '0.9rem 1rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-1)' }}>{item.label}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-3)', marginTop: 2 }}>📍 {item.location}</div>
      </div>
    </div>
  )
}

export default function BeforeAfterSection() {
  return (
    <section className="nmd-section" style={{ background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p className="nmd-section-eyebrow">Results speak for themselves</p>
          <h2 className="nmd-section-title">Before & After</h2>
          <p className="nmd-section-sub" style={{ maxWidth: 520, margin: '0.75rem auto 0' }}>
            Real results from real jobs. Tap any photo to see the transformation.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.5rem',
        }}>
          {BEFORE_AFTER_ITEMS.map(item => (
            <BeforeAfterCard key={item.id} item={item} />
          ))}
        </div>

        {/* Placeholder notice */}
        <div style={{
          marginTop: '2rem', textAlign: 'center',
          padding: '0.75rem 1.25rem',
          background: 'var(--color-surface)',
          border: '1px dashed var(--color-border)',
          borderRadius: 10,
          fontSize: '0.8rem', color: 'var(--color-text-3)',
          display: 'inline-block',
        }}>
          📸 Placeholder photos — real job photos coming soon
        </div>
      </div>
    </section>
  )
}