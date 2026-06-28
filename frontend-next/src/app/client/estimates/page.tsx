'use client'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, StatusBadge, fmtDate } from '@/components/portal/PortalUI'
import { useState } from 'react'
import Link from 'next/link'

const ROW_COLS = '120px 1fr 140px 24px'

export default function ClientEstimatesPage() {
  const { data, loading, error } = useClientPortal()
  const requests = data?.serviceRequests || []
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <PortalShell requiredRole="client">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Client Portal</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>My Estimates</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Service requests and Guru-assisted estimates submitted for admin review.</p>
        </div>
        <Link href="/client/request-service" style={{ display: 'inline-flex', alignItems: 'center', background: '#0F766E', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: 7, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          + New Request
        </Link>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && requests.length === 0 && (
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F0FDF9', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #E5E7EB' }}>📋</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: 8 }}>No estimates yet</div>
          <div style={{ fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
            Submit a service request and NMD will review it and send you a quote.
          </div>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: ROW_COLS, gap: 12, background: '#F9FAFB', padding: '10px 16px', borderBottom: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF' }}>Date</span>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF' }}>Service</span>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF' }}>Status</span>
            <span />
          </div>

          {requests.map(r => {
            const isOpen = expandedId === r.id
            const hasDetail = !!(r.address || r.preferredDate || r.notes || r.photoDataUrl)
            return (
              <div key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <div
                  onClick={() => hasDetail && setExpandedId(isOpen ? null : r.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: ROW_COLS, gap: 12, alignItems: 'center',
                    padding: '12px 16px', cursor: hasDetail ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>{fmtDate(r.createdAt)}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{r.serviceType}</span>
                  <StatusBadge status={r.status} />
                  {hasDetail && (
                    <span style={{ color: '#9CA3AF', fontSize: '0.8rem', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  )}
                </div>

                {isOpen && hasDetail && (
                  <div style={{ padding: '0 16px 16px', background: '#F9FAFB' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {r.address && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 3 }}>Address</div>
                          <div style={{ fontSize: '0.875rem', color: '#374151' }}>{r.address}</div>
                        </div>
                      )}
                      {r.preferredDate && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 3 }}>Preferred Date</div>
                          <div style={{ fontSize: '0.875rem', color: '#374151' }}>{fmtDate(r.preferredDate)}{r.preferredTime ? ` · ${r.preferredTime}` : ''}</div>
                        </div>
                      )}
                      {r.notes && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 3 }}>Notes</div>
                          <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>{r.notes}</div>
                        </div>
                      )}
                    </div>
                    {r.photoDataUrl && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>Photo Attached</div>
                        <img
                          src={r.photoDataUrl}
                          alt={r.photoNote || 'Job photo'}
                          style={{ width: '100%', maxWidth: 320, borderRadius: 10, border: '1.5px solid #E5E7EB', objectFit: 'cover', maxHeight: 200 }}
                        />
                        {r.photoNote && <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 6 }}>{r.photoNote}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PortalShell>
  )
}