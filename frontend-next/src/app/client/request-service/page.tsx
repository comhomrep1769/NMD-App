'use client'

import { useState, useRef, useEffect } from 'react'
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

const DISCLAIMER = `NMD Pressure Washing Services LLC — Service Agreement, Liability Waiver, and Booking Disclaimer

By requesting, scheduling, approving, or receiving services from NMD Pressure Washing Services LLC, the client/customer agrees to the following terms and conditions:

1. PRE-EXISTING CONDITIONS DISCLAIMER
The client acknowledges that exterior cleaning services may reveal or expose pre-existing damage, deterioration, oxidation, defects, wear, improper installation, aging materials, or structural weaknesses that existed prior to service. NMD Pressure Washing Services LLC is not responsible for damage or issues resulting from pre-existing conditions including loose/cracked/brittle siding, oxidized surfaces, loose mortar, aging roofs, cracked windows, improperly sealed doors/windows, existing rust, loose gutters, previously weakened wood, rot, mold, algae, or decay.

2. ESTIMATES AND QUOTES DISCLAIMER
All estimates, quotes, and preliminary pricing provided by NMD Pressure Washing Services LLC — whether provided verbally, in writing, through the website, through the Guru AI assistant, or through any other means — are estimates only and are NOT guaranteed final prices. The final amount on your invoice may differ from any estimate or quote provided prior to service. Final pricing is determined after physical on-site assessment, and may be adjusted based on actual surface conditions, additional problem areas discovered during service, changes in scope of work, material or chemical costs, and any other factors not apparent at the time of estimation. By signing this agreement, the client acknowledges and accepts that the final invoice amount may be higher or lower than any previously provided estimate or quote.

3. SOFT WASHING & PRESSURE WASHING RISKS
The client understands that pressure washing, soft washing, chemical treatment, and surface restoration involve inherent risks including surface discoloration, oxidation exposure, paint peeling, water spotting, wood fuzzing, concrete etching, and sealant failure. No guarantee is made that all stains, discoloration, or contaminants can be completely removed.

4. ROOF CLEANING DISCLAIMER
Roof cleaning services are performed using low-pressure soft wash methods whenever appropriate. NMD Pressure Washing Services LLC is not responsible for fragile/brittle/aging roofing materials, existing leaks, improper roof installation, or pre-existing roof deterioration.

5. WATER USAGE & UTILITIES
The client agrees to provide access to functioning water utilities. NMD Pressure Washing Services LLC is not responsible for utility interruptions, low water pressure, or property drainage limitations.

6. CHEMICAL USAGE NOTICE
Professional cleaning solutions may be used including sodium hypochlorite, surfactants, degreasers, rust removers, and specialty restoration chemicals. The client agrees to close all windows/doors, remove or protect sensitive items, and keep pets and individuals away from active work areas.

7. LANDSCAPING & PLANT DISCLAIMER
NMD Pressure Washing Services LLC is not responsible for existing unhealthy vegetation, previously stressed landscaping, seasonal sensitivity, or plant reactions to environmental conditions or chemicals.

8. STAIN REMOVAL & RESTORATION DISCLAIMER
Some stains may be permanent or only partially removable including rust, battery acid, deep oil, efflorescence, artillery fungus, hard water stains, and calcium/mineral deposits. No guarantee is made regarding complete restoration.

9. APPOINTMENT, CANCELLATION, & RESCHEDULING POLICY
Cancellation or rescheduling fees may apply if the appointment is canceled within the restricted cancellation window, access to the property is unavailable, or utilities are unavailable.

10. WEATHER DELAYS
NMD Pressure Washing Services LLC reserves the right to reschedule services due to unsafe weather or delay sealing applications due to moisture or humidity.

11. PHOTO & DOCUMENTATION AUTHORIZATION
The client authorizes NMD Pressure Washing Services LLC to document the property before, during, and after service for service records, liability protection, quality assurance, training, and marketing purposes unless otherwise requested in writing.

12. PAYMENT TERMS
Payment is due according to the agreed invoice terms. Failure to pay may result in late fees, collections, suspension of future services, or legal action.

13. LIMITATION OF LIABILITY
To the fullest extent permitted by law, NMD Pressure Washing Services LLC shall not be liable for pre-existing property damage, hidden defects, improperly maintained surfaces, manufacturer defects, or cosmetic changes caused by removal of contaminants. Any liability proven to be directly caused solely by negligence shall be limited to the amount paid for the specific service performed.

14. CLIENT RESPONSIBILITY
The client agrees to provide safe access to the property, secure pets, remove fragile or valuable items, notify the company of any concerns prior to service, and disclose known property issues before work begins.

15. ACCEPTANCE OF TERMS
By signing this agreement, the client confirms they have read and understood this entire agreement, accept all terms and conditions including the estimates disclaimer in Section 2, and authorize NMD Pressure Washing Services LLC to perform the requested services. This signed agreement is logged and stored as a record of acceptance.`

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

