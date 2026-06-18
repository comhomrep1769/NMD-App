'use client'

import { useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'

const SCRIPTS = [
  {
    id: 1,
    situation: 'Situation 1',
    title: 'Inbound Quote Request',
    description: 'Client calls or submits a form requesting a quote for a service.',
    color: '#1f6132',
    bg: '#f0fff4',
    border: '#c0dd97',
    steps: [
      {
        label: 'Greet & Confirm',
        script: `"Thank you for calling NMD Pressure Washing Services, this is [Your Name]. I see you're interested in getting a quote — great choice! May I get your name and the address of the property?"`
      },
      {
        label: 'Qualify the Job',
        script: `"Perfect, [Name]. Can you tell me a little about what you need done? Is this a house wash, driveway, roof, or something else? And is this a residential or commercial property?"`
      },
      {
        label: 'Build Value',
        script: `"We use professional-grade equipment and eco-friendly cleaning solutions. We're fully insured and our team is trained to handle all surface types safely. Most of our clients see results that last 12–18 months."`
      },
      {
        label: 'Present the Estimate',
        script: `"Based on what you've described, I can have a detailed quote sent to you within [timeframe]. We also offer a 20% discount if you sign up for our recurring service plan — many clients find it saves them a lot over the year. Would that be something you'd be interested in?"`
      },
      {
        label: 'Close & Next Steps',
        script: `"Wonderful! I'll send that quote to [email] right now. Once you review it, you can accept it directly from our portal. Is there anything else I can help you with today?"`
      },
    ]
  },
  {
    id: 2,
    situation: 'Situation 2',
    title: 'Outbound Cold Call',
    description: 'You are calling a prospect who has not reached out to NMD before.',
    color: '#124d83',
    bg: '#e8f3fd',
    border: '#96c8f5',
    steps: [
      {
        label: 'Introduction',
        script: `"Hi, may I speak with [Name]? ... Hi [Name], my name is [Your Name] and I'm calling from NMD Pressure Washing Services in [area]. I'm not going to take much of your time — I just wanted to reach out because we've been doing a lot of work in your neighborhood lately."`
      },
      {
        label: 'Hook',
        script: `"We just finished a house wash for one of your neighbors on [street/area] and they were really happy with the results. I was wondering if you'd ever thought about getting your property cleaned up — driveways, siding, roof, anything like that?"`
      },
      {
        label: 'Handle Objections',
        script: `If they say "not interested": "I completely understand. Would it be okay if I just sent you our pricing info? No commitment, just so you have it if you ever need it in the future."\n\nIf they say "too expensive": "We actually offer very competitive rates, and if you'd be open to a recurring plan, you'd save 20% on every visit. Would it help if I sent you a free quote just to compare?"`
      },
      {
        label: 'Set the Appointment / Get Info',
        script: `"Great! I'd love to get you a free, no-obligation quote. Can I get the address of your property and a good email to send it to? It'll only take a minute and there's no pressure whatsoever."`
      },
      {
        label: 'Close the Call',
        script: `"Perfect, I'll get that over to you today. You'll receive an email from NMD with your quote — feel free to reply directly if you have any questions. Thanks so much for your time, [Name], have a great day!"`
      },
    ]
  },
  {
    id: 3,
    situation: 'Situation 3',
    title: 'Inbound from Marketing Materials',
    description: 'Client calls after seeing a flyer, door hanger, social media post, or ad.',
    color: '#6b21a8',
    bg: '#f3e8ff',
    border: '#d8b4fe',
    steps: [
      {
        label: 'Greet & Reference the Ad',
        script: `"Thank you for calling NMD Pressure Washing Services, this is [Your Name]! Are you calling about the [flyer/special offer/social media post] you saw? Great — you're definitely calling at the right time."`
      },
      {
        label: 'Confirm the Offer',
        script: `"Just to confirm, we are currently offering [mention the specific offer — e.g., 15% off first service, free driveway with house wash, etc.]. That offer is still available and I can lock it in for you today if you'd like."`
      },
      {
        label: 'Gather Details',
        script: `"To get you an accurate quote, can I get the property address and what service you're most interested in? Also, is this for a home or a business?"`
      },
      {
        label: 'Upsell the Recurring Plan',
        script: `"Since you came in through our promotion, I also want to let you know about our recurring service plan — clients who sign up save 20% on every future visit automatically. A lot of people combine the promo with the recurring plan and really maximize their savings. Would you like me to include that in your quote?"`
      },
      {
        label: 'Close & Confirm',
        script: `"Perfect! I'm sending your quote to [email] right now. You can accept it directly from the link in the email — it's super easy. We'll also give you a call before the scheduled date to confirm. Is there anything else I can help with?"`
      },
    ]
  }
]

export default function SalesCallScriptsPage() {
  const [activeScript, setActiveScript] = useState(1)
  const [expandedStep, setExpandedStep] = useState<number | null>(0)
  const script = SCRIPTS.find(s => s.id === activeScript)!

  return (
    <PortalShell requiredRole="sales">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Sales Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>Call Scripts</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Use these scripts to guide your calls. Adapt naturally — don't read word for word.</p>
      </div>

      {/* Script selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {SCRIPTS.map(s => (
          <button key={s.id} onClick={() => { setActiveScript(s.id); setExpandedStep(0) }}
            style={{ padding: '0.65rem 1.25rem', borderRadius: 10, border: `1.5px solid ${activeScript === s.id ? s.color : '#dde4ef'}`, background: activeScript === s.id ? s.bg : 'white', color: activeScript === s.id ? s.color : '#5a6a88', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
            {s.situation}: {s.title}
          </button>
        ))}
      </div>

      {/* Active script */}
      <div style={{ background: 'white', border: `1.5px solid ${script.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', background: script.bg, borderBottom: `1px solid ${script.border}` }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: script.color, marginBottom: 4 }}>{script.situation}</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#0e1117', marginBottom: 6 }}>{script.title}</div>
          <div style={{ fontSize: '0.85rem', color: '#5a6a88' }}>{script.description}</div>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {script.steps.map((step, i) => (
              <div key={i} style={{ border: `1.5px solid ${expandedStep === i ? script.border : '#dde4ef'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                <div onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', cursor: 'pointer', background: expandedStep === i ? script.bg : 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: expandedStep === i ? script.color : '#dde4ef', color: expandedStep === i ? 'white' : '#8494b0', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0e1117' }}>{step.label}</span>
                  </div>
                  <span style={{ color: '#8494b0', fontSize: '0.85rem' }}>{expandedStep === i ? '▲' : '▼'}</span>
                </div>
                {expandedStep === i && (
                  <div style={{ padding: '1rem', borderTop: `1px solid ${script.border}`, background: 'white' }}>
                    {step.script.split('\n\n').map((para, pi) => (
                      <p key={pi} style={{ fontSize: '0.9rem', color: '#0e1117', lineHeight: 1.7, marginBottom: pi < step.script.split('\n\n').length - 1 ? '0.75rem' : 0, fontStyle: para.startsWith('If') ? 'normal' : 'normal' }}>
                        {para.startsWith('If') ? (
                          <span style={{ color: '#5a6a88', fontStyle: 'italic' }}>{para}</span>
                        ) : para}
                      </p>
                    ))}
                    <button onClick={() => navigator.clipboard?.writeText(step.script)}
                      style={{ marginTop: 12, padding: '0.4rem 0.9rem', borderRadius: 7, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      📋 Copy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{ marginTop: '1.5rem', background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '1.25rem' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117', marginBottom: '1rem' }}>💡 Sales Tips</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {[
            { tip: 'Always use the client\'s name', detail: 'People respond better when you use their name naturally in conversation.' },
            { tip: 'Listen more than you talk', detail: 'Ask questions and let the client tell you what they need before pitching.' },
            { tip: 'Push the recurring plan', detail: 'It\'s a win-win — client saves 20%, you earn residual commission for months.' },
            { tip: 'Commission is on collected subtotal', detail: 'Only counts after the invoice is paid. Tax, fees, and discounts are excluded.' },
          ].map(t => (
            <div key={t.tip} style={{ background: '#f4f7fb', borderRadius: 8, padding: '0.85rem', border: '1px solid #dde4ef' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0e1117', marginBottom: 4 }}>✓ {t.tip}</div>
              <div style={{ fontSize: '0.78rem', color: '#8494b0', lineHeight: 1.5 }}>{t.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  )
}