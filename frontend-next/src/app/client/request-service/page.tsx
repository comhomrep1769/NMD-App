'use client'

import { Fragment, forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { getNmdAuth } from '@/lib/authStorage'

declare global {
  interface Window {
    google: any
  }
}

const CATEGORIES: { key: string; label: string; sub: string }[] = [
  { key: 'res', label: 'Residential', sub: 'Homes & driveways' },
  { key: 'com', label: 'Commercial', sub: 'Businesses & lots' },
  { key: 'ind', label: 'Industrial', sub: 'Facilities & equipment' },
  { key: 'spe', label: 'Specialty & Restoration', sub: 'Stains, sealing, HOA' },
  { key: 'rec', label: 'Recurring Plan', sub: 'Save 20% every visit' },
  { key: 'sea', label: 'Seasonal Package', sub: 'Pre-sale, post-storm' },
]

const CATEGORY_SERVICES: Record<string, string[]> = {
  res: ['House Washing', 'Roof Cleaning', 'Driveway Cleaning', 'Sidewalk Cleaning', 'Patio Cleaning', 'Pool Deck Cleaning', 'Deck Cleaning', 'Fence Cleaning', 'Paver Cleaning', 'Gutter Cleaning', 'Soft Washing', 'Other'],
  com: ['Storefront Cleaning', 'Exterior Building Washing', 'Parking Lot Cleaning', 'Dumpster Washing', 'Graffiti Removal', 'Fleet Washing', 'Commercial Roof Cleaning', 'Concrete Cleaning', 'Other'],
  ind: ['Heavy Equipment Cleaning', 'Industrial Degreasing', 'Post-Construction Cleanup', 'Concrete Cleaning', 'Other'],
  spe: ['Rust Stain Removal', 'Oil Stain Removal', 'Mold & Mildew Removal', 'Paver Sealing', 'Wood Restoration', 'Other'],
  rec: ['House Washing', 'Roof Cleaning', 'Driveway Cleaning', 'Gutter Cleaning', 'Soft Washing', 'Paver Cleaning', 'Fence Cleaning', 'Concrete Cleaning', 'Other'],
  sea: ['House Washing', 'Roof Cleaning', 'Driveway Cleaning', 'Sidewalk Cleaning', 'Gutter Cleaning', 'Soft Washing', 'Post-Construction Cleanup', 'Other'],
}

const STEP_META = [
  { n: 0, label: 'Service' },
  { n: 1, label: 'Contact' },
  { n: 2, label: 'Photos' },
  { n: 3, label: 'Signature' },
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

function CategoryIcon({ k }: { k: string }) {
  if (k === 'res') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V21H15V16H9V21H3V12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  if (k === 'com') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V7" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  if (k === 'ind') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 6V4C7 3 7.9 2 9 2H15C16.1 2 17 3 17 4V6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 12H17M7 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (k === 'spe') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  }
  if (k === 'rec') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3V5M12 19V21M3 12H5M19 12H21M5.6 5.6L7 7M17 17L18.4 18.4M18.4 5.6L17 7M7 17L5.6 18.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const SignaturePad = forwardRef(function SignaturePad(
  { onSigned, onCleared }: { onSigned: (dataUrl: string) => void; onCleared: () => void },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasDrawn = useRef(false)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FAFFFE'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1C1C1E'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(x, y)
    drawing.current = true
    hasDrawn.current = true
    setSigned(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y); ctx.stroke()
  }

  const stopDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    drawing.current = false
    if (hasDrawn.current) onSigned(canvasRef.current!.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FAFFFE'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    hasDrawn.current = false
    setSigned(false)
    onCleared()
  }

  useImperativeHandle(ref, () => ({ clear }))

  return (
    <div style={{ position: 'relative', border: '1.5px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: '#FAFFFE' }}>
      <canvas ref={canvasRef} width={680} height={120}
        style={{ display: 'block', width: '100%', height: 120, cursor: 'crosshair', touchAction: 'none' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      {!signed && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: 13, color: '#D1D5DB', letterSpacing: '0.04em' }}>Sign here with mouse or touch</span>
        </div>
      )}
    </div>
  )
})

export default function ServiceRequestPage() {
  const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [clientName, setClientName] = useState('')

  const [step, setStep] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [stepError, setStepError] = useState('')
  const [attempted, setAttempted] = useState<Record<number, boolean>>({})

  const [form, setForm] = useState({
    selectedService: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    serviceAddress: '',
    preferredDate: '',
    preferredTime: '',
    propertyType: '',
    surfaceDetails: '',
    problemDescription: '',
    estimatedSize: '',
    specialConcerns: '',
  })

  useEffect(() => {
    const auth = getNmdAuth()
    if (auth?.token && auth?.user?.role === 'client') {
      setIsLoggedIn(true)
      const displayName = auth.user?.displayName || ''
      setClientName(displayName)
      const parts = displayName.trim().split(' ')
      const first = parts[0] || ''
      const last = parts.slice(1).join(' ') || ''
      setForm(prev => ({
        ...prev,
        firstName: first,
        lastName: last,
        email: auth.user?.email || '',
        phone: (auth.user as any)?.phone || prev.phone,
      }))
    }
  }, [])

  const [smsConsent, setSmsConsent] = useState(false)
  const [photos, setPhotos] = useState<Array<{ id: string; name: string; note: string; dataUrl: string }>>([])
  const [agreed, setAgreed] = useState(false)
  const [disclaimerScrolled, setDisclaimerScrolled] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const disclaimerRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const sigPadRef = useRef<{ clear: () => void }>(null)

  const [placesStatus, setPlacesStatus] = useState('starting')
  const addressDivRef = useRef<HTMLDivElement>(null)
  const placeElementRef = useRef<any>(null)

  useEffect(() => {
    if (!GOOGLE_KEY) { setPlacesStatus('failed'); return }
    let cancelled = false

    function waitForPlaces(attemptsLeft: number) {
      if (cancelled) return
      if (window.google?.maps?.places?.PlaceAutocompleteElement) { setPlacesStatus('script-loaded'); return }
      if (attemptsLeft <= 0) { setPlacesStatus('failed'); return }
      setTimeout(() => waitForPlaces(attemptsLeft - 1), 100)
    }

    if (window.google?.maps?.places?.PlaceAutocompleteElement) {
      setPlacesStatus('script-loaded')
    } else {
      if (!document.getElementById('google-maps-js')) {
        const script = document.createElement('script')
        script.id = 'google-maps-js'
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&loading=async&v=beta`
        script.async = true
        document.head.appendChild(script)
      }
      waitForPlaces(80)
    }
    return () => { cancelled = true }
  }, [GOOGLE_KEY])

  useEffect(() => {
    if (placesStatus !== 'script-loaded') return
    if (placeElementRef.current) return

    let cancelled = false
    function tryAttach(attemptsLeft: number) {
      if (cancelled) return
      if (!addressDivRef.current) {
        if (attemptsLeft <= 0) { setPlacesStatus('failed'); return }
        setTimeout(() => tryAttach(attemptsLeft - 1), 100)
        return
      }
      try {
        const google = window.google
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
          includedRegionCodes: ['us'],
        })
        placeAutocomplete.style.width = '100%'
        addressDivRef.current.appendChild(placeAutocomplete)
        placeElementRef.current = placeAutocomplete

        placeAutocomplete.addEventListener('gmp-select', async (event: any) => {
          const prediction = event.placePrediction
          if (!prediction) return
          const place = prediction.toPlace()
          await place.fetchFields({ fields: ['formattedAddress'] })
          const address = place.formattedAddress || ''
          setForm(prev => ({ ...prev, serviceAddress: address }))
        })

        setPlacesStatus('widget-attached')
      } catch (err) {
        console.error('Places widget attach error:', err)
        setPlacesStatus('failed')
      }
    }
    tryAttach(30)
    return () => { cancelled = true }
  }, [placesStatus])

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos(prev => [...prev, { id: `${file.name}-${Date.now()}`, name: file.name, note: '', dataUrl: e.target?.result as string }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (id: string) => setPhotos(prev => prev.filter(p => p.id !== id))
  const updateNote = (id: string, note: string) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, note } : p))

  const handleDisclaimerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setDisclaimerScrolled(true)
  }

  const goNext = () => {
    setStepError('')
    if (step === 0) {
      if (!selectedCategory || !form.selectedService) {
        setAttempted(prev => ({ ...prev, 0: true }))
        setStepError('Please select a category and a specific service.')
        return
      }
    }
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email || !form.serviceAddress) {
        setAttempted(prev => ({ ...prev, 1: true }))
        setStepError('Please fill in all required fields.')
        return
      }
    }
    if (step === 2) {
      if (photos.length === 0) {
        setAttempted(prev => ({ ...prev, 2: true }))
        setStepError('Please upload at least one photo of the area.')
        return
      }
    }
    setStep(s => Math.min(s + 1, 3))
  }

  const goBack = () => { setStepError(''); setStep(s => Math.max(s - 1, 0)) }

  const clearSignature = () => { sigPadRef.current?.clear(); setSignatureDataUrl(null) }

  const canSubmit = agreed && disclaimerScrolled && !!signatureDataUrl

  const handleFinalSubmit = async () => {
    if (!canSubmit) return
    setLoading(true); setSubmitError('')
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      const firstPhoto = photos[0] || null
      let photoDataUrl: string | null = null
      if (firstPhoto) photoDataUrl = await compressImage(firstPhoto.dataUrl, 1200, 0.7)

      const categoryLabel = CATEGORIES.find(c => c.key === selectedCategory)?.label || ''

      const res = await fetch(`${API_URL}/api/requests/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(), lastName: form.lastName.trim(),
          email: form.email, phone: form.phone, address: form.serviceAddress,
          serviceType: form.selectedService, preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
          notes: [
            categoryLabel ? `Category: ${categoryLabel}` : '',
            form.propertyType ? `Property Type: ${form.propertyType}` : '',
            form.surfaceDetails ? `Surface Details: ${form.surfaceDetails}` : '',
            form.estimatedSize ? `Estimated Size: ${form.estimatedSize}` : '',
            form.problemDescription ? `Problem: ${form.problemDescription}` : '',
            form.specialConcerns ? `Special Concerns: ${form.specialConcerns}` : '',
          ].filter(Boolean).join('\n'),
          photoDataUrl, photoNote: firstPhoto?.note || null,
          waiverAccepted: true, waiverSignature: signatureDataUrl,
          client_phone: form.phone, sms_consent: smsConsent,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }))
        throw new Error(data.error || `Submission failed (${res.status})`)
      }
      setSuccess(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    }
    setLoading(false)
  }

  const fieldClass = 'w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none'
  const readonlyStyle = { background: '#F3F4F6', color: '#6B7280', cursor: 'default' } as const
  const errorFieldStyle = { borderColor: '#EF4444', background: '#FEF2F2' } as const
  const labelClass = 'block text-[13px] font-semibold text-[#374151] mb-[6px]'
  const backBtnClass = 'bg-transparent border border-[#E5E7EB] !text-[#374151] text-[14px] font-medium px-[22px] py-[11px] rounded-[8px]'
  const continueBtnClass = 'bg-[#0F766E] !text-white text-[15px] font-semibold px-[28px] py-[12px] rounded-[8px] tracking-[-0.01em]'

  if (success) {
    return (
      <div className="min-h-[100vh] flex items-center justify-center bg-[#F8FAF9] px-[24px]">
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[64px_32px] max-w-[460px] w-full text-center">
          <div className="w-[64px] h-[64px] bg-[#F0FDF9] rounded-full flex items-center justify-center mx-auto mb-[24px]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14L11 19L22 9" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-[#111827] mb-[12px] tracking-[-0.02em]">Request Submitted!</h2>
          <p className="text-[16px] text-[#6B7280] leading-[1.6] mb-[32px] max-w-[400px] mx-auto">
            We&apos;ve received your request along with your signed agreement and photos. We&apos;ll send a quote to your email within 2 hours.
          </p>
          <div className="flex gap-[12px] justify-center flex-wrap">
            <Link href={isLoggedIn ? '/clientdashboard' : '/client/login'} className="inline-flex items-center bg-[#0F766E] !text-white text-[14px] font-semibold px-[22px] py-[12px] rounded-[8px]">
              {isLoggedIn ? 'Go to My Portal' : 'View in Client Portal'}
            </Link>
            <Link href="/" className="inline-flex items-center border border-[#E5E7EB] !text-[#374151] text-[14px] font-medium px-[22px] py-[12px] rounded-[8px]">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F8FAF9]">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] h-[68px]">
        <div className="rs-container max-w-[1440px] mx-auto px-[65px] h-full flex items-center">
          <Link href="/" className="flex flex-col leading-none shrink-0">
            <span className="text-[16px] font-bold tracking-[-0.025em] text-[#111827]">NMD Pressure Washing</span>
            <span className="text-[9px] font-bold tracking-[0.14em] text-[#0F766E] uppercase mt-[2px]">SERVICES LLC</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-[16px]">
            {isLoggedIn ? (
              <>
                <span className="text-[13px] text-[#6B7280]">Hi, {clientName.split(' ')[0]}</span>
                <Link href="/clientdashboard" className="text-[13px] font-semibold !text-[#0F766E] px-[10px] py-[6px] rounded-[6px]" style={{ border: '1px solid rgba(15,118,110,0.25)', background: 'rgba(15,118,110,0.05)' }}>
                  My Portal
                </Link>
              </>
            ) : (
              <Link href="/client/login" className="text-[13px] font-semibold !text-[#0F766E]">Client Login</Link>
            )}
            <Link href="/" className="text-[13px] text-[#6B7280]">&larr; Back to site</Link>
          </div>
        </div>
      </nav>

      <div className="rs-page mt-[68px] min-h-[calc(100vh-68px)] px-[40px] pt-[48px] pb-[80px]">
        <div className="max-w-[760px] mx-auto">
          <div className="mb-[40px]">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#0F766E] mb-[8px]">Request Service</p>
            <h1 className="text-[32px] font-bold tracking-[-0.025em] text-[#111827] mb-[8px] leading-[1.2]">Get a Free Quote</h1>
            <p className="text-[15px] text-[#6B7280]">Complete the form below and we&apos;ll respond within 2 hours during business hours.</p>
          </div>

          {/* STEP INDICATOR */}
          <div className="flex items-center mb-[40px]">
            {STEP_META.map((s, i) => (
              <Fragment key={s.n}>
                <div className="flex flex-col items-center gap-[6px]" style={{ flex: '0 0 auto', color: step === s.n ? '#0F766E' : step > s.n ? '#059669' : '#9CA3AF' }}>
                  <div
                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px] font-bold"
                    style={{
                      background: step === s.n ? '#0F766E' : step > s.n ? '#059669' : '#F3F4F6',
                      color: (step === s.n || step > s.n) ? '#fff' : '#9CA3AF',
                      border: step === s.n ? '2px solid #0F766E' : step > s.n ? '2px solid #059669' : '2px solid #E5E7EB',
                    }}
                  >
                    {s.n + 1}
                  </div>
                  <span className="text-[12px] font-semibold whitespace-nowrap">{s.label}</span>
                </div>
                {i < STEP_META.length - 1 && (
                  <div className="flex-1 h-[2px] mx-[8px] -mt-[20px]" style={{ background: step > s.n ? '#059669' : '#E5E7EB' }} />
                )}
              </Fragment>
            ))}
          </div>

          {/* STEP 0: SERVICE */}
          {step === 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[32px]">
              <h2 className="text-[20px] font-bold text-[#111827] mb-[6px]">What type of service do you need?</h2>
              <p className="text-[14px] text-[#6B7280] mb-[28px]">Select a category, then choose the specific service.</p>

              <div
                className="rs-cards grid grid-cols-3 gap-[12px] mb-[24px]"
                style={attempted[0] && !selectedCategory ? { outline: '2px solid #EF4444', outlineOffset: '4px', borderRadius: 12 } : undefined}
              >
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => { setSelectedCategory(cat.key); update('selectedService', '') }}
                    className="flex flex-col items-center text-center rounded-[10px] p-[20px_12px] cursor-pointer outline-none"
                    style={{
                      border: selectedCategory === cat.key ? '2px solid #0F766E' : '2px solid #E5E7EB',
                      background: selectedCategory === cat.key ? '#F0FDF9' : '#fff',
                      color: selectedCategory === cat.key ? '#0F766E' : '#374151',
                    }}
                  >
                    <span className="mb-[8px]"><CategoryIcon k={cat.key} /></span>
                    <span className="text-[14px] font-semibold leading-[1.3]">{cat.label}</span>
                    <span className="text-[11px] opacity-60 mt-[3px]">{cat.sub}</span>
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div className="mb-[24px]">
                  <label className={labelClass}>Specific Service</label>
                  <select
                    value={form.selectedService}
                    onChange={e => update('selectedService', e.target.value)}
                    className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] bg-white outline-none"
                    style={attempted[0] && !form.selectedService ? errorFieldStyle : undefined}
                  >
                    <option value="">Select a service...</option>
                    {CATEGORY_SERVICES[selectedCategory].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div className="mb-[24px]">
                <label className={labelClass}>
                  Describe what you need cleaned <span className="text-[#9CA3AF] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.problemDescription}
                  onChange={e => update('problemDescription', e.target.value)}
                  placeholder="e.g. 2-car driveway with oil stains, front walkway, and wooden deck..."
                  className="w-full p-[12px] border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] resize-y outline-none leading-[1.5]"
                />
              </div>

              {stepError && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-[14px] py-[10px] mb-[16px] text-[13px] text-[#B91C1C]">{stepError}</div>
              )}

              <div className="flex justify-end">
                <button type="button" onClick={goNext} className={continueBtnClass}>Continue &rarr;</button>
              </div>
            </div>
          )}

          {/* STEP 1: CONTACT */}
          {step === 1 && (
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[32px]">
              <div className="flex items-center justify-between mb-[6px]">
                <h2 className="text-[20px] font-bold text-[#111827] m-0">Your contact information</h2>
                {isLoggedIn && (
                  <span className="text-[11px] font-semibold !text-[#0F766E] px-[8px] py-[3px] rounded-[6px]" style={{ background: 'rgba(15,118,110,0.1)' }}>
                    &#10003; Auto-filled from your account
                  </span>
                )}
              </div>
              <p className="text-[14px] text-[#6B7280] mb-[28px]">We&apos;ll use this to prepare your quote and schedule the job.</p>

              <div className="rs-form-grid grid grid-cols-2 gap-[18px] mb-[18px]">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input type="text" value={form.firstName} readOnly={isLoggedIn} onChange={e => update('firstName', e.target.value)}
                    placeholder="Marcus" className={fieldClass}
                    style={attempted[1] && !form.firstName ? errorFieldStyle : (isLoggedIn ? readonlyStyle : undefined)} />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input type="text" value={form.lastName} readOnly={isLoggedIn} onChange={e => update('lastName', e.target.value)}
                    placeholder="Johnson" className={fieldClass}
                    style={attempted[1] && !form.lastName ? errorFieldStyle : (isLoggedIn ? readonlyStyle : undefined)} />
                </div>
              </div>

              <div className="rs-form-grid grid grid-cols-2 gap-[18px] mb-[18px]">
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" value={form.email} readOnly={isLoggedIn} onChange={e => update('email', e.target.value)}
                    placeholder="marcus@example.com" className={fieldClass}
                    style={attempted[1] && !form.email ? errorFieldStyle : (isLoggedIn ? readonlyStyle : undefined)} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input type="tel" value={form.phone} readOnly={isLoggedIn && !!form.phone} onChange={e => update('phone', e.target.value)}
                    placeholder="(407) 555-0100" className={fieldClass} style={isLoggedIn && form.phone ? readonlyStyle : undefined} />
                </div>
              </div>

              <div className="mb-[18px]">
                <label className={labelClass}>Service Address</label>
                <div ref={addressDivRef} className="w-full" style={{ colorScheme: 'light' }}>
                  {placesStatus !== 'widget-attached' && (
                    <input
                      value={form.serviceAddress}
                      onChange={e => update('serviceAddress', e.target.value)}
                      placeholder={placesStatus === 'failed' ? '123 Oak Lane, Winter Park, FL 32789' : 'Loading address search...'}
                      className={fieldClass}
                      style={attempted[1] && !form.serviceAddress ? errorFieldStyle : undefined}
                    />
                  )}
                </div>
              </div>

              <div className="mb-[18px] rounded-[8px] p-[14px_16px]" style={{ background: 'rgba(15,118,110,0.05)', border: '1px solid rgba(15,118,110,0.2)' }}>
                <label className="flex items-start gap-[10px] cursor-pointer">
                  <input type="checkbox" checked={smsConsent} onChange={e => setSmsConsent(e.target.checked)}
                    className="mt-[2px] w-[16px] h-[16px] shrink-0 cursor-pointer" style={{ accentColor: '#0F766E' }} />
                  <span className="text-[13px] leading-[1.55]" style={{ color: '#1B4942' }}>
                    I agree to receive SMS text message updates from NMD Pressure Washing Services LLC regarding my service appointment. Message &amp; data rates may apply. Reply STOP to opt out.
                  </span>
                </label>
              </div>

              <div className="rs-form-grid grid grid-cols-2 gap-[18px] mb-[18px]">
                <div>
                  <label className={labelClass}>Preferred Date</label>
                  <input type="date" value={form.preferredDate} onChange={e => update('preferredDate', e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Preferred Time</label>
                  <select value={form.preferredTime} onChange={e => update('preferredTime', e.target.value)}
                    className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] bg-white outline-none">
                    <option value="">Flexible</option>
                    <option>Morning (8 AM &ndash; 12 PM)</option>
                    <option>Afternoon (12 PM &ndash; 4 PM)</option>
                  </select>
                </div>
              </div>

              <p className="text-[12px] font-bold tracking-[0.1em] uppercase text-[#9CA3AF] mb-[14px]">Property Details (optional)</p>

              <div className="rs-form-grid grid grid-cols-2 gap-[18px] mb-[18px]">
                <div>
                  <label className={labelClass}>Property Type</label>
                  <select value={form.propertyType} onChange={e => update('propertyType', e.target.value)}
                    className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] bg-white outline-none">
                    <option value="">Select...</option>
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Industrial</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Estimated Size (sq ft)</label>
                  <input value={form.estimatedSize} onChange={e => update('estimatedSize', e.target.value)} placeholder="e.g. 2000" className={fieldClass} />
                </div>
              </div>

              <div className="mb-[18px]">
                <label className={labelClass}>Surface Details</label>
                <input value={form.surfaceDetails} onChange={e => update('surfaceDetails', e.target.value)}
                  placeholder="e.g. Concrete driveway, brick facade, wood deck..." className={fieldClass} />
              </div>

              <div className="mb-[28px]">
                <label className={labelClass}>
                  Additional Notes <span className="text-[#9CA3AF] font-normal">(optional)</span>
                </label>
                <textarea rows={3} value={form.specialConcerns} onChange={e => update('specialConcerns', e.target.value)}
                  placeholder="Gate code, pet on property, access instructions..."
                  className="w-full p-[12px] border border-[#E5E7EB] rounded-[8px] text-[14px] resize-y outline-none leading-[1.5]" />
              </div>

              {stepError && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-[14px] py-[10px] mb-[16px] text-[13px] text-[#B91C1C]">{stepError}</div>
              )}

              <div className="flex justify-between">
                <button type="button" onClick={goBack} className={backBtnClass}>&larr; Back</button>
                <button type="button" onClick={goNext} className={continueBtnClass}>Continue &rarr;</button>
              </div>
            </div>
          )}

          {/* STEP 2: PHOTOS */}
          {step === 2 && (
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[32px]">
              <h2 className="text-[20px] font-bold text-[#111827] mb-[6px]">Upload photos of the area</h2>
              <p className="text-[14px] text-[#6B7280] mb-[28px]">Photos help us prepare a more accurate quote. Please upload at least one photo of the surfaces you&apos;d like cleaned.</p>

              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addPhotos(e.target.files)} />

              <div className="rs-photo-grid grid grid-cols-3 gap-[16px] mb-[24px]">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-[8px] rounded-[10px] cursor-pointer min-h-[130px]"
                  style={attempted[2] && photos.length === 0
                    ? { border: '2px dashed #EF4444', background: '#FEF2F2' }
                    : { border: '2px dashed #D1FAE5', background: '#F0FDF9' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="13" stroke="#0F766E" strokeWidth="1.5" />
                    <path d="M14 9V19M9 14H19" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-[12px] font-semibold !text-[#0F766E]">Add Photo</span>
                  <span className="text-[11px] text-[#6B7280] text-center">JPG, PNG up to 10MB</span>
                </button>

                {photos.map(photo => (
                  <div key={photo.id} className="relative rounded-[10px] overflow-hidden min-h-[130px]" style={{ border: '2px dashed #E5E7EB', background: '#F8FAF9' }}>
                    <img src={photo.dataUrl} alt={photo.name} className="absolute inset-0 w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(photo.id)}
                      className="absolute top-[6px] right-[6px] w-[22px] h-[22px] rounded-full flex items-center justify-center text-[14px] leading-none"
                      style={{ background: 'rgba(17,24,39,0.65)', color: '#fff' }}>&times;</button>
                  </div>
                ))}
              </div>

              {photos.length > 0 && (
                <div className="flex flex-col gap-[10px] mb-[24px]">
                  {photos.map(photo => (
                    <div key={photo.id} className="flex items-center gap-[10px]">
                      <span className="text-[12px] text-[#6B7280] shrink-0 max-w-[160px] truncate">{photo.name}</span>
                      <input value={photo.note} onChange={e => updateNote(photo.id, e.target.value)} placeholder="Add a note about this photo (optional)"
                        className="flex-1 px-[10px] py-[7px] border border-[#E5E7EB] rounded-[6px] text-[12px] outline-none" />
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-[8px] p-[14px_16px] mb-[28px] flex gap-[10px] items-start" style={{ background: '#F8FAF9', border: '1px solid #E5E7EB' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-[1px]">
                  <circle cx="8" cy="8" r="7" stroke="#6B7280" strokeWidth="1.3" />
                  <path d="M8 5V9M8 11V11.5" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <p className="text-[13px] text-[#6B7280] leading-[1.5] m-0">At least one photo is required so we can prepare an accurate quote. The more angles you include, the faster we can respond.</p>
              </div>

              {stepError && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-[14px] py-[10px] mb-[16px] text-[13px] text-[#B91C1C]">{stepError}</div>
              )}

              <div className="flex justify-between">
                <button type="button" onClick={goBack} className={backBtnClass}>&larr; Back</button>
                <button type="button" onClick={goNext} className={continueBtnClass}>Continue &rarr;</button>
              </div>
            </div>
          )}

          {/* STEP 3: SIGNATURE */}
          {step === 3 && (
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden">
              <div className="flex items-center justify-between p-[24px_32px]" style={{ background: '#0F1A18' }}>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.14em] uppercase mb-[4px]" style={{ color: '#34D399' }}>NMD Pressure Washing Services LLC</div>
                  <div className="text-[18px] font-bold !text-white tracking-[-0.02em]">Service Agreement &amp; Authorization</div>
                </div>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 3L4 8.5V17C4 23.5 9.75 29.5 16 31.5C22.25 29.5 28 23.5 28 17V8.5L16 3Z" stroke="#34D399" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M11 17L14 20L21 13" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="p-[28px_32px]">
                <div
                  ref={disclaimerRef}
                  onScroll={handleDisclaimerScroll}
                  className="rounded-[8px] p-[16px_20px] mb-[24px] overflow-y-auto"
                  style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', height: 200, whiteSpace: 'pre-wrap', fontSize: 12, color: '#374151', lineHeight: 1.75 }}
                >
                  {DISCLAIMER}
                </div>

                {!disclaimerScrolled && (
                  <div className="text-center text-[12px] mb-[20px]" style={{ color: '#8a6a00', background: '#fff9e6', border: '1px solid #f5e6a0', borderRadius: 8, padding: '8px 12px' }}>
                    &darr; Scroll to read the full agreement before signing
                  </div>
                )}

                <div className="flex items-start gap-[10px] mb-[28px]">
                  <input type="checkbox" id="rs-agree" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="mt-[2px] w-[16px] h-[16px] shrink-0 cursor-pointer" style={{ accentColor: '#0F766E' }} />
                  <label htmlFor="rs-agree" className="text-[14px] text-[#374151] leading-[1.5] cursor-pointer">
                    I have read and agree to the Service Agreement and Authorization above. I am authorized to request service at this property.
                  </label>
                </div>

                <div className="mb-[20px]" style={{ opacity: disclaimerScrolled ? 1 : 0.45, pointerEvents: disclaimerScrolled ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                  <div className="flex items-center justify-between mb-[8px]">
                    <label className="text-[13px] font-semibold text-[#374151]">Your Signature</label>
                    <button type="button" onClick={clearSignature} className="text-[12px] underline bg-transparent border-none cursor-pointer p-0" style={{ color: '#6B7280' }}>Clear</button>
                  </div>
                  <SignaturePad ref={sigPadRef} onSigned={url => setSignatureDataUrl(url)} onCleared={() => setSignatureDataUrl(null)} />
                  <div className="flex items-center gap-[6px] mt-[8px]">
                    <div className="flex-1 h-[1px]" style={{ background: '#E5E7EB' }} />
                    <span className="text-[11px] whitespace-nowrap px-[8px]" style={{ color: '#9CA3AF' }}>Electronic signature &mdash; legally binding</span>
                    <div className="flex-1 h-[1px]" style={{ background: '#E5E7EB' }} />
                  </div>
                </div>

                {submitError && (
                  <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-[14px] py-[10px] mb-[16px] text-[13px] text-[#B91C1C]">{submitError}</div>
                )}

                <div className="flex justify-between items-center mt-[8px]">
                  <button type="button" onClick={goBack} className={backBtnClass}>&larr; Back</button>
                  <button type="button" onClick={handleFinalSubmit} disabled={!canSubmit || loading}
                    className="text-[15px] font-semibold px-[32px] py-[13px] rounded-[8px] border-none tracking-[-0.01em]"
                    style={{
                      background: canSubmit && !loading ? '#0F766E' : '#D1FAE5',
                      color: canSubmit && !loading ? '#fff' : '#0F766E',
                      cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                    }}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#111827] px-[65px] py-[32px]">
        <div className="rs-container max-w-[1440px] mx-auto flex items-center justify-between flex-wrap gap-[16px]">
          <div className="flex flex-col">
            <span className="text-[15px] font-bold !text-white tracking-[-0.02em]">NMD Pressure Washing</span>
            <span className="text-[9px] font-bold tracking-[0.14em] text-[#0F766E] uppercase mt-[2px]">SERVICES LLC</span>
          </div>
          <span className="text-[12px] !text-white/22">&copy; {new Date().getFullYear()} NMD Pressure Washing Services LLC</span>
        </div>
      </footer>
    </div>
  )
}