// ── Signature Pad Component ────────────────────────────────────────────────
function SignaturePad({
  onSigned,
  onCleared,
}: {
  onSigned: (dataUrl: string) => void
  onCleared: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasDrawn = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#0e1117'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
    drawing.current = true
    hasDrawn.current = true
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    drawing.current = false
    if (hasDrawn.current) {
      onSigned(canvasRef.current!.toDataURL('image/png'))
    }
  }

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    hasDrawn.current = false
    onCleared()
  }

  return (
    <div>
      <div style={{ position: 'relative', border: '2px solid #dde4ef', borderRadius: 10, overflow: 'hidden', background: '#fff', touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={560}
          height={160}
          style={{ display: 'block', width: '100%', height: 160, cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        <div style={{
          position: 'absolute', bottom: 8, left: 12,
          fontSize: '0.72rem', color: '#b0bfd0', pointerEvents: 'none',
          fontStyle: 'italic',
        }}>
          Sign above
        </div>
      </div>
      <button
        type="button"
        onClick={clear}
        style={{
          marginTop: 8, padding: '0.35rem 0.85rem', borderRadius: 6,
          border: '1px solid #dde4ef', background: 'white', color: '#5a6a88',
          fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
        }}
      >
        Clear Signature
      </button>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ServiceRequestPage() {
  const [form, setForm] = useState({
    selectedService: '', customerName: '', email: '', phone: '',
    serviceAddress: '', preferredDate: '', preferredTime: '',
    propertyType: '', surfaceDetails: '', problemDescription: '',
    estimatedSize: '', specialConcerns: '',
  })
  const [photos, setPhotos] = useState<Array<{ id: string; name: string; note: string; dataUrl: string }>>([])
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [disclaimerScrolled, setDisclaimerScrolled] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
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
    setSignatureDataUrl(null)
    setDisclaimerScrolled(false)
    setShowDisclaimer(true)
  }

  const submitWithAgreement = async () => {
    if (!signatureDataUrl) {
      setModalError('Please draw your signature to continue.')
      return
    }
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
          waiverSignature: signatureDataUrl,
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
            Thanks {form.customerName}! Your estimate request has been received along with your signed agreement and photos. Our team will review and reach out to confirm pricing and scheduling.
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

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(14,17,23,0.3)' }}>

            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#0e1117' }}>
                Service Agreement & Liability Waiver
              </div>
              <div style={{ fontSize: '0.82rem', color: '#8494b0', marginTop: 4 }}>
                Read the full agreement, then draw your signature at the bottom to submit.
              </div>
            </div>

            {/* Scrollable disclaimer text */}
            <div
              ref={disclaimerRef}
              onScroll={handleDisclaimerScroll}
              style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', fontSize: '0.82rem', color: '#3a4660', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
            >
              {DISCLAIMER}
            </div>

            {/* Scroll prompt */}
            {!disclaimerScrolled && (
              <div style={{ padding: '0.6rem 1.5rem', background: '#fff9e6', borderTop: '1px solid #f5e6a0', fontSize: '0.78rem', color: '#8a6a00', textAlign: 'center' }}>
                ↓ Scroll to read the full agreement before signing
              </div>
            )}

            {/* Signature section */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #dde4ef', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {modalError && (
                <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>
                  {modalError}
                </div>
              )}

              <div style={{ opacity: disclaimerScrolled ? 1 : 0.45, pointerEvents: disclaimerScrolled ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>
                  Draw your signature below to confirm you have read and agree to all terms:
                </div>
                <div style={{ fontSize: '0.78rem', color: '#8494b0', marginBottom: 10 }}>
                  Signing as: <strong style={{ color: '#0e1117' }}>{form.customerName}</strong>
                </div>
                <SignaturePad
                  onSigned={(url) => setSignatureDataUrl(url)}
                  onCleared={() => setSignatureDataUrl(null)}
                />
                {signatureDataUrl && (
                  <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#1a7a3c', fontWeight: 500 }}>
                    ✓ Signature captured
                  </div>
                )}
              </div>

              {!disclaimerScrolled && (
                <div style={{ fontSize: '0.78rem', color: '#8494b0', textAlign: 'center' }}>
                  Please scroll through the full agreement above to enable signing.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { setShowDisclaimer(false); setSignatureDataUrl(null); setDisclaimerScrolled(false); setModalError('') }}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitWithAgreement}
                  disabled={!signatureDataUrl || loading}
                  style={{
                    flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none',
                    background: signatureDataUrl && !loading ? 'linear-gradient(135deg, #1f6132, #124d83)' : '#dde4ef',
                    color: signatureDataUrl && !loading ? 'white' : '#8494b0',
                    fontWeight: 600, cursor: signatureDataUrl && !loading ? 'pointer' : 'not-allowed',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {loading ? 'Submitting...' : 'Sign & Submit Estimate Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top nav */}
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

          {/* Service selection */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0e1117', marginBottom: '1rem' }}>Service Needed *</div>
            <select value={form.selectedService} onChange={e => update('selectedService', e.target.value)} style={inputStyle} required>
              <option value="">Select a service...</option>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Client info */}
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
                <input style={inputStyle} value={form.serviceAddress} onChange={e => update('serviceAddress', e.target.value)} placeholder="123 Main St, Orlando, FL" required />
              </div>
            </div>
          </div>

          {/* Schedule */}
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

          {/* Property details */}
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

          {/* Photos */}
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
                    <button type="button" onClick={() => removePhoto(photo.id)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, padding: '0 0.25rem' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Disclaimer notice */}
          <div style={{ background: '#fff9e6', border: '1px solid #f5e6a0', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#7a5c00', lineHeight: 1.5 }}>
            <strong>Note:</strong> By submitting this form you will be asked to read our full Service Agreement & Liability Waiver and draw your physical signature. Estimates provided are not guaranteed final prices — the final invoice amount may differ based on actual site conditions.
          </div>

          <button type="submit" style={{ width: '100%', padding: '0.9rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.01em' }}>
            Review Agreement & Submit
          </button>
        </form>
      </div>
    </div>
  )
}