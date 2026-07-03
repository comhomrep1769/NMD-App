'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'guru'; text: string }

type EstimateForm = {
  clientName: string
  phone: string
  email: string
  address: string
  serviceType: string
  propertyArea: string
  surfaceType: string
  conditionLevel: string
  squareFootage: string
  preferredSchedule: string
  specialConcerns: string
}

const EMPTY_FORM: EstimateForm = {
  clientName: '', phone: '', email: '', address: '',
  serviceType: '', propertyArea: '', surfaceType: '',
  conditionLevel: '', squareFootage: '', preferredSchedule: '',
  specialConcerns: '',
}

const QUICK_PROMPTS = [
  'How much to wash my house?',
  'How does recurring pricing work?',
  'I have rust stains on my driveway',
  'Start an estimate',
]

const GURU_INTRO: Message = {
  role: 'guru',
  text: 'Hey! I\'m Guru, the NMD assistant 👋 I can help you get a price estimate, explain our services, or get you started with a free quote. What can I help you with?',
}

// Pricing rates per sqft
const RATES: Record<string, { low: number; high: number; unit: string }> = {
  'mobile home':  { low: 0.62, high: 0.77, unit: 'sqft' },
  'tile roof':    { low: 0.51, high: 0.63, unit: 'sqft' },
  'two story':    { low: 0.48, high: 0.59, unit: 'sqft' },
  '2 story':      { low: 0.48, high: 0.59, unit: 'sqft' },
  'deck':         { low: 0.46, high: 0.57, unit: 'sqft' },
  'one story':    { low: 0.45, high: 0.56, unit: 'sqft' },
  '1 story':      { low: 0.45, high: 0.56, unit: 'sqft' },
  'house':        { low: 0.45, high: 0.56, unit: 'sqft' },
  'home':         { low: 0.45, high: 0.56, unit: 'sqft' },
  'fence':        { low: 0.43, high: 0.53, unit: 'sqft' },
  'driveway':     { low: 0.42, high: 0.52, unit: 'sqft' },
  'concrete':     { low: 0.42, high: 0.52, unit: 'sqft' },
  'brick':        { low: 0.40, high: 0.50, unit: 'sqft' },
  'pool deck':    { low: 0.40, high: 0.50, unit: 'sqft' },
  'patio':        { low: 0.39, high: 0.49, unit: 'sqft' },
  'roof':         { low: 0.39, high: 0.49, unit: 'sqft' },
  'gutter':       { low: 1.10, high: 1.35, unit: 'linear ft' },
  'gutters':      { low: 1.10, high: 1.35, unit: 'linear ft' },
  'moss':         { low: 0.72, high: 1.39, unit: 'sqft' },
  'soffit':       { low: 1.12, high: 1.38, unit: 'sqft' },
  'shutter':      { low: 26.25, high: 32.79, unit: 'per shutter' },
  'shutters':     { low: 26.25, high: 32.79, unit: 'per shutter' },
}

const DEFAULT_SQFT: Record<string, number> = {
  'house': 1500, 'home': 1500,
  'one story': 1500, '1 story': 1500,
  'two story': 2400, '2 story': 2400,
  'driveway': 500, 'concrete': 500,
  'deck': 300, 'patio': 300,
  'fence': 400,
  'roof': 2000, 'tile roof': 2000,
  'mobile home': 1200,
}

