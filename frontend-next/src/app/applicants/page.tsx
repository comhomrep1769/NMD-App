'use client'

import { useEffect, useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard, SectionHeader } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type Applicant = {
  id: string; fullName: string; email: string; phone: string | null
  position: string; message: string | null; resumeDataUrl: string | null
  resumeFileName: string | null; status: string; adminNotes: string | null; createdAt: string
}

const STATUS_OPTIONS = ['new', 'reviewed', 'interview', 'hired', 'rejected']

const statusStyle = (status: string): React.CSSProperties => {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    new:       { color: '#124d83', bg: '#e8f3fd', border: '#96c8f5' },
    reviewed:  { color: '#7a5c00', bg: '#fff9e6', border: '#f5e6a0' },
    interview: { color: '#6b21a8', bg: '#f3e8ff', border: '#d8b4fe' },
    hired:     { color: '#1f6132', bg: '#f0fff4', border: '#c0dd97' },
    rejected:  { color: '#c0392b', bg: '#fff0f0', border: '#ffc0c0' },
  }
  const s = map[status] || map.new
  return { fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 100, color: s.color, background: s.bg, border: `1px solid ${s.border}` }
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Applicant | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const load = () => {
    const token = getNmdToken()
    fetch(`${API}/api/applicants`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setApplicants(d.applicants || []); setLoading(false) })
      .catch(() => { setError('Could not load applicants.'); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (applicant: Applicant, status: string) => {
    setUpdatingId(applicant.id)
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/applicants/${applicant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setApplicants(p => p.map(a => a.id === applicant.id ? data.applicant : a))
      if (selected?.id === applicant.id) setSelected(data.applicant)
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setUpdatingId(null)
  }

  const handleSaveNotes = async () => {
    if (!selected) return
    setUpdatingId(selected.id)
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/applicants/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminNotes: notes })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setApplicants(p => p.map(a => a.id === selected.id ? data.applicant : a))
      setSelected(data.applicant)
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setUpdatingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this applicant? This cannot be undone.')) return
    setDeletingId(id)
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/applicants/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      setApplicants(p => p.filter(a => a.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
    setDeletingId(null)
  }

  const filtered = applicants.filter(a => statusFilter === 'all' || a.status === statusFilter)

  const counts: Record<string, number> = { all: applicants.length }
  STATUS_OPTIONS.forEach(s => { counts[s] = applicants.filter(a => a.status === s).length })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.9rem', borderRadius: 8,
    border: '1.5px solid #dde4ef', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#0e1117', background: '#f4f7fb', boxSizing: 'border-box',
  }

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <SectionHeader
        title="Applicants"
        sub={`${applicants.length} total applications`}
        action={
          <a href="/join" target="_blank" rel="noopener noreferrer"
            style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            View Join Page ↗
          </a>
        }
      />

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Left — list */}
          <div style={{ flex: 1, minWidth: 300 }}>
            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
              {['all', ...STATUS_OPTIONS].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ padding: '0.35rem 0.85rem', borderRadius: 20, border: `1.5px solid ${statusFilter === s ? '#124d83' : '#dde4ef'}`, background: statusFilter === s ? '#e8f3fd' : 'white', color: statusFilter === s ? '#124d83' : '#5a6a88', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s] || 0})
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8494b0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#0e1117', marginBottom: 8 }}>No applicants yet</div>
                <div style={{ fontSize: '0.875rem' }}>Applications submitted via the Join page will appear here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map(a => (
                  <div key={a.id}
                    onClick={() => { setSelected(a); setNotes(a.adminNotes || '') }}
                    style={{ background: 'white', border: `1.5px solid ${selected?.id === a.id ? '#124d83' : '#dde4ef'}`, borderRadius: 12, padding: '1rem', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0e1117' }}>{a.fullName}</div>
                      <span style={statusStyle(a.status)}>{a.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#124d83', marginBottom: 2 }}>{a.position}</div>
                    <div style={{ fontSize: '0.78rem', color: '#8494b0' }}>{a.email} · {fmtDate(a.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — detail panel */}
          {selected && (
            <div style={{ width: 340, background: 'white', border: '1.5px solid #dde4ef', borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#0e1117' }}>{selected.fullName}</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#8494b0' }}>×</button>
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Position', value: selected.position },
                    { label: 'Email', value: selected.email },
                    { label: 'Phone', value: selected.phone || 'Not provided' },
                    { label: 'Applied', value: fmtDate(selected.createdAt) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8494b0', minWidth: 60, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: 2 }}>{label}</span>
                      <span style={{ fontSize: '0.85rem', color: '#0e1117', flex: 1 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Message */}
                {selected.message && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 6 }}>Message</div>
                    <div style={{ fontSize: '0.85rem', color: '#3a4660', background: '#f4f7fb', borderRadius: 8, padding: '0.75rem', lineHeight: 1.6 }}>{selected.message}</div>
                  </div>
                )}

                {/* Resume */}
                {selected.resumeDataUrl && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 6 }}>Resume</div>
                    <a href={selected.resumeDataUrl} download={selected.resumeFileName || 'resume'}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: '#f4f7fb', color: '#124d83', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>
                      ⬇ {selected.resumeFileName || 'Download Resume'}
                    </a>
                  </div>
                )}

                {/* Status */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 6 }}>Status</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} onClick={() => handleStatusChange(selected, s)}
                        disabled={updatingId === selected.id}
                        style={{ padding: '0.35rem 0.75rem', borderRadius: 20, border: `1.5px solid ${selected.status === s ? '#124d83' : '#dde4ef'}`, background: selected.status === s ? '#e8f3fd' : 'white', color: selected.status === s ? '#124d83' : '#5a6a88', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin notes */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8494b0', marginBottom: 6 }}>Admin Notes</div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add notes about this applicant..."
                    style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontSize: '0.82rem' }}
                  />
                  <button onClick={handleSaveNotes} disabled={updatingId === selected.id}
                    style={{ marginTop: 6, padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: updatingId === selected.id ? 0.6 : 1 }}>
                    {updatingId === selected.id ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>

                {/* Delete */}
                <button onClick={() => handleDelete(selected.id)} disabled={deletingId === selected.id}
                  style={{ padding: '0.6rem', borderRadius: 8, border: '1.5px solid #ffc0c0', background: '#fff0f0', color: '#c0392b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: deletingId === selected.id ? 0.6 : 1 }}>
                  {deletingId === selected.id ? 'Deleting...' : 'Delete Applicant'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PortalShell>
  )
}