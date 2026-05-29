'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

const SERVICES = [
  'House Washing','Roof Cleaning','Driveway Cleaning','Sidewalk Cleaning',
  'Patio Cleaning','Pool Deck Cleaning','Deck Cleaning','Fence Cleaning',
  'Paver Cleaning','Paver Sealing','Gutter Cleaning','Rust Stain Removal',
  'Oil Stain Removal','Mold & Mildew Removal','Soft Washing','Concrete Cleaning',
  'Storefront Cleaning','Exterior Building Washing','Parking Lot Cleaning',
  'Dumpster Washing','Graffiti Removal','Fleet Washing','Commercial Roof Cleaning',
  'Heavy Equipment Cleaning','Industrial Degreasing','Post-Construction Cleanup',
  'Wood Restoration','Other',
]

const DISCLAIMER = `NMD Pressure Washing Services LLC -- Service Agreement, Liability Waiver, and Booking Disclaimer

By requesting, scheduling, approving, or receiving services from NMD Pressure Washing Services LLC, the client/customer agrees to the following terms and conditions:

1. PRE-EXISTING CONDITIONS DISCLAIMER
The client acknowledges that exterior cleaning services may reveal or expose pre-existing damage, deterioration, oxidation, defects, wear, improper installation, aging materials, or structural weaknesses that existed prior to service. NMD Pressure Washing Services LLC is not responsible for damage or issues resulting from pre-existing conditions including loose/cracked/brittle siding, oxidized surfaces, loose mortar, aging roofs, cracked windows, improperly sealed doors/windows, existing rust, loose gutters, previously weakened wood, rot, mold, algae, or decay.

2. SOFT WASHING & PRESSURE WASHING RISKS
The client understands that pressure washing, soft washing, chemical treatment, and surface restoration involve inherent risks including surface discoloration, oxidation exposure, paint peeling, water spotting, wood fuzzing, concrete etching, and sealant failure. No guarantee is made that all stains, discoloration, or contaminants can be completely removed.

3. ROOF CLEANING DISCLAIMER
Roof cleaning services are performed using low-pressure soft wash methods whenever appropriate. NMD Pressure Washing Services LLC is not responsible for fragile/brittle/aging roofing materials, existing leaks, improper roof installation, or pre-existing roof deterioration.

4. WATER USAGE & UTILITIES
The client agrees to provide access to functioning water utilities. NMD Pressure Washing Services LLC is not responsible for utility interruptions, low water pressure, or property drainage limitations.

5. CHEMICAL USAGE NOTICE
Professional cleaning solutions may be used including sodium hypochlorite, surfactants, degreasers, rust removers, and specialty restoration chemicals. The client agrees to close all windows/doors, remove or protect sensitive items, and keep pets and individuals away from active work areas.

6. LANDSCAPING & PLANT DISCLAIMER
NMD Pressure Washing Services LLC is not responsible for existing unhealthy vegetation, previously stressed landscaping, seasonal sensitivity, or plant reactions to environmental conditions or chemicals.

7. STAIN REMOVAL & RESTORATION DISCLAIMER
Some stains may be permanent or only partially removable including rust, battery acid, deep oil, efflorescence, artillery fungus, hard water stains, and calcium/mineral deposits. No guarantee is made regarding complete restoration.

8. APPOINTMENT, CANCELLATION, & RESCHEDULING POLICY
Cancellation or rescheduling fees may apply if the appointment is canceled within the restricted cancellation window, access to the property is unavailable, or utilities are unavailable.

9. WEATHER DELAYS
NMD Pressure Washing Services LLC reserves the right to reschedule services due to unsafe weather or delay sealing applications due to moisture or humidity.

10. PHOTO & DOCUMENTATION AUTHORIZATION
The client authorizes NMD Pressure Washing Services LLC to document the property before, during, and after service for service records, liability protection, quality assurance, training, and marketing purposes unless otherwise requested in writing.

11. PAYMENT TERMS
Payment is due according to the agreed invoice terms. Failure to pay may result in late fees, collections, suspension of future services, or legal action.

12. LIMITATION OF LIABILITY
To the fullest extent permitted by law, NMD Pressure Washing Services LLC shall not be liable for pre-existing property damage, hidden defects, improperly maintained surfaces, manufacturer defects, or cosmetic changes caused by removal of contaminants. Any liability proven to be directly caused solely by negligence shall be limited to the amount paid for the specific service performed.

13. CLIENT RESPONSIBILITY
The client agrees to provide safe access to the property, secure pets, remove fragile or valuable items, notify the company of any concerns prior to service, and disclose known property issues before work begins.

14. ACCEPTANCE OF TERMS
By submitting this estimate request, the client confirms they have read and understood this agreement, accept all terms and conditions, and authorize NMD Pressure Washing Services LLC to perform the requested services.`

