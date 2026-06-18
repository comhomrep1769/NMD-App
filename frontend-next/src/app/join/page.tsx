'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

const POSITIONS = [
  'Pressure Washing Technician',
  'Route Driver',
  'Sales & Marketing Representative',
  'Customer Service Representative',
  'Operations Assistant',
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: 10,
  border: '1.5px solid #dde4ef', fontSize: '0.9rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
  background: 'white', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem', fontWeight: 600, color: '#3a4660', display: 'block', marginBottom: 6,
}

export default function JoinOurTeamPage() {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', position: '', message: ''
  })
  const [resumeFile, setResumeFile] = useState<{ name: string; dataUrl: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.size > 5_000_000) { setError('File too large. Max 5MB.'); return }
    const reader = new FileReader()
    reader.onload = e => setResumeFile({ name: file.name, dataUrl: e.target?.result as string })
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.fullName || !form.email || !form.position || !form.phone) {
  setError('Please fill in all required fields.')
  return
}
if (!resumeFile) {
  setError('Please upload your resume before submitting.')
  return
}

    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          position: form.position,
          message: form.message,
          resumeDataUrl: resumeFile?.dataUrl || null,
          resumeFileName: resumeFile?.name || null,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '3rem 2rem', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(14,17,23,0.08)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1.5rem' }}>✓</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: '#0e1117', marginBottom: 12 }}>Application Submitted!</h2>
          <p style={{ color: '#5a6a88', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Thanks for applying to NMD Pressure Washing Services LLC. We've received your application and will be in touch if you're a great fit.
          </p>
          <Link href="/" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', borderRadius: 10, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0e1117, #1a2640)', padding: '3rem 1.5rem 4rem', textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: '2rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 800 }}>NMD</div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500 }}>NMD Pressure Washing Services LLC</span>
        </Link>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.25rem', fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: '-0.03em' }}>Join Our Team</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          We're looking for hardworking, reliable people to grow with us. Apply below and we'll be in touch.
        </p>
      </div>

      {/* Perks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', maxWidth: 900, margin: '-2rem auto 2rem', padding: '0 1.5rem' }}>
        {[
          { icon: '💰', title: 'Competitive Pay', desc: 'Hourly + performance bonuses' },
          { icon: '📈', title: 'Growth Opportunity', desc: 'Advance into leadership roles' },
          { icon: '🤝', title: 'Great Team', desc: 'Supportive, family-like culture' },
          { icon: '🚗', title: 'Mileage Covered', desc: 'Routes covered for field roles' },
        ].map(p => (
          <div key={p.title} style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: '1.5px solid #dde4ef', boxShadow: '0 2px 12px rgba(14,17,23,0.06)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0e1117', marginBottom: 4 }}>{p.title}</div>
            <div style={{ fontSize: '0.8rem', color: '#8494b0' }}>{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '2rem', border: '1.5px solid #dde4ef', boxShadow: '0 4px 24px rgba(14,17,23,0.06)' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: '#0e1117', marginBottom: '1.5rem' }}>Application Form</h2>

          {error && (
            <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#c0392b' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="John Smith" required />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@email.com" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(407) 555-0000" required />
              </div>
              <div>
                <label style={labelStyle}>Position Applying For *</label>
                <select style={inputStyle} value={form.position} onChange={e => update('position', e.target.value)} required>
                  <option value="">Select a position...</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Why do you want to join NMD?</label>
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                value={form.message}
                onChange={e => update('message', e.target.value)}
                placeholder="Tell us a bit about yourself and why you'd be a great fit..."
              />
            </div>

            <div>
              <label style={labelStyle}>Resume (PDF or Word, max 5MB) *</label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files)} />
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: '1.5px dashed #b0c0d8', background: resumeFile ? '#f0fff4' : '#f4f7fb', color: resumeFile ? '#1f6132' : '#5a6a88', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {resumeFile ? `✓ ${resumeFile.name}` : '+ Upload Resume (optional)'}
              </button>
              {resumeFile && (
                <button type="button" onClick={() => setResumeFile(null)}
                  style={{ marginTop: 6, background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Remove file
                </button>
              )}
            </div>

            <button type="submit" disabled={submitting}
              style={{ padding: '0.85rem', borderRadius: 10, border: 'none', background: submitting ? '#dde4ef' : 'linear-gradient(135deg, #1f6132, #124d83)', color: submitting ? '#8494b0' : 'white', fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>
              {submitting ? 'Submitting...' : 'Submit Application →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}