function getSmartReply(text: string): string {
  const t = text.toLowerCase()

  // Extract sqft if mentioned
  const sqftMatch = t.match(/(\d[\d,]*)\s*(sqft|sq\.?\s*ft|square\s*feet|sf)\b/)
  const mentionedSqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null

  // Detect estimate intent
  const isEstimate =
    t.includes('how much') || t.includes('price') || t.includes('cost') ||
    t.includes('estimate') || t.includes('quote') || t.includes('charge') ||
    t.includes('what would') || t.includes('pricing')

  // Rust / orange stains
  if (t.includes('rust') || t.includes('orange stain') || t.includes('fertilizer stain') || t.includes('irrigation stain')) {
    return `Rust and orange staining from irrigation or fertilizer is a specialty service we treat with F9 BARC – the industry's top rust remover.\n\nPricing:\n• Single spot treatment: $50 – $100\n• Walkway/entry area: $125 – $300\n• Heavy irrigation staining: $300 – $800+\n• Minimum charge: $125\n\nWe power wash first, then apply F9 BARC which reverses 80–100% of orange staining. Submit an estimate below and include photos if you can!`
  }

  // Estimate requests
  if (isEstimate) {
    // Find which surface was mentioned
    let matchedSurface: string | null = null
    let matchedRate: { low: number; high: number; unit: string } | null = null

    for (const [keyword, rate] of Object.entries(RATES)) {
      if (t.includes(keyword)) {
        matchedSurface = keyword
        matchedRate = rate
        break
      }
    }

    // Shutters
    if (matchedSurface === 'shutter' || matchedSurface === 'shutters') {
      const countMatch = t.match(/(\d+)\s*shutter/)
      const count = countMatch ? parseInt(countMatch[1]) : null
      if (count) {
        const low = Math.round(count * 26.25)
        const high = Math.round(count * 32.79)
        return `For ${count} shutters, the estimated range is $${low} – $${high} ($26.25–$32.79 per shutter).\n\nThis is a soft-clean service – no pressure washing.\n\nClick "Start a Guru Estimate" below and we'll send you a firm quote within 24 hours.`
      }
      return `Shutter cleaning is priced at $26.25 – $32.79 per shutter.\n\nHow many shutters do you have? I can give you a total estimate.`
    }

    // Gutters
    if (matchedSurface === 'gutter' || matchedSurface === 'gutters') {
      const linearMatch = t.match(/(\d+)\s*(linear|lin|lf|ft|feet)/)
      const linearFt = linearMatch ? parseInt(linearMatch[1]) : null
      if (linearFt) {
        const low = Math.round(linearFt * 1.10)
        const high = Math.round(linearFt * 1.35)
        return `For ${linearFt} linear feet of gutters, the estimated range is $${low} – $${high} ($1.10–$1.35/linear ft).\n\nClick "Start a Guru Estimate" below to get a firm quote.`
      }
      return `Gutter cleaning is priced at $1.10 – $1.35 per linear foot.\n\nHow many linear feet of gutters do you have? A typical home is 100–200 linear feet.`
    }

    // Sqft-based surfaces
    if (matchedRate && matchedRate.unit === 'sqft') {
      const sqft = mentionedSqft || DEFAULT_SQFT[matchedSurface!] || 1500
      const low = Math.round(sqft * matchedRate.low)
      const high = Math.round(sqft * matchedRate.high)
      const usedDefault = !mentionedSqft

      let reply = `Here's an estimate for ${matchedSurface} cleaning:\n\n`
      reply += `• Area: ~${sqft.toLocaleString()} sqft${usedDefault ? ' (estimated)' : ''}\n`
      reply += `• Rate: $${matchedRate.low.toFixed(2)} – $${matchedRate.high.toFixed(2)}/sqft\n`
      reply += `• Estimate: $${low.toLocaleString()} – $${high.toLocaleString()}\n\n`
      if (usedDefault) reply += `If you know your exact square footage, I can tighten that range.\n\n`
      reply += `Click "Start a Guru Estimate" below and we'll send a firm quote within 24 hours.`
      return reply
    }

    // No surface detected
    return `I can give you a price estimate! Just tell me:\n\n1. Surface type – house, driveway, roof, deck, fence, patio, etc.\n2. Approximate size – square footage if you know it (optional)\n\nWhat surface are you looking to have cleaned?`
  }

  // Chemical / soft wash
  if (t.includes('chemical') || t.includes('bleach') || t.includes('soft wash') || t.includes('pressure') || t.includes('psi')) {
    return `We use professional-grade chemicals for every job:\n\n• House/siding: Sodium hypochlorite 1–2% + surfactant at soft wash pressure (100–500 PSI)\n• Roof: SH 4–6% – soft wash only, never high pressure on shingles\n• Rust removal: F9 BARC (industry standard)\n• Wood restoration: Sodium percarbonate + oxalic acid brightener\n• Grease/oil: Purple Power or Dragon Juice degreaser\n\nWhat surface are you dealing with?`
  }

  // Mold / algae / treatment
  if (t.includes('mold') || t.includes('mildew') || t.includes('algae') || t.includes('moss') || t.includes('stain') || t.includes('oxidation')) {
    if (t.includes('roof') || t.includes('shingle')) {
      return `For roof algae and moss we use soft wash only – sodium hypochlorite 4–6% with surfactant. High pressure is never used on shingles as it strips granules and voids warranties.\n\nRoof cleaning estimate: $300 – $900+ depending on size, pitch, and moss level.\n\nWant to start an estimate?`
    }
    if (t.includes('siding') || t.includes('house') || t.includes('wall')) {
      return `For algae and mold on siding we use soft wash – sodium hypochlorite 1–2% + Elemonator surfactant at 100–500 PSI. Safe for all siding types.\n\nHouse washing estimate: $200 – $500+ depending on size.\n\nWant to start an estimate?`
    }
    return `For mold, algae, and organic growth we use a soft wash treatment with sodium hypochlorite and surfactant. Results last 12–18 months.\n\nTell me the surface type and I'll give you a price estimate.`
  }

  // Recurring plans
  if (t.includes('recurring') || t.includes('discount') || t.includes('plan') || t.includes('monthly') || t.includes('weekly')) {
    return `Our recurring plans save you 20% on every visit after your first service.\n\nOptions: Weekly, Biweekly, Monthly, Quarterly, Bi-Annual, or Annual.\n\nBest candidates: driveways, roofs, dumpster pads, commercial storefronts, pool decks, and HOA properties.\n\nWant to include a recurring plan in your estimate?`
  }

  // Service area
  if (t.includes('area') || t.includes('serve') || t.includes('location') || t.includes('orlando') || t.includes('brevard')) {
    return `We serve Orange County (Orlando, Winter Park, Kissimmee, Ocoee) and Brevard County (Melbourne, Cocoa, Palm Bay, Titusville), FL.\n\nNot sure if we cover your area? Submit an estimate and we'll confirm!`
  }

  // House washing info
  if (t.includes('house wash') || t.includes('what\'s included') || t.includes('whats included')) {
    return `House washing includes exterior soft washing of all siding – removing algae, mold, mildew, and dirt buildup. We use low-pressure chemicals safe for all siding types including vinyl, stucco, Hardie board, and brick.\n\nTypical estimate: $200 – $500+\n\nWant a specific estimate for your home?`
  }

  // Greeting
  if (t.length < 15 || t.includes('hello') || t.includes('hi') || t.includes('hey')) {
    return `Hi! I can help you with:\n\n• Price estimates – tell me the surface and size\n• Treatment questions – what method for your problem\n• Service info – what's included, how it works\n\nWhat can I help you with?`
  }

  // Default
  return `I can help with price estimates, treatment questions, and service info. Try asking:\n\n• "How much to wash a 1-story house?"\n• "What's the cost for a 500 sqft driveway?"\n• "I have rust stains on my driveway"\n• "What is soft washing?"`
}

