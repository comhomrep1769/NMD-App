'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Job = {
  id: string; title: string; client_name: string; address: string
  start_time: string | null; end_time: string | null
  status: string; notes: string | null; created_at: string
  assigned_employees: Array<{ id: string; displayName: string }>
}

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimedCount, setClaimedCount] = useState(0)
  const API = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/jobs/board`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setJobs(d.jobs || []); setLoading(false) })
      .catch(() => { setError('Could not load job board.'); setLoading(false) })
  }, [])

  const handleClaim = async (jobId: string) => {
    setClaimingId(jobId)
    try {
      const token = getNmdToken()
      const res = await fetch(`${API}/api/jobs/${jobId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to claim job')
      setJobs(p => p.filter(j => j.id !== jobId))
      setClaimedCount(c => c + 1)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to claim job')
    }
    setClaimingId(null)
  }

  const fmt = (dt: string | null) => {
    if (!dt) return '—'
    const d = new Date(dt)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f6132', marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: '#0e1117', letterSpacing: '-0.03em', marginBottom: 6 }}>Job Board</h1>
        <p style={{ color: '#5a6a88', fontSize: '0.875rem' }}>Available jobs you can claim. Once claimed the job appears on your schedule.</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && jobs.length === 0 && (
        <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8494b0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>No available jobs right now</div>
          <div style={{ fontSize: '0.875rem' }}>Check back later or contact your admin for assignments.</div>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map(job => (
            <div key={job.id} style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '1.5rem', boxShadow: '0 2px 8px rgba(14,17,23,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117', marginBottom: 6 }}>{job.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#5a6a88', marginBottom: 4 }}><span style={{ fontWeight: 500 }}>Client:</span> {job.client_name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#5a6a88', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>Address:</span> {job.address}
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, fontSize: '0.78rem', color: '#124d83', fontWeight: 600, textDecoration: 'none' }}>
                      Get Directions
                    </a>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#5a6a88', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>When:</span> {fmt(job.start_time)}{job.end_time ? ` — ${fmt(job.end_time)}` : ''}
                  </div>
                  {job.notes && (
                    <div style={{ fontSize: '0.82rem', color: '#8494b0', marginTop: 6, background: '#f4f7fb', borderRadius: 6, padding: '0.5rem 0.75rem', border: '1px solid #dde4ef' }}>
                      <span style={{ fontWeight: 500 }}>Notes:</span> {job.notes}
                    </div>
                  )}
                  {job.assigned_employees.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#8494b0', marginTop: 6 }}>
                      Also assigned: {job.assigned_employees.map(e => e.displayName).join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleClaim(job.id)}
                  disabled={claimingId === job.id}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: claimingId === job.id ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: claimingId === job.id ? 0.7 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {claimingId === job.id ? 'Claiming...' : 'Claim Job'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {claimedCount > 0 && (
        <div style={{ marginTop: '1.5rem', background: '#f0fff4', border: '1.5px solid #c0dd97', borderRadius: 10, padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#1f6132', fontWeight: 500 }}>
          You claimed {claimedCount} job{claimedCount > 1 ? 's' : ''} this session. Check your schedule to view them.
        </div>
      )}
    </PortalShell>
  )
}
