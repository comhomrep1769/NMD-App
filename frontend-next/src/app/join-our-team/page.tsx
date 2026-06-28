'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'

type Position = {
  id: number
  title: string
  type: string
  location: string
  description: string
  badge: 'hiring' | 'parttime'
}

const POSITIONS: Position[] = [
  {
    id: 1,
    title: 'Field Technician',
    type: 'Full-time',
    location: 'Orlando metro + Brevard County',
    description: 'Operate pressure washing equipment on residential and commercial jobs. Training provided \u2014 no prior experience required.',
    badge: 'hiring',
  },
  {
    id: 2,
    title: 'Lead Technician',
    type: 'Full-time',
    location: 'All coverage areas',
    description: 'Lead small crews, train new hires, and handle complex jobs including roof soft wash and specialty restoration.',
    badge: 'hiring',
  },
  {
    id: 3,
    title: 'Route Driver / Logistics',
    type: 'Part-time',
    location: 'Orlando area',
    description: 'Drive company vehicle, transport equipment, coordinate daily route logistics. Clean driving record required.',
    badge: 'parttime',
  },
]

const CITIES = ['Orlando, FL', 'Winter Park, FL', 'Kissimmee, FL', 'Melbourne, FL', 'Palm Bay, FL']

export default function JoinOurTeamPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [cityArea, setCityArea] = useState(CITIES[0])
  const [message, setMessage] = useState('')
  const [resumeFile, setResumeFile] = useState<{ name: string; dataUrl: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

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

    if (!firstName || !lastName || !email || !phone || !position) {
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
          fullName: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          position,
          message,
          cityArea,
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

  return (
    <>
      <Navbar />

      {submitted ? (
        <section className="min-h-[100vh] flex items-center justify-center bg-[#F8FAF9] px-[24px]">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[48px] max-w-[460px] w-full text-center">
            <div className="w-[56px] h-[56px] bg-[#F0FDF9] rounded-full flex items-center justify-center mx-auto mb-[20px]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L19 8" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-[22px] font-bold text-[#111827] mb-[10px]">Application Received!</h2>
            <p className="text-[15px] text-[#6B7280] leading-[1.6] mb-[28px]">
              We&apos;ll review your application and reach out within 48 hours. Thank you for your interest in NMD.
            </p>
            <Link href="/" className="inline-block bg-[#0F766E] !text-white text-[14px] font-semibold px-[24px] py-[12px] rounded-[8px]">
              Back to Home
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* HERO */}
          <section className="jt-hero mt-[68px] relative min-h-[420px] flex items-center bg-[#0A2720] overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 0, transparent 50%)', backgroundSize: '28px 28px' }}
            />
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1800&q=80')" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 100%)' }}
            />
            <div className="jt-hero-inner jt-container relative z-[2] max-w-[1440px] mx-auto px-[65px] py-[72px] w-full">
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#34D399] mb-[16px]">Careers at NMD</p>
              <h1 className="text-[48px] font-extrabold !text-white leading-[1.05] tracking-[-0.035em] mb-[18px] max-w-[620px]">
  Join a Team That Takes<br />
  Pride in the Work
</h1>
              <p className="text-[17px] !text-white/65 leading-[1.65] max-w-[480px]">
                We&apos;re growing across Central Florida and looking for people who show up, work hard, and take ownership. No experience required &mdash; we train the right people.
              </p>
            </div>
          </section>

          {/* WHY NMD */}
          <section className="py-[80px] bg-white border-b border-[#E5E7EB]">
            <div className="jt-container max-w-[1440px] mx-auto px-[65px]">
              <div className="jt-why-grid grid grid-cols-4 gap-[32px]">
                <div className="flex flex-col gap-[10px]">
                  <div className="text-[26px] font-extrabold text-[#0F766E] tracking-[-0.03em]">$18&ndash;$26</div>
                  <div className="text-[14px] font-semibold text-[#111827]">Starting hourly pay</div>
                  <div className="text-[13px] text-[#6B7280] leading-[1.55]">Based on experience. Performance-based raises within 90 days.</div>
                </div>
                <div className="flex flex-col gap-[10px]">
                  <div className="text-[26px] font-extrabold text-[#0F766E] tracking-[-0.03em]">Paid</div>
                  <div className="text-[14px] font-semibold text-[#111827]">Training provided</div>
                  <div className="text-[13px] text-[#6B7280] leading-[1.55]">Paid certification in pressure washing techniques, chemical handling, and safety.</div>
                </div>
                <div className="flex flex-col gap-[10px]">
                  <div className="text-[26px] font-extrabold text-[#0F766E] tracking-[-0.03em]">Flexible</div>
                  <div className="text-[14px] font-semibold text-[#111827]">Scheduling</div>
                  <div className="text-[13px] text-[#6B7280] leading-[1.55]">Full-time, part-time, and seasonal positions available.</div>
                </div>
                <div className="flex flex-col gap-[10px]">
                  <div className="text-[26px] font-extrabold text-[#0F766E] tracking-[-0.03em]">Bonus</div>
                  <div className="text-[14px] font-semibold text-[#111827]">Performance incentives</div>
                  <div className="text-[13px] text-[#6B7280] leading-[1.55]">Referral bonuses, job completion bonuses, and customer satisfaction bonuses.</div>
                </div>
              </div>
            </div>
          </section>

          {/* OPEN POSITIONS + APPLICATION FORM */}
          <section className="py-[96px] bg-[#F8FAF9]">
            <div className="jt-positions-row jt-container max-w-[1440px] mx-auto px-[65px] flex gap-[64px] items-start">
              {/* Positions */}
              <div className="jt-positions-col" style={{ flex: '0 0 380px' }}>
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#0F766E] mb-[16px]">Open Positions</p>
                <h2 className="text-[32px] font-bold tracking-[-0.025em] text-[#111827] mb-[32px] leading-[1.1]">
                  We&apos;re hiring in Central Florida
                </h2>
                <div className="flex flex-col gap-[16px]">
                  {POSITIONS.map(pos => (
                    <div key={pos.id} className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px_22px]">
                      <div className="flex items-start justify-between gap-[12px] mb-[10px]">
                        <div className="text-[15px] font-bold text-[#111827]">{pos.title}</div>
                        <span
                          className="text-[11px] rounded-[5px] px-[8px] py-[4px] font-semibold shrink-0"
                          style={{
                            background: pos.badge === 'hiring' ? '#F0FDF9' : '#FEF3C7',
                            color: pos.badge === 'hiring' ? '#0F766E' : '#92400E',
                          }}
                        >
                          {pos.badge === 'hiring' ? 'Hiring Now' : 'Part-time'}
                        </span>
                      </div>
                      <div className="text-[13px] text-[#6B7280] mb-[8px]">{pos.type} &middot; {pos.location}</div>
                      <p className="text-[13px] text-[#374151] leading-[1.55]">{pos.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Form */}
              <div className="jt-form-col flex-1 min-w-[320px]">
                <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[36px]">
                  <h3 className="text-[22px] font-bold text-[#111827] mb-[6px] tracking-[-0.02em]">Apply Now</h3>
                  <p className="text-[14px] text-[#6B7280] mb-[28px]">We review every application. Most candidates hear back within 48 hours.</p>

                  {error && (
                    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-[14px] py-[10px] mb-[16px] text-[13px] text-[#B91C1C]">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="jt-form-grid grid grid-cols-2 gap-[16px] mb-[16px]">
                      <div>
                        <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">First Name</label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jordan" required
                          className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">Last Name</label>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Williams" required
                          className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none" />
                      </div>
                    </div>

                    <div className="jt-form-grid grid grid-cols-2 gap-[16px] mb-[16px]">
                      <div>
                        <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jordan@email.com" required
                          className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">Phone</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(407) 555-0100" required
                          className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none" />
                      </div>
                    </div>

                    <div className="mb-[16px]">
                      <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">Position of Interest</label>
                      <select value={position} onChange={e => setPosition(e.target.value)} required
                        className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] bg-white outline-none">
                        <option value="">Select a position...</option>
                        {POSITIONS.map(pos => <option key={pos.id} value={pos.title}>{pos.title}</option>)}
                        <option>Other / General Interest</option>
                      </select>
                    </div>

                    <div className="mb-[16px]">
                      <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">City / Area</label>
                      <select value={cityArea} onChange={e => setCityArea(e.target.value)}
                        className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#111827] bg-white outline-none">
                        {CITIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="mb-[16px]">
                      <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">Resume Upload</label>
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleFileSelect(e.target.files)} />
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full border-[2px] border-dashed rounded-[8px] p-[20px] flex flex-col items-center gap-[8px] cursor-pointer"
                        style={{ borderColor: '#D1FAE5', background: '#F0FDF9' }}>
                        {resumeFile ? (
                          <span className="text-[13px] font-semibold text-[#0F766E]">&#10003; {resumeFile.name}</span>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M17 13V16C17 16.6 16.6 17 16 17H4C3.4 17 3 16.6 3 16V13" stroke="#0F766E" strokeWidth="1.4" strokeLinecap="round" />
                              <path d="M10 3V13M10 3L7 6M10 3L13 6" stroke="#0F766E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[13px] font-semibold text-[#0F766E]">Click to upload resume</span>
                            <span className="text-[11px] text-[#6B7280]">PDF, DOC up to 5MB</span>
                          </>
                        )}
                      </button>
                      {resumeFile && (
                        <button type="button" onClick={() => setResumeFile(null)}
                          className="mt-[6px] bg-transparent border-none text-[#DC2626] text-[12px] cursor-pointer p-0">
                          Remove file
                        </button>
                      )}
                    </div>

                    <div className="mb-[24px]">
                      <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">
                        Tell us about yourself <span className="text-[#9CA3AF] font-normal">(optional)</span>
                      </label>
                      <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Any relevant experience, why you're interested in NMD, your availability..."
                        className="w-full px-[14px] py-[12px] border border-[#E5E7EB] rounded-[8px] text-[14px] resize-y outline-none leading-[1.55]" />
                    </div>

                    <button type="submit" disabled={submitting}
                      className="w-full text-[15px] font-semibold py-[13px] rounded-[8px] border-none tracking-[-0.01em]"
                      style={{
                        background: submitting ? '#D1FAE5' : '#0F766E',
                        color: submitting ? '#0F766E' : '#fff',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                      }}>
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-[#111827] px-[65px] py-[32px]">
            <div className="jt-footer-row jt-container max-w-[1440px] mx-auto flex items-center justify-between flex-wrap gap-[16px]">
              <div className="flex flex-col">
                <span className="text-[15px] font-bold !text-white tracking-[-0.02em]">NMD Pressure Washing</span>
                <span className="text-[9px] font-bold tracking-[0.14em] text-[#0F766E] uppercase mt-[2px]">SERVICES LLC</span>
              </div>
              <span className="text-[12px] !text-white/22">&copy; {new Date().getFullYear()} NMD Pressure Washing Services LLC</span>
            </div>
          </footer>
        </>
      )}
    </>
  )
}