export default function GuruChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GURU_INTRO])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(true)
  const [estimateMode, setEstimateMode] = useState(false)
  const [estimateForm, setEstimateForm] = useState<EstimateForm>(EMPTY_FORM)
  const [savingEstimate, setSavingEstimate] = useState(false)
  const [estimateSubmitted, setEstimateSubmitted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setUnread(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [open, messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    if (text === 'Start an estimate') { setEstimateMode(true); return }

    const userMsg: Message = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Use smart frontend reply – no auth needed, always works
    const reply = getSmartReply(text)
    setMessages(prev => [...prev, { role: 'guru', text: reply }])
    setLoading(false)
  }

  const updateField = (field: keyof EstimateForm, value: string) =>
    setEstimateForm(prev => ({ ...prev, [field]: value }))

  const submitEstimate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEstimate(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${API_URL}/api/guru/estimate-intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estimateForm),
      })
      if (res.ok) {
        const data = await res.json()
        const low = data.estimate?.preliminaryEstimateLow
        const high = data.estimate?.preliminaryEstimateHigh
        const rangeText = low && high
          ? ` Early range: $${Number(low).toFixed(0)} – $${Number(high).toFixed(0)}.`
          : ''
        setMessages(prev => [...prev,
          { role: 'user', text: `Submitted estimate for ${estimateForm.serviceType} at ${estimateForm.address}.` },
          { role: 'guru', text: `Thanks ${estimateForm.clientName}! Your estimate was submitted for NMD review.${rangeText} This is not a final quote – NMD will confirm official pricing and be in touch soon!` },
        ])
      } else {
        setMessages(prev => [...prev,
          { role: 'guru', text: 'Your estimate details were received! Our team will reach out to confirm pricing. You can also call or message us directly.' },
        ])
      }
      setEstimateMode(false)
      setEstimateSubmitted(true)
      setEstimateForm(EMPTY_FORM)
    } catch {
      setMessages(prev => [...prev,
        { role: 'guru', text: 'Could not submit right now. Please try the quote form on our website or contact us directly.' },
      ])
      setEstimateMode(false)
    }
    setSavingEstimate(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.55rem 0.85rem',
    borderRadius: 8, border: '1.5px solid #dde4ef',
    fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
    background: '#f4f7fb', marginBottom: 8,
  }
  const selectStyle: React.CSSProperties = { ...inputStyle }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open Guru AI Chat"
        style={{
          position: 'fixed', bottom: '1.75rem', right: '1.75rem', zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: open ? 'linear-gradient(135deg, #1f6132, #124d83)' : 'white',
          color: 'white', fontSize: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 3px #0F766E, 0 4px 24px rgba(15,118,110,0.3)', cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          padding: 0, overflow: 'hidden',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? '✕' : (
          <img
            src="/guru-avatar.jpg"
            alt="Guru"
            style={{ width: 56, height: 56, objectFit: 'cover', objectPosition: 'center 10%' }}
          />
        )}
        {!open && unread && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 14, height: 14, borderRadius: '50%',
            background: '#e53e3e', border: '2px solid white',
          }} />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '5.5rem', right: '1.75rem', zIndex: 999,
          width: 370, maxWidth: 'calc(100vw - 2rem)',
          background: 'white', borderRadius: 20,
          boxShadow: '0 16px 60px rgba(14,17,23,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid #dde4ef', maxHeight: '78vh',
        }}>

          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, #1f6132, #124d83)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/guru-avatar.jpg"
                alt="Guru"
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  objectFit: 'cover', objectPosition: 'center 10%',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              />
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>Guru</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem' }}>NMD AI Assistant · Online</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
            >
              Close
            </button>
          </div>

          {/* Estimate submitted banner */}
          {estimateSubmitted && !estimateMode && (
            <div style={{ padding: '0.6rem 1rem', background: '#eaf7ef', borderBottom: '1px solid #c2edcf', fontSize: '0.8rem', color: '#1a4d28', fontWeight: 500 }}>
              Estimate submitted – NMD will be in touch soon.
            </div>
          )}

          {/* Estimate form */}
          {estimateMode ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f4f7fb' }}>
              <div style={{ fontSize: '0.8rem', color: '#5a6a88', background: 'white', borderRadius: 10, padding: '0.65rem 0.85rem', marginBottom: 12, border: '1px solid #dde4ef', lineHeight: 1.5 }}>
                Guru estimates are preliminary. Admin must review and approve final pricing.
              </div>
              <form onSubmit={submitEstimate}>
                <input style={inputStyle} placeholder="Full name" value={estimateForm.clientName} onChange={e => updateField('clientName', e.target.value)} required />
                <input style={inputStyle} placeholder="Phone number" value={estimateForm.phone} onChange={e => updateField('phone', e.target.value)} />
                <input style={inputStyle} placeholder="Email address" value={estimateForm.email} onChange={e => updateField('email', e.target.value)} type="email" />
                <input style={inputStyle} placeholder="Service address" value={estimateForm.address} onChange={e => updateField('address', e.target.value)} required />
                <select style={selectStyle} value={estimateForm.serviceType} onChange={e => updateField('serviceType', e.target.value)} required>
                  <option value="">Select service type</option>
                  <option>House Washing</option>
                  <option>Driveway / Concrete Cleaning</option>
                  <option>Roof Cleaning</option>
                  <option>Fence Cleaning</option>
                  <option>Pool Deck Cleaning</option>
                  <option>Trash Can Cleaning</option>
                  <option>Commercial Cleaning</option>
                  <option>Rust Removal / Specialty Restoration</option>
                  <option>Other</option>
                </select>
                <input style={inputStyle} placeholder="Property area (e.g. driveway, roof, back patio)" value={estimateForm.propertyArea} onChange={e => updateField('propertyArea', e.target.value)} />
                <input style={inputStyle} placeholder="Surface/material (e.g. vinyl, concrete, pavers)" value={estimateForm.surfaceType} onChange={e => updateField('surfaceType', e.target.value)} />
                <select style={selectStyle} value={estimateForm.conditionLevel} onChange={e => updateField('conditionLevel', e.target.value)}>
                  <option value="">Condition level</option>
                  <option>Light</option><option>Moderate</option><option>Heavy</option><option>Severe</option><option>Unsure</option>
                </select>
                <input style={inputStyle} placeholder="Square footage or dimensions (if known)" value={estimateForm.squareFootage} onChange={e => updateField('squareFootage', e.target.value)} />
                <input style={inputStyle} placeholder="Preferred schedule" value={estimateForm.preferredSchedule} onChange={e => updateField('preferredSchedule', e.target.value)} />
                <textarea style={{ ...inputStyle, resize: 'vertical' }} placeholder="Special concerns, stains, access issues, pets, plants, etc." rows={3} value={estimateForm.specialConcerns} onChange={e => updateField('specialConcerns', e.target.value)} />
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button type="submit" disabled={savingEstimate} style={{
                    flex: 1, padding: '0.65rem', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white',
                    fontWeight: 600, fontSize: '0.875rem', cursor: savingEstimate ? 'not-allowed' : 'pointer',
                    opacity: savingEstimate ? 0.7 : 1,
                  }}>
                    {savingEstimate ? 'Submitting...' : 'Submit for Review'}
                  </button>
                  <button type="button" onClick={() => setEstimateMode(false)} style={{
                    padding: '0.65rem 1rem', borderRadius: 10,
                    border: '1.5px solid #dde4ef', background: 'white',
                    fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', color: '#3a4660',
                  }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                background: '#f4f7fb', minHeight: 200,
              }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '84%', padding: '0.65rem 0.9rem',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #1f6132, #124d83)' : 'white',
                      color: msg.role === 'user' ? 'white' : '#0e1117',
                      fontSize: '0.875rem', lineHeight: 1.5,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: msg.role === 'guru' ? '1px solid #dde4ef' : 'none',
                      whiteSpace: 'pre-line',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '0.65rem 0.9rem', borderRadius: '16px 16px 16px 4px', background: 'white', border: '1px solid #dde4ef', fontSize: '0.875rem', color: '#5a6a88' }}>
                      Guru is typing...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts */}
              {messages.length <= 1 && (
                <div style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: 6, flexWrap: 'wrap', background: 'white', borderTop: '1px solid #dde4ef' }}>
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => sendMessage(p)} style={{
                      fontSize: '0.72rem', fontWeight: 500, padding: '4px 10px',
                      borderRadius: 100, border: '1px solid #dde4ef',
                      background: '#f4f7fb', color: '#3a4660', cursor: 'pointer',
                    }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Start estimate button */}
              <div style={{ padding: '0.5rem 0.75rem', background: 'white', borderTop: messages.length <= 1 ? 'none' : '1px solid #dde4ef' }}>
                <button onClick={() => setEstimateMode(true)} style={{
                  width: '100%', padding: '0.55rem', borderRadius: 10,
                  border: '1.5px solid #c0dd97', background: '#eaf7ef',
                  color: '#1a4d28', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                }}>
                  Start a Guru Estimate
                </button>
              </div>

              {/* Input */}
              <div style={{ padding: '0.65rem 0.85rem', background: 'white', borderTop: '1px solid #dde4ef', display: 'flex', gap: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask Guru anything..."
                  style={{
                    flex: 1, padding: '0.55rem 0.85rem', borderRadius: 100,
                    border: '1.5px solid #dde4ef', fontSize: '0.875rem', outline: 'none',
                    fontFamily: 'DM Sans, sans-serif', color: '#0e1117', background: '#f4f7fb',
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: input.trim() && !loading ? 'linear-gradient(135deg, #1f6132, #124d83)' : '#dde4ef',
                    color: input.trim() && !loading ? 'white' : '#8494b0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem', flexShrink: 0,
                  }}
                >
                  →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
