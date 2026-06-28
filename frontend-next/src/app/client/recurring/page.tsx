'use client'
import { useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

const FREQUENCIES = [
  { value: 'weekly',    label: 'Weekly',    discount: '20% off every visit' },
  { value: 'biweekly', label: 'Bi-Weekly',  discount: '20% off every visit' },
  { value: 'monthly',  label: 'Monthly',    discount: '20% off every visit' },
  { value: 'quarterly',label: 'Quarterly',  discount: '20% off every visit' },
]

export default function ClientRecurringPage() {
  const { data, loading, error, reload } = useClientPortal()
  const services = data?.recurringServices || []
  const invoices = (data?.invoices || []).filter(i => i.status === 'paid')

  const [showOptIn, setShowOptIn] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [saving, setSaving] = useState(false)
  const [optInError, setOptInError] = useState('')
  const [optInSuccess, setOptInSuccess] = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const handleOptIn = async () => {
    if (!selectedInvoice || !frequency) {
      setOptInError('Please select a service and frequency.')
      return
    }
    setSaving(true)
    setOptInError('')
    const token = getNmdToken()
    const invoice = invoices.find(i => i.id === selectedInvoice)
    try {
      const res = await fetch(`${API}/api/recurring/client-optin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          serviceType: invoice?.jobName || 'Service',
          frequency,
          source: 'client_portal',
          invoiceId: selectedInvoice,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to opt in')
      setOptInSuccess(`✓ You're now enrolled in ${frequency} ${invoice?.jobName || 'service'}! You'll save 20% on every future visit.`)
      setShowOptIn(false)
      setSelectedInvoice('')
      setFrequency('monthly')
      reload()
    } catch (err) {
      setOptInError(err instanceof Error ? err.message : 'Failed to opt in')
    }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
    border: '1.5px solid #E5E7EB', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#111827',
    background: '#fff', boxSizing: 'border-box',
  }

  return (
    <PortalShell requiredRole="client">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Client Portal</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>Recurring Plan</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Save 20% on every visit by enrolling in a recurring service plan.</p>
        </div>
        <a href="/client/request-service" style={{
          padding: '0.6rem 1.25rem', borderRadius: 8,
          background: '#0F766E',
          color: 'white', fontWeight: 700, fontSize: '0.875rem',
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          + Request a New Service
        </a>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {/* Success message */}
      {optInSuccess && (
        <div style={{ background: '#F0FDF9', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#059669', fontWeight: 500 }}>
          {optInSuccess}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Savings banner */}
          <div style={{ background: '#F0FDF9', border: '1.5px solid rgba(15,118,110,0.15)', borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2rem' }}>🔄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 4 }}>Save 20% with a recurring plan</div>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5 }}>
                Enroll any completed service into a recurring schedule. Your first visit is at standard price — every visit after saves you 20%.
              </div>
            </div>
            {invoices.length > 0 && (
              <button
                onClick={() => { setShowOptIn(true); setOptInError(''); setOptInSuccess('') }}
                style={{ padding: '0.65rem 1.25rem', borderRadius: 8, border: 'none', background: '#0F766E', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
              >
                + Enroll a Service
              </button>
            )}
          </div>

          {/* Opt-in modal */}
          {showOptIn && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div style={{ background: 'white', borderRadius: 10, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(17,24,39,0.15)', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Enroll in Recurring Service</div>
                  <button onClick={() => setShowOptIn(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {optInError && (
                    <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#B91C1C' }}>{optInError}</div>
                  )}

                  {/* Pick a completed service */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      Select a completed service to enroll *
                    </label>
                    {invoices.length === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: '#9CA3AF', padding: '0.75rem', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                        No paid invoices found. Complete a service first to enroll in recurring.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {invoices.map(inv => (
                          <label key={inv.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '0.75rem 1rem', borderRadius: 8, cursor: 'pointer',
                            border: `1.5px solid ${selectedInvoice === inv.id ? '#0F766E' : '#E5E7EB'}`,
                            background: selectedInvoice === inv.id ? 'rgba(15,118,110,0.06)' : 'white',
                            transition: 'all 0.15s',
                          }}>
                            <input
                              type="radio"
                              name="invoice"
                              value={inv.id}
                              checked={selectedInvoice === inv.id}
                              onChange={() => setSelectedInvoice(inv.id)}
                              style={{ accentColor: '#0F766E', width: 16, height: 16 }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{inv.jobName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 2 }}>Invoice #{inv.invoiceNumber} · {money(inv.total)} · {fmtDate(inv.createdAt)}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Frequency picker */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      How often would you like this service? *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {FREQUENCIES.map(f => (
                        <label key={f.value} style={{
                          display: 'flex', flexDirection: 'column', gap: 4,
                          padding: '0.85rem 1rem', borderRadius: 8, cursor: 'pointer',
                          border: `1.5px solid ${frequency === f.value ? '#0F766E' : '#E5E7EB'}`,
                          background: frequency === f.value ? 'rgba(15,118,110,0.06)' : 'white',
                          transition: 'all 0.15s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="radio"
                              name="frequency"
                              value={f.value}
                              checked={frequency === f.value}
                              onChange={() => setFrequency(f.value)}
                              style={{ accentColor: '#0F766E', width: 14, height: 14 }}
                            />
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{f.label}</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#0F766E', paddingLeft: 22 }}>{f.discount}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#F0FDF9', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#059669', lineHeight: 1.5 }}>
                    🎉 After enrolling, NMD will reach out to confirm your recurring schedule. You'll save 20% on every future visit automatically.
                  </div>
                </div>

                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowOptIn(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Cancel
                  </button>
                  <button onClick={handleOptIn} disabled={saving || !selectedInvoice}
                    style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: selectedInvoice && !saving ? '#0F766E' : '#E5E7EB', color: selectedInvoice && !saving ? 'white' : '#9CA3AF', fontWeight: 700, cursor: selectedInvoice && !saving ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif' }}>
                    {saving ? 'Enrolling...' : '✓ Enroll in Recurring Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active recurring plans */}
          {services.length === 0 ? (
            <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#111827', marginBottom: 8 }}>No recurring plan active</div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {invoices.length > 0
                  ? 'You have completed services — click "Enroll a Service" above to start saving 20% on every visit.'
                  : 'Start a recurring plan after your first service and save 20% on every future visit.'}
              </div>
              {invoices.length === 0 && (
                <a href="/client/request-service" style={{ display: 'inline-block', padding: '0.6rem 1.25rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                  Request a New Service
                </a>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>
                Active Plans ({services.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {services.map(s => (
                  <div key={s.id} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{s.serviceType}</div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ background: '#F3F4F6', borderRadius: 8, padding: '10px 16px' }}>
                        <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Frequency</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: 3, textTransform: 'capitalize' }}>{s.frequency}</div>
                      </div>
                      <div style={{ background: '#F3F4F6', borderRadius: 8, padding: '10px 16px' }}>
                        <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F766E', marginTop: 3 }}>{money(s.price)}</div>
                      </div>
                      <div style={{ background: '#F0FDF9', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 16px' }}>
                        <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Service</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: 3 }}>{s.nextServiceDate ? fmtDate(s.nextServiceDate) : 'TBD — NMD will confirm'}</div>
                      </div>
                      <div style={{ background: '#F3F4F6', borderRadius: 8, padding: '10px 16px' }}>
                        <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Savings</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginTop: 3 }}>20% off every visit</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </PortalShell>
  )
}