function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

export default function ServiceRequestPage() {
  const [form, setForm] = useState({
    selectedService: '', customerName: '', email: '', phone: '',
    serviceAddress: '', preferredDate: '', preferredTime: '',
    propertyType: '', surfaceDetails: '', problemDescription: '',
    estimatedSize: '', specialConcerns: '',
  })
  const [photos, setPhotos] = useState<Array<{ id: string; name: string; note: string; dataUrl: string; file: File }>>([])
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [disclaimerScrolled, setDisclaimerScrolled] = useState(false)
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const disclaimerRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos(prev => [...prev, {
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          note: '',
          dataUrl: e.target?.result as string,
          file,
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (id: string) => setPhotos(prev => prev.filter(p => p.id !== id))
  const updateNote = (id: string, note: string) =>
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, note } : p))

  const handleDisclaimerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setDisclaimerScrolled(true)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.selectedService || !form.customerName || !form.email || !form.serviceAddress) {
      setError('Please fill in all required fields.')
      return
    }
    if (photos.length === 0) {
      setError('Please upload at least one photo of the area.')
      return
    }
    setError('')
    setModalError('')
    setShowDisclaimer(true)
  }

  const submitWithAgreement = async () => {
    if (!disclaimerAgreed) return
    setLoading(true)
    setModalError('')
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      const nameParts = form.customerName.trim().split(' ')
      const firstName = nameParts[0] || form.customerName
      const lastName = nameParts.slice(1).join(' ') || ''
      const firstPhoto = photos[0] || null

      let photoDataUrl: string | null = null
      if (firstPhoto) {
        photoDataUrl = await compressImage(firstPhoto.dataUrl, 1200, 0.7)
      }

      const res = await fetch(`${API_URL}/api/requests/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: form.email,
          phone: form.phone,
          address: form.serviceAddress,
          serviceType: form.selectedService,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
          notes: [
            form.propertyType ? `Property Type: ${form.propertyType}` : '',
            form.surfaceDetails ? `Surface Details: ${form.surfaceDetails}` : '',
            form.estimatedSize ? `Estimated Size: ${form.estimatedSize}` : '',
            form.problemDescription ? `Problem: ${form.problemDescription}` : '',
            form.specialConcerns ? `Special Concerns: ${form.specialConcerns}` : '',
          ].filter(Boolean).join('\n'),
          photoDataUrl,
          photoNote: firstPhoto?.note || null,
          waiverAccepted: true,
          waiverSignature: form.customerName,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }))
        throw new Error(data.error || `Submission failed (${res.status})`)
      }

      setShowDisclaimer(false)
      setSuccess(true)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
    border: '1.5px solid #dde4ef', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
    background: '#f4f7fb', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem', fontWeight: 500, color: '#3a4660', display: 'block', marginBottom: 4,
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #c0dd97', padding: '3rem', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(14,17,23,0.07)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#0e1117', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Estimate Request Submitted!</h2>
          <p style={{ color: '#5a6a88', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Thanks {form.customerName}! Your estimate request has been received along with your photos. Our team will review and reach out to confirm pricing and scheduling. A copy of your signed agreement has been sent to {form.email}.
          </p>
          <Link href="/" style={{ display: 'inline-block', padding: '0.7rem 1.5rem', borderRadius: 10, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', fontFamily: 'DM Sans, sans-serif' }}>

      {showDisclaimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(14,17,23,0.3)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #dde4ef' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#0e1117' }}>Service Agreement & Liability Waiver</div>
              <div style={{ fontSize: '0.82rem', color: '#8494b0', marginTop: 4 }}>Please read the full agreement before submitting your estimate request.</div>
            </div>
            <div
              ref={disclaimerRef}
              onScroll={handleDisclaimerScroll}
              style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', fontSize: '0.82rem', color: '#3a4660', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
            >
              {DISCLAIMER}
            </div>
            {!disclaimerScrolled && (
              <div style={{ padding: '0.75rem 1.5rem', background: '#fff9e6', borderTop: '1px solid #f5e6a0', fontSize: '0.8rem', color: '#8a6a00', textAlign: 'center' }}>
                Please scroll to the bottom to read the full agreement.
              </div>
            )}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #dde4ef', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {modalError && (
                <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>
                  {modalError}
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: disclaimerScrolled ? 'pointer' : 'not-allowed', opacity: disclaimerScrolled ? 1 : 0.5 }}>
                <input
                  type="checkbox"
                  checked={disclaimerAgreed}
                  onChange={e => disclaimerScrolled && setDisclaimerAgreed(e.target.checked)}
                  disabled={!disclaimerScrolled}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.85rem', color: '#0e1117', lineHeight: 1.5 }}>
                  I, <strong>{form.customerName}</strong>, have read and agree to the NMD Pressure Washing Services LLC Service Agreement, Liability Waiver, and Booking Disclaimer.
                </span>
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setShowDisclaimer(false); setDisclaimerAgreed(false); setDisclaimerScrolled(false); setModalError('') }}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitWithAgreement}
                  disabled={!disclaimerAgreed || loading}
                  style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: disclaimerAgreed ? 'linear-gradient(135deg, #1f6132, #124d83)' : '#dde4ef', color: disclaimerAgreed ? 'white' : '#8494b0', fontWeight: 600, cursor: disclaimerAgreed ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {loading ? 'Submitting...' : 'I Agree & Submit Estimate Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderBottom: '1px solid #dde4ef', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#0e1117', textDecoration: 'none' }}>
          NMD Pressure Washing
        </Link>
        <Link href="/client/login" style={{ fontSize: '0.85rem', color: '#1f6132', fontWeight: 600, textDecoration: 'none' }}>
          Client Login
        </Link>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: '#0e1117', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Request a Free Estimate
          </h1>
          <p style={{ color: '#5a6a88', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Fill out the form below and our team will review your request and reach out to confirm pricing and scheduling.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#c0392b' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0e1117', marginBottom: '1rem' }}>Service Needed *</div>
            <select value={form.selectedService} onChange={e => update('selectedService', e.target.value)} style={{ ...inputStyle }} required>
              <option value="">Select a service...</option>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0e1117', marginBottom: '1rem' }}>Your Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={form.customerName} onChange={e => update('customerName', e.target.value)} placeholder="John Smith" required />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@email.com" required />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
              <div>
                <label style={labelStyle}>Service Address *</label>
                <input style={inputStyle} value={form.serviceAddress} onChange={e => update('serviceAddress', e.target.value)} placeholder="123 Main St, Atlanta, GA" required />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0e1117', marginBottom: '1rem' }}>Preferred Schedule</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Preferred Date</label>
                <input style={inputStyle} type="date" value={form.preferredDate} onChange={e => update('preferredDate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Preferred Time</label>
                <select style={inputStyle} value={form.preferredTime} onChange={e => update('preferredTime', e.target.value)}>
                  <option value="">Any time</option>
                  <option>Morning (8am - 12pm)</option>
                  <option>Afternoon (12pm - 5pm)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0e1117', marginBottom: '1rem' }}>Property Details</div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Property Type</label>
                  <select style={inputStyle} value={form.propertyType} onChange={e => update('propertyType', e.target.value)}>
                    <option value="">Select...</option>
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Industrial</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Estimated Size (sq ft)</label>
                  <input style={inputStyle} value={form.estimatedSize} onChange={e => update('estimatedSize', e.target.value)} placeholder="e.g. 2000" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Surface Details</label>
                <input style={inputStyle} value={form.surfaceDetails} onChange={e => update('surfaceDetails', e.target.value)} placeholder="e.g. Concrete driveway, brick facade, wood deck..." />
              </div>
              <div>
                <label style={labelStyle}>Problem Description</label>
                <textarea value={form.problemDescription} onChange={e => update('problemDescription', e.target.value)} placeholder="Describe what needs to be cleaned or treated..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Special Concerns</label>
                <textarea value={form.specialConcerns} onChange={e => update('specialConcerns', e.target.value)} placeholder="Pets, plants, fragile surfaces, access restrictions..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0e1117', marginBottom: '0.5rem' }}>Photos *</div>
            <p style={{ fontSize: '0.82rem', color: '#8494b0', marginBottom: '1rem' }}>Upload at least one photo of the area to be cleaned. This helps us provide an accurate estimate.</p>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addPhotos(e.target.files)} />
            <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '0.65rem 1.25rem', borderRadius: 8, border: '1.5px dashed #b0c0d8', background: '#f4f7fb', color: '#3a4660', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginBottom: '1rem' }}>
              + Add Photos
            </button>
            {photos.length > 0 && (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {photos.map(photo => (
                  <div key={photo.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: '#f4f7fb', borderRadius: 8, padding: '0.75rem' }}>
                    <img src={photo.dataUrl} alt={photo.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', color: '#3a4660', fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.name}</div>
                      <input style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.4rem 0.7rem' }} placeholder="Add a note about this photo (optional)" value={photo.note} onChange={e => updateNote(photo.id, e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removePhoto(photo.id)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, padding: '0 0.25rem' }}>x</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" style={{ width: '100%', padding: '0.9rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.01em' }}>
            Review Agreement & Submit
          </button>
        </form>
      </div>
    </div>
  )
}
