'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { DataTable, LoadingCard, ErrorCard, SearchInput, SectionHeader, StatusBadge, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Request = {
  id: string; firstName: string; lastName: string
  email: string; phone: string; serviceType: string
  address: string; status: string; createdAt: string
  preferredDate: string | null; preferredTime: string | null
  notes: string | null; photoNote: string | null
  waiverSignedAt: string | null; waiverAccepted: boolean | null
  hasPhoto?: boolean; hasSignature?: boolean
  photoDataUrl?: string | null; waiverSignature?: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
  border: '1px solid #E5E7EB', fontSize: '0.875rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', color: '#111827',
  background: 'white', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4,
}
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.65)',
  zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
}

declare global {
  interface Window {
    jspdf?: { jsPDF: new (options?: object) => jsPDFInstance }
  }
}

interface jsPDFInstance {
  setFont: (font: string, style?: string) => void
  setFontSize: (size: number) => void
  setTextColor: (r: number, g: number, b: number) => void
  setDrawColor: (r: number, g: number, b: number) => void
  setLineWidth: (width: number) => void
  text: (text: string | string[], x: number, y: number, options?: object) => void
  line: (x1: number, y1: number, x2: number, y2: number) => void
  rect: (x: number, y: number, w: number, h: number, style?: string) => void
  addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void
  splitTextToSize: (text: string, maxWidth: number) => string[]
  addPage: () => void
  save: (filename: string) => void
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
}

