'use client'
import { useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { useClientPortal } from '@/hooks/useClientPortal'
import { LoadingCard, ErrorCard, DataTable, StatusBadge, money, fmtDate } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

export default function ClientQuotesPage() {
  const { data, loading, error, reload } = useClientPortal()
  const quotes = data?.quotes || []
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const handleAccept = async (quoteId: string) => {
    setActionLoading(quoteId + '-accept')
    setActionError('')
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes/${quoteId}/client-accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept quote')
      reload?.()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to accept quote')
    }
    setActionLoading(null)
  }

  const handleDecline = async (quoteId: string) => {
    setActionLoading(quoteId + '-decline')
    setActionError('')
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/quotes/${quoteId}/client-decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to decline quote')
      reload?.()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to decline quote')
    }
    setActionLoading(null)
  }

  return (
    <PortalShell requiredRole="client">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Client Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>My Quotes</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>{quotes.length} quote{quotes.length !== 1 ? 's' : ''} from NMD Pressure Washing Services LLC.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {actionError && (
        <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#c0392b' }}>
          {actionError}
        </div>
      )}
      {!loading && !error && (
        <DataTable
          headers={['Quote #', 'Service', 'Total', 'Status', 'Date', '']}
          emptyMessage="No quotes yet. Request a service to get started."
          rows={quotes.map(q => [
            <span key="num" style={{ fontWeight: 700, color: '#124d83' }}>#{q.quoteNumber}</span>,
            <span key="svc">{q.serviceType || '—'}</span>,
            <span key="total" style={{ fontWeight: 600 }}>{money(q.total)}</span>,
            <StatusBadge key="status" status={q.status} />,
            <span key="date" style={{ color: '#8494b0', whiteSpace: 'nowrap' }}>{fmtDate(q.createdAt)}</span>,
            <div key="actions" style={{ display: 'flex', gap: 6 }}>
              {q.status === 'sent' && (
                <>
                  <button onClick={() => handleAccept(q.id)} disabled={actionLoading === q.id + '-accept'} style={{ padding: '0.35rem 0.85rem', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: actionLoading === q.id + '-accept' ? 0.6 : 1 }}>
                    {actionLoading === q.id + '-accept' ? '...' : 'Accept'}
                  </button>
                  <button onClick={() => handleDecline(q.id)} disabled={actionLoading === q.id + '-decline'} style={{ padding: '0.35rem 0.85rem', borderRadius: 6, border: '1.5px solid #ffc0c0', background: 'white', color: '#e74c3c', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: actionLoading === q.id + '-decline' ? 0.6 : 1 }}>
                    {actionLoading === q.id + '-decline' ? '...' : 'Decline'}
                  </button>
                </>
              )}
              {q.status === 'accepted' && <span style={{ fontSize: '0.78rem', color: '#1f6132', fontWeight: 600 }}>Accepted</span>}
              {q.status === 'declined' && <span style={{ fontSize: '0.78rem', color: '#e74c3c', fontWeight: 600 }}>Declined</span>}
            </div>
          ])}
        />
      )}
    </PortalShell>
  )
}
