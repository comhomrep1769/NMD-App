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
  'What areas do you serve?',
  'How does recurring pricing work?',
  'What\'s included in house washing?',
  'Start an estimate',
]

const GURU_INTRO: Message = {
  role: 'guru',
  text: 'Hey! I\'m Guru, the NMD assistant 👋 I can help you figure out which service you need, explain our recurring plans, or get you started with a free estimate. What can I help you with?',
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

  const getFallback = (text: string): string => {
    const t = text.toLowerCase()
    if (t.includes('area') || t.includes('serve') || t.includes('location') || t.includes('orlando') || t.includes('brevard'))
      return 'We primarily serve Orange County (Orlando, Winter Park, Kissimmee, Ocoee) and Brevard County (Melbourne, Cocoa, Palm Bay, Titusville), FL. Not sure if we cover your area? Just request a quote and we\'ll confirm!'
    if (t.includes('recurring') || t.includes('discount') || t.includes('plan'))
      return 'Our recurring plans save you 20% on every visit after your first service. Choose Weekly, Biweekly, Monthly, Quarterly, Bi-Annual, or Annual. Your first service is at the standard rate — pricing is based on your property size and scope.'
    if (t.includes('quote') || t.includes('price') || t.includes('cost') || t.includes('how much'))
      return 'Getting a quote is easy — just click "Get a Free Quote" or tell me a little about your property and I\'ll help you start an estimate right here!'
    if (t.includes('house') || t.includes('wash'))
      return 'House washing includes exterior soft washing of all siding, removing algae, mold, mildew, and dirt buildup. We use low-pressure soft wash chemicals that are safe for all siding types. Want to start an estimate?'
    if (t.includes('roof'))
      return 'Roof cleaning uses a low-pressure soft wash process — no high pressure that could damage shingles. We treat algae, moss, lichen, and black streaks. Want an estimate for your roof?'
    if (t.includes('driveway') || t.includes('concrete') || t.includes('paver'))
      return 'We clean driveways, concrete pads, pavers, and all flatwork. We can also do paver sanding and sealing after cleaning. Want to start an estimate?'
    if (t.includes('commercial') || t.includes('business'))
      return 'We serve commercial properties including storefronts, restaurants, parking lots, apartment complexes, hotels, and more. We offer property management maintenance programs too. Ready for a quote?'
    if (t.includes('estimate') || t.includes('start'))
      return 'I can start an estimate for you right now! Click the "Start an Estimate" button below and fill in a few details about your property.'
    return 'Great question! I can start an estimate for you right now, or you can click "Get a Free Quote" at the top of the page. Want to tell me a bit about your property?'
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    if (text === 'Start an estimate') { setEstimateMode(true); return }

    const userMsg: Message = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${API_URL}/api/guru/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      if (res.ok) {
        const data = await res.json()
        const reply = data.guruMessage?.body || data.reply || data.message || getFallback(text)
        setMessages(prev => [...prev, { role: 'guru', text: reply }])
      } else {
        setMessages(prev => [...prev, { role: 'guru', text: getFallback(text) }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'guru', text: getFallback(text) }])
    }
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
          ? ` Early range: $${Number(low).toFixed(2)} – $${Number(high).toFixed(2)}.`
          : ''
        setMessages(prev => [...prev,
          { role: 'user', text: `Submitted estimate for ${estimateForm.serviceType} at ${estimateForm.address}.` },
          { role: 'guru', text: `Thanks ${estimateForm.clientName}! Your estimate was submitted for NMD review.${rangeText} This is not a final quote — NMD will review and confirm official pricing. We'll be in touch soon!` },
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
          background: 'linear-gradient(135deg, #1f6132, #124d83)',
          color: 'white', fontSize: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(23,99,168,0.35)', cursor: 'pointer',
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
              Estimate submitted — NMD will be in touch soon.
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