const DISCLAIMER_TEXT = `NMD Pressure Washing Services LLC - Service Agreement, Liability Waiver, and Booking Disclaimer

By requesting, scheduling, approving, or receiving services from NMD Pressure Washing Services LLC, the client/customer agrees to the following terms and conditions:

1. PRE-EXISTING CONDITIONS DISCLAIMER
The client acknowledges that exterior cleaning services may reveal or expose pre-existing damage, deterioration, oxidation, defects, wear, improper installation, aging materials, or structural weaknesses that existed prior to service. NMD Pressure Washing Services LLC is not responsible for damage or issues resulting from pre-existing conditions including loose/cracked/brittle siding, oxidized surfaces, loose mortar, aging roofs, cracked windows, improperly sealed doors/windows, existing rust, loose gutters, previously weakened wood, rot, mold, algae, or decay.

2. ESTIMATES AND QUOTES DISCLAIMER
All estimates, quotes, and preliminary pricing provided by NMD Pressure Washing Services LLC are estimates only and are NOT guaranteed final prices. The final amount on your invoice may differ from any estimate or quote provided prior to service. Final pricing is determined after physical on-site assessment, and may be adjusted based on actual surface conditions, additional problem areas discovered during service, changes in scope of work, material or chemical costs, and any other factors not apparent at the time of estimation. By signing this agreement, the client acknowledges and accepts that the final invoice amount may be higher or lower than any previously provided estimate or quote.

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

async function downloadAgreementPdf(r: {
  firstName: string; lastName: string; email: string; phone: string
  address: string; serviceType: string; createdAt: string
  waiverSignedAt: string | null; waiverSignature?: string | null
}) {
  // Load jsPDF from CDN if not already loaded
  if (!window.jspdf) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load jsPDF'))
      document.head.appendChild(script)
    })
  }

  const { jsPDF } = window.jspdf!
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 20

  const addText = (text: string, fontSize: number, bold = false, color: [number,number,number] = [17,24,39]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, contentW)
    doc.text(lines, margin, y)
    y += lines.length * (fontSize * 0.4) + 2
  }

  const checkPage = (needed = 20) => {
    if (y + needed > 270) { doc.addPage(); y = 20 }
  }

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setDrawColor(15, 118, 110)
  doc.setLineWidth(0.5)
  doc.rect(margin - 2, y - 4, contentW + 4, 18, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 118, 110)
  doc.text('NMD PRESSURE WASHING SERVICES LLC', pageW / 2, y + 4, { align: 'center' })
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Service Agreement & Liability Waiver', pageW / 2, y + 2, { align: 'center' })
  y += 12

  // ── Client Info ──────────────────────────────────────────────────────────
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  doc.rect(margin - 2, y - 2, contentW + 4, 36, 'S')

  addText('CLIENT INFORMATION', 8, true, [55, 65, 81])
  y += 1

  const infoRows = [
    [`Name:`, `${r.firstName} ${r.lastName}`.trim()],
    [`Email:`, r.email || 'N/A'],
    [`Phone:`, r.phone || 'N/A'],
    [`Service Address:`, r.address || 'N/A'],
    [`Service Requested:`, r.serviceType || 'N/A'],
    [`Submitted:`, r.createdAt ? new Date(r.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : 'N/A'],
    [`Signed At:`, r.waiverSignedAt ? new Date(r.waiverSignedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : new Date(r.createdAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })],
  ]

  for (const [label, value] of infoRows) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
    doc.text(label, margin + 2, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(17, 24, 39)
    doc.text(value, margin + 42, y)
    y += 5
  }

  y += 4

  // ── Agreement Text ───────────────────────────────────────────────────────
  checkPage(10)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 118, 110)
  doc.text('FULL AGREEMENT TEXT', margin, y)
  y += 1
  doc.setDrawColor(15, 118, 110)
  doc.setLineWidth(0.4)
  doc.line(margin, y, margin + contentW, y)
  y += 5

  // Render disclaimer paragraph by paragraph
  for (const para of DISCLAIMER_TEXT.split('\n\n')) {
    checkPage(15)
    const trimmed = para.trim()
    if (!trimmed) continue

    // Section headers (ALL CAPS lines like "1. PRE-EXISTING...")
    if (/^\d+\./.test(trimmed) || trimmed === trimmed.toUpperCase()) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(17, 24, 39)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)
    }

    const lines = doc.splitTextToSize(trimmed, contentW)
    for (const line of lines) {
      checkPage(6)
      doc.text(line, margin, y)
      y += 4
    }
    y += 2
  }

  // ── Signature ────────────────────────────────────────────────────────────
  checkPage(60)
  y += 4
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  doc.rect(margin - 2, y - 4, contentW + 4, 52, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(55, 65, 81)
  doc.text('CLIENT SIGNATURE', margin + 2, y + 2)
  y += 8

  if (r.waiverSignature && r.waiverSignature.startsWith('data:image')) {
    try {
      doc.addImage(r.waiverSignature, 'PNG', margin + 2, y, 80, 32)
      y += 36
    } catch {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text('[Signature image could not be rendered]', margin + 2, y + 8)
      y += 20
    }
  } else if (r.waiverSignature) {
    doc.setFont('helvetica', 'bolditalic')
    doc.setFontSize(16)
    doc.setTextColor(17, 24, 39)
    doc.text(r.waiverSignature, margin + 2, y + 10)
    y += 20
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('[No signature on file]', margin + 2, y + 8)
    y += 20
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  const sigDate = r.waiverSignedAt || r.createdAt
  doc.text(`Digitally signed on ${new Date(sigDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`, margin + 2, y + 2)
  y += 8
  doc.text('This signature was collected electronically as part of the NMD Service Agreement & Liability Waiver.', margin + 2, y)

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(150, 150, 150)
  doc.text('NMD Pressure Washing Services LLC | nmdpowash.com | 321-888-6586', pageW / 2, 285, { align: 'center' })
  doc.text('Clean Results. Reliable Service. Every Time.', pageW / 2, 289, { align: 'center' })

  // Save
  const filename = `NMD-Agreement-${r.firstName}-${r.lastName}-${new Date(r.createdAt).toISOString().slice(0,10)}.pdf`
  doc.save(filename)
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'requests' | 'signature-log'>('requests')
  const [quoteRequest, setQuoteRequest] = useState<Request | null>(null)
  const [quoteForm, setQuoteForm] = useState({ total: '', status: 'sent' })
  const [quoteSaving, setQuoteSaving] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const [viewPhoto, setViewPhoto] = useState<Request | null>(null)
  const [viewSignature, setViewSignature] = useState<Request | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRequests(d.requests || []); setLoading(false) })
      .catch(() => { setError('Could not load service requests.'); setLoading(false) })
  }, [])

  // ── Fetch the full record (including the heavy base64 photo/signature) on demand ──
  const fetchRequestDetail = async (id: string): Promise<Request | null> => {
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/requests/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load details')
      setRequests(p => p.map(r => r.id === id ? { ...r, ...data.request } : r))
      return data.request
    } catch {
      return null
    }
  }

  // ── While the Signature Log tab is open, make sure every signed request's image is loaded ──
  useEffect(() => {
    if (activeTab === 'signature-log') {
      const missing = requests.filter(r => r.hasSignature && r.waiverAccepted && !r.waiverSignature)
      if (missing.length > 0) {
        missing.forEach(r => fetchRequestDetail(r.id))
      }
    }
  }, [activeTab, requests])

  const filtered = requests.filter(r =>
    `${r.firstName} ${r.lastName} ${r.email} ${r.serviceType} ${r.status}`.toLowerCase().includes(search.toLowerCase())
  )

  const signedRequests = requests.filter(r => r.hasSignature && r.waiverAccepted)

  const pending = requests.filter(r => r.status === 'pending' || r.status === 'new').length

  // Check if waiverSignature is a canvas PNG (base64 image) or plain text
  const isSignatureImage = (sig: string | null | undefined) =>
    sig ? sig.startsWith('data:image') : false

  const openQuoteModal = async (r: Request) => {
    setQuoteForm({ total: '', status: 'sent' })
    setQuoteError('')
    if (r.hasPhoto && !r.photoDataUrl) {
      const full = await fetchRequestDetail(r.id)
      setQuoteRequest(full || r)
    } else {
      setQuoteRequest(r)
    }
  }

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quoteRequest) return
    setQuoteError('')
    setQuoteSaving(true)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientName: `${quoteRequest.firstName} ${quoteRequest.lastName}`.trim(),
          serviceType: quoteRequest.serviceType,
          total: parseFloat(quoteForm.total) || 0,
          status: quoteForm.status
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create quote')

      await fetch(`${API}/api/requests/${quoteRequest.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'reviewed' })
      })

      setRequests(p => p.map(r => r.id === quoteRequest.id ? { ...r, status: 'reviewed' } : r))
      setQuoteRequest(null)

      if (quoteForm.status === 'sent') {
        alert(`Quote #${data.quote.quoteNumber} created and sent to ${quoteRequest.firstName}.`)
      } else {
        alert(`Quote #${data.quote.quoteNumber} saved as draft.`)
      }
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Failed to create quote')
    }
    setQuoteSaving(false)
  }

  const handleStatusChange = async (r: Request, status: string) => {
    setStatusLoading(r.id)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/requests/${r.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update status')
      setRequests(p => p.map(x => x.id === r.id ? { ...x, status } : x))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    }
    setStatusLoading(null)
  }

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>

      {/* Photo Lightbox */}
      {viewPhoto && (
        <div
          onClick={() => setViewPhoto(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ color: 'white', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                {viewPhoto.firstName} {viewPhoto.lastName} — {viewPhoto.serviceType}
              </div>
              <button onClick={() => setViewPhoto(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            {viewPhoto.photoDataUrl ? (
              <img
                src={viewPhoto.photoDataUrl}
                alt="Client uploaded photo"
                style={{ width: '100%', borderRadius: 12, maxHeight: '70vh', objectFit: 'contain', background: '#111' }}
              />
            ) : (
              <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Loading photo…</div>
            )}
            {viewPhoto.photoNote && (
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.75rem 1rem', color: 'white', fontSize: '0.85rem' }}>
                <strong>Client note:</strong> {viewPhoto.photoNote}
              </div>
            )}
            <div style={{ color: '#9CA3AF', fontSize: '0.8rem', textAlign: 'center' }}>Click anywhere outside to close</div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {viewSignature && (
        <div style={{ ...modalOverlay, zIndex: 200 }} onClick={() => setViewSignature(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 14, width: '100%', maxWidth: 520,
            boxShadow: '0 20px 60px rgba(17,24,39,0.2)', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0F766E' }}>
              <div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'white' }}>Signed Agreement</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Service Agreement & Liability Waiver</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => downloadAgreementPdf(viewSignature)}
                  style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.18)', color: 'white', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Download PDF
                </button>
                <button onClick={() => setViewSignature(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem' }}>Close</button>
              </div>
            </div>

            {/* Client info */}
            <div style={{ padding: '1rem 1.5rem', background: '#F8FAF9', borderBottom: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{viewSignature.firstName} {viewSignature.lastName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service</div>
                <div style={{ fontWeight: 500, color: '#374151', fontSize: '0.85rem' }}>{viewSignature.serviceType}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
                <div style={{ color: '#374151', fontSize: '0.85rem' }}>{viewSignature.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signed At</div>
                <div style={{ color: '#374151', fontSize: '0.85rem' }}>
                  {viewSignature.waiverSignedAt
                    ? new Date(viewSignature.waiverSignedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                    : fmtDate(viewSignature.createdAt)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</div>
                <div style={{ color: '#374151', fontSize: '0.85rem' }}>{viewSignature.address || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agreement Status</div>
                <div style={{ color: '#059669', fontWeight: 600, fontSize: '0.85rem' }}>✓ Accepted</div>
              </div>
            </div>

            {/* Signature */}
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Client Signature
              </div>
              {!viewSignature.waiverSignature ? (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '1rem 1.25rem', background: '#F9FAFB', color: '#9CA3AF', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Loading signature…
                </div>
              ) : isSignatureImage(viewSignature.waiverSignature) ? (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '0.75rem', background: '#F9FAFB' }}>
                  <img
                    src={viewSignature.waiverSignature}
                    alt="Client signature"
                    style={{ width: '100%', maxHeight: 160, objectFit: 'contain', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '1rem 1.25rem', background: '#F9FAFB' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#111827', fontStyle: 'italic' }}>
                    {viewSignature.waiverSignature}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>Text signature (pre-canvas)</div>
                </div>
              )}
              <div style={{ marginTop: 10, padding: '0.65rem 0.85rem', background: '#F0FDF9', borderRadius: 8, border: '1px solid #99F6E4', fontSize: '0.78rem', color: '#047857' }}>
                This signature was collected as part of the NMD Pressure Washing Service Agreement & Liability Waiver, which includes acknowledgment that estimates and quotes are not guaranteed final prices.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Quote Modal */}
      {quoteRequest && (
        <div style={modalOverlay}>
          <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(17,24,39,0.2)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Create Quote</div>
              <button onClick={() => setQuoteRequest(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: '1rem 1.5rem', background: '#F8FAF9', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: 4 }}>Creating quote for</div>
                <div style={{ fontWeight: 700, color: '#111827', fontFamily: 'DM Sans, sans-serif' }}>{quoteRequest.firstName} {quoteRequest.lastName}</div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: 2 }}>{quoteRequest.serviceType} · {quoteRequest.address}</div>
                {quoteRequest.preferredDate && (
                  <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 2 }}>Preferred: {fmtDate(quoteRequest.preferredDate)}{quoteRequest.preferredTime ? ` · ${quoteRequest.preferredTime}` : ''}</div>
                )}
                {quoteRequest.notes && (
                  <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 6, background: 'white', borderRadius: 6, padding: '0.5rem 0.75rem', border: '1px solid #E5E7EB' }}>
                    <strong>Notes:</strong> {quoteRequest.notes}
                  </div>
                )}
              </div>

              {quoteRequest.hasPhoto && (
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Photo</div>
                  {quoteRequest.photoDataUrl ? (
                    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                      <img
                        src={quoteRequest.photoDataUrl}
                        alt="Client photo"
                        style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, border: '1px solid #E5E7EB', cursor: 'zoom-in' }}
                        onClick={() => setViewPhoto(quoteRequest)}
                      />
                      <div
                        onClick={() => setViewPhoto(quoteRequest)}
                        style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.72rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 6, cursor: 'zoom-in' }}
                      >
                        View Full
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#9CA3AF', fontSize: '0.85rem', fontStyle: 'italic' }}>Loading photo…</div>
                  )}
                  {quoteRequest.photoNote && (
                    <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 6, fontStyle: 'italic' }}>"{quoteRequest.photoNote}"</div>
                  )}
                </div>
              )}

              <form onSubmit={handleCreateQuote} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {quoteError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#B91C1C' }}>{quoteError}</div>}
                <div>
                  <label style={labelStyle}>Quote Total ($) *</label>
                  <input
                    style={inputStyle} type="number" value={quoteForm.total}
                    onChange={e => setQuoteForm(p => ({ ...p, total: e.target.value }))}
                    placeholder="0.00" min="0" step="0.01" required autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Send to Client?</label>
                  <select style={inputStyle} value={quoteForm.status} onChange={e => setQuoteForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="sent">Yes — Send quote to client now</option>
                    <option value="draft">No — Save as draft first</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setQuoteRequest(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                  <button type="submit" disabled={quoteSaving} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: '#0F766E', color: 'white', fontWeight: 600, cursor: quoteSaving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: quoteSaving ? 0.7 : 1 }}>
                    {quoteSaving ? 'Creating...' : 'Create Quote'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="Service Requests"
        sub={`${requests.length} total · ${pending} pending review · ${signedRequests.length} signed`}
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search requests..." />}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '2px solid #E5E7EB' }}>
        {([
          { key: 'requests', label: `Requests (${requests.length})` },
          { key: 'signature-log', label: `Signature Log (${signedRequests.length})` },
        ] as { key: typeof activeTab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.65rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.875rem', color: activeTab === tab.key ? '#0F766E' : '#9CA3AF',
              borderBottom: `2px solid ${activeTab === tab.key ? '#0F766E' : 'transparent'}`,
              marginBottom: -2, transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {/* Requests Tab */}
      {!loading && !error && activeTab === 'requests' && (
        <DataTable
          headers={['Client', 'Service', 'Contact', 'Preferred Date', 'Status', 'Received', '']}
          emptyMessage="No service requests yet."
          rows={filtered.map(r => [
            <div key="name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {r.hasPhoto && (
                <button
                  onClick={async () => {
                    if (r.photoDataUrl) { setViewPhoto(r); return }
                    const full = await fetchRequestDetail(r.id)
                    if (full) setViewPhoto(full)
                  }}
                  title="View photo"
                  style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: '1rem', padding: 0 }}
                >📷</button>
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</div>
                {r.waiverAccepted && (
                  <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 500 }}>✓ Waiver signed</div>
                )}
              </div>
            </div>,
            <span key="svc" style={{ color: '#6B7280' }}>{r.serviceType || '—'}</span>,
            <div key="contact">
              <div style={{ fontSize: '0.82rem' }}>{r.email || '—'}</div>
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{r.phone || '—'}</div>
            </div>,
            <span key="date" style={{ color: '#6B7280', whiteSpace: 'nowrap' }}>
              {r.preferredDate ? fmtDate(r.preferredDate) : '—'}
              {r.preferredTime ? ` · ${r.preferredTime}` : ''}
            </span>,
            <div key="status" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StatusBadge status={r.status} />
              {statusLoading === r.id && <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>...</span>}
            </div>,
            <span key="created" style={{ color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</span>,
            <div key="actions" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {r.hasSignature && (
                <button
                  onClick={async () => {
                    if (r.waiverSignature) { setViewSignature(r); return }
                    const full = await fetchRequestDetail(r.id)
                    if (full) setViewSignature(full)
                  }}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Signature
                </button>
              )}
              {(r.status === 'pending' || r.status === 'new') && (
                <button
                  onClick={() => openQuoteModal(r)}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Create Quote
                </button>
              )}
              {r.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(r, 'declined')}
                  disabled={statusLoading === r.id}
                  style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Decline
                </button>
              )}
              {r.status === 'reviewed' && (
                <span style={{ fontSize: '0.75rem', color: '#0F766E', fontWeight: 600 }}>Quoted</span>
              )}
            </div>
          ])}
        />
      )}

      {/* Signature Log Tab */}
      {!loading && !error && activeTab === 'signature-log' && (
        <div>
          {signedRequests.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', padding: '3rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
              No signed agreements yet. Signatures appear here when clients sign the waiver during estimate submission.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {signedRequests.map((r, i) => (
                <div key={r.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  {/* Row header */}
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{r.firstName} {r.lastName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{r.serviceType} · {r.address}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Signed</div>
                        <div style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>
                          {r.waiverSignedAt
                            ? new Date(r.waiverSignedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                            : fmtDate(r.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF9', borderRadius: 20, padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        ✓ Waiver Accepted
                      </div>
                      <button
                        onClick={async () => {
                          if (r.waiverSignature) { downloadAgreementPdf(r); return }
                          const full = await fetchRequestDetail(r.id)
                          downloadAgreementPdf(full || r)
                        }}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: 6, border: 'none', background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={async () => {
                          if (r.waiverSignature) { setViewSignature(r); return }
                          const full = await fetchRequestDetail(r.id)
                          if (full) setViewSignature(full)
                        }}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        View Signature
                      </button>
                    </div>
                  </div>

                  {/* Inline signature preview */}
                  <div style={{ padding: '0 1.25rem 1rem', borderTop: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Signature</div>
                        {!r.waiverSignature ? (
                          <div style={{ fontSize: '0.78rem', color: '#9CA3AF', fontStyle: 'italic', padding: '0.5rem 0' }}>Loading signature…</div>
                        ) : isSignatureImage(r.waiverSignature) ? (
                          <div
                            style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '0.5rem', background: '#F9FAFB', cursor: 'zoom-in', maxWidth: 280 }}
                            onClick={() => setViewSignature(r)}
                          >
                            <img
                              src={r.waiverSignature}
                              alt="Signature"
                              style={{ width: '100%', maxHeight: 70, objectFit: 'contain', display: 'block' }}
                            />
                          </div>
                        ) : (
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#111827', fontStyle: 'italic', padding: '0.5rem 0' }}>
                            {r.waiverSignature}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Contact</div>
                        <div style={{ fontSize: '0.82rem', color: '#374151' }}>{r.email || '—'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{r.phone || '—'}</div>
                      </div>
                      <div style={{ minWidth: 100 }}>
                        <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Request Status</div>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PortalShell>
  )
}