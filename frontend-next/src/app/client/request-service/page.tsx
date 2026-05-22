'use client'

import { useState } from 'react'
import Link from 'next/link'

const SERVICES = [
  'House Washing','Roof Cleaning','Driveway Cleaning','Sidewalk Cleaning',
  'Patio Cleaning','Pool Deck Cleaning','Deck Cleaning','Fence Cleaning',
  'Paver Cleaning','Paver Sealing','Gutter Cleaning','Rust Stain Removal',
  'Oil Stain Removal','Mold & Mildew Removal','Soft Washing','Concrete Cleaning',
  'Storefront Cleaning','Exterior Building Washing','Parking Lot Cleaning',
  'Graffiti Removal','Fleet Washing','Commercial Roof Cleaning',
  'Heavy Equipment Cleaning','Industrial Degreasing','Post-Construction Cleanup',
  'Wood Restoration','Other',
]

export default function ServiceRequestPage() {
  const [form, setForm] = useState({
    selectedService: '', customerName: '', email: '', phone: '',
    serviceAddress: '', preferredDate: '', preferredTime: '',
    propertyType: '', surfaceDetails: '', problemDescription: '',
    estimatedSize: '', specialConcerns: '',
  })
  const [photos, setPhotos] = useState<Array<{ id: string; name: string; note: string }>>([])
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files).map(f => ({
      id: `${f.name}-${Date.now()}`, name: f.name, note: '',
    }))
    setPhotos(prev => [...next, ...prev])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photoCount: photos.length }),
      })
    } catch {}
    setLoading(false)
    setSuccess(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
    border: '1.5px solid #dde4ef', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
    background: '#f4f7fb', boxSizing: 'border-box',
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #c0dd97', padding: '3rem', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(14,17,23,0.07)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#0e1117', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Request Submitted!</h2>
          <p style={{ color: '#5a6a88', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Thanks {form.customerName}! Your service request has been received. Our team will review it and reach out to confirm pricing and scheduling.
          </p>
          <Link href="/" style={{ display: 'inline-block', padding: '0.7rem 1.5rem', borderRadius: 10, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Nav */}
      <div style={{ background: 'white', borderBottom: '1px solid #dde4ef', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 800 }}>NMD</div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0e1117' }}>NMD Pressure Washing</span>
        </Link>
        <Link href="/" style={{ fontSize: '0.82rem', color: '#5a6a88' }}>← Back to home</Link>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1f6132', background: '#eaf7ef', border: '1px solid #c0dd97', padding: '3px 10px', borderRadius: 100, marginBottom: '1rem' }}>
            Free Quote Request
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
            Tell us what needs cleaning.
          </h1>
          <p style={{ color: '#5a6a88', fontSize: '1rem', lineHeight: 1.7, fontWeight: 300 }}>
            Fill out the form below and our team will review your request and get back to you with pricing. Serving Orange County &amp; Brevard County, FL.
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Contact info card */}
          <div style={{ background: 'white', border: '1px solid #dde4ef', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Contact Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input style={inputStyle} placeholder="Your full name *" value={form.customerName} onChange={e => update('customerName', e.target.value)} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input style={inputStyle} placeholder="Email address *" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
                <input style={inputStyle} placeholder="Phone number" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
              <input style={inputStyle} placeholder="Service address *" value={form.serviceAddress} onChange={e => update('serviceAddress', e.target.value)} required />
            </div>
          </div>

          {/* Service details card */}
          <div style={{ background: 'white', border: '1px solid #dde4ef', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Service Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select style={inputStyle} value={form.selectedService} onChange={e => update('selectedService', e.target.value)} required>
                <option value="">Select a service *</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input style={inputStyle} placeholder="Property type (residential, commercial, industrial...)" value={form.propertyType} onChange={e => update('propertyType', e.target.value)} />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Surface details (concrete, vinyl siding, tile roof, pavers...)" value={form.surfaceDetails} onChange={e => update('surfaceDetails', e.target.value)} />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Problem description (algae, rust, oil, mildew, black streaks...)" value={form.problemDescription} onChange={e => update('problemDescription', e.target.value)} />
              <input style={inputStyle} placeholder="Estimated size (e.g. 2-car driveway, 2,000 sq ft roof)" value={form.estimatedSize} onChange={e => update('estimatedSize', e.target.value)} />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Special concerns or pre-existing damage" value={form.specialConcerns} onChange={e => update('specialConcerns', e.target.value)} />
            </div>
          </div>

          {/* Scheduling card */}
          <div style={{ background: 'white', border: '1px solid #dde4ef', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Scheduling Preference</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input style={inputStyle} type="date" value={form.preferredDate} onChange={e => update('preferredDate', e.target.value)} />
              <select style={inputStyle} value={form.preferredTime} onChange={e => update('preferredTime', e.target.value)}>
                <option value="">Preferred time</option>
                <option value="morning">Morning</option>
                <option value="midday">Midday</option>
                <option value="afternoon">Afternoon</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>

          {/* Photos card */}
          <div style={{ background: 'white', border: '1px solid #dde4ef', borderRadius: 12, padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#0e1117', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>Upload Photos <span style={{ fontWeight: 400, color: '#8494b0', fontSize: '0.85rem' }}>(optional)</span></h3>
            <p style={{ fontSize: '0.82rem', color: '#8494b0', marginBottom: '1rem', lineHeight: 1.5 }}>Better photos = better estimates. Include wide shots, close-up stains, and access areas.</p>
            <input type="file" multiple accept="image/*" onChange={e => addPhotos(e.target.files)} style={{ fontSize: '0.85rem', color: '#5a6a88' }} />
            {photos.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {photos.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.75rem', background: '#f4f7fb', borderRadius: 8, border: '1px solid #dde4ef', fontSize: '0.85rem', color: '#5a6a88' }}>
                    <span>📷</span> {p.name}
                    <button type="button" onClick={() => setPhotos(prev => prev.filter(x => x.id !== p.id))} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#a32d2d', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #1f6132, #124d83)',
            color: 'white', fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 4px 20px rgba(23,99,168,0.25)',
          }}>
            {loading ? 'Submitting...' : 'Submit Service Request →'}
          </button>

          <p style={{ fontSize: '0.78rem', color: '#8494b0', textAlign: 'center', lineHeight: 1.5 }}>
            By submitting you acknowledge that pricing is subject to review. Our team will contact you to confirm scope and pricing before any work begins.
          </p>
        </form>
      </div>
    </div>
  )
}
