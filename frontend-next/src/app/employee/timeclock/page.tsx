"use client"
import { useEffect, useState, useCallback } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Session = {
  id: string; userId: string; employeeName: string
  workDate: string; clockInAt: string; clockOutAt: string | null
  status: string; totalMinutes: number; breakMinutes: number
  penaltyMinutes: number; paidMinutes: number; adminNotes: string | null
}

type BreakLog = {
  id: string; sessionId: string; breakType: string
  allowedMinutes: number; startedAt: string; endedAt: string | null
  overtimePenaltyMinutes: number; status: string
}

type HistorySession = Session

function fmtMins(mins: number) {
  if (!mins || mins <= 0) return '0h 0m'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return `${h}h ${m}m`
}

function fmtTime(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtDate(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(since).getTime()
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [since])
  return <span>{elapsed}</span>
}

const BREAK_OPTIONS = [
  { type: 'break_15_1', label: '☕ 15-min Break #1', mins: 15 },
  { type: 'break_15_2', label: '☕ 15-min Break #2', mins: 15 },
  { type: 'lunch_30',   label: '🍽 30-min Lunch',    mins: 30 },
  { type: 'break_60',   label: '🍽 1-hour Lunch',     mins: 60 },
]

export default function EmployeeTimeclock() {
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [breaks, setBreaks] = useState<BreakLog[]>([])
  const [history, setHistory] = useState<HistorySession[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const load = useCallback(async () => {
    const token = getNmdToken()
    try {
      const [meRes, histRes] = await Promise.all([
        fetch(`${API}/api/timeclock/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/timeclock/my-history`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const meData = await meRes.json()
      const histData = await histRes.json()
      setActiveSession(meData.activeSession || null)
      setBreaks(meData.breaks || [])
      setHistory(histData.sessions || [])
    } catch {
      setError('Could not load timeclock data.')
    }
    setLoading(false)
  }, [API])

  useEffect(() => { load() }, [load])

  const doAction = async (endpoint: string, body?: object) => {
    setActionLoading(endpoint)
    setMsg('')
    setError('')
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/timeclock/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      await load()
      if (endpoint === 'clock-in') setMsg('✓ Clocked in successfully')
      if (endpoint === 'clock-out') setMsg('✓ Clocked out successfully')
      if (endpoint === 'break/start') setMsg('✓ Break started')
      if (endpoint === 'break/end') setMsg('✓ Break ended')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    }
    setActionLoading(null)
  }

  const totalPaidMins = history
    .filter(s => s.status === 'closed')
    .reduce((sum, s) => sum + (s.paidMinutes || 0), 0)

  const activeBreak = breaks.find(b => b.status === 'active')
  const usedBreakTypes = breaks.map(b => b.breakType)

  const btnStyle = (color: string, disabled: boolean): React.CSSProperties => ({
    padding: '0.75rem 1.5rem', borderRadius: 10, border: 'none',
    background: disabled ? '#E5E7EB' : color,
    color: disabled ? '#9CA3AF' : 'white',
    fontWeight: 700, fontSize: '0.95rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    opacity: disabled ? 0.7 : 1,
    transition: 'all 0.15s',
  })

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>Time Clock</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Clock in, manage breaks, and view your hours.</p>
      </div>

      {loading && <LoadingCard />}

      {!loading && (
        <>
          {/* ── Total Hours Card ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.25rem', borderTop: '3px solid #0F766E' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>Total Hours Logged</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{fmtMins(totalPaidMins)}</div>
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 4 }}>paid time · {history.filter(s => s.status === 'closed').length} sessions</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.25rem', borderTop: `3px solid ${activeSession ? '#F59E0B' : '#E5E7EB'}` }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>Current Session</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: activeSession ? '#F59E0B' : '#9CA3AF', letterSpacing: '-0.02em' }}>
                {activeSession ? <ElapsedTimer since={activeSession.clockInAt} /> : '—'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 4 }}>
                {activeSession ? `clocked in at ${fmtTime(activeSession.clockInAt)}` : 'not clocked in'}
              </div>
            </div>
            {activeSession && (
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.25rem', borderTop: '3px solid #1D4ED8' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>Break Time Used</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: '#1D4ED8', letterSpacing: '-0.02em' }}>{fmtMins(activeSession.breakMinutes)}</div>
                <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 4 }}>{breaks.filter(b => b.status === 'completed').length} break{breaks.filter(b => b.status === 'completed').length !== 1 ? 's' : ''} taken</div>
              </div>
            )}
          </div>

          {/* ── Messages ── */}
          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#B91C1C' }}>{error}</div>}
          {msg && <div style={{ background: '#F0FDF9', border: '1px solid #A7F3D0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#059669', fontWeight: 500 }}>{msg}</div>}

          {/* ── Clock In / Out ── */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '1rem' }}>
              {activeSession ? '🟢 Currently Clocked In' : '⚪ Not Clocked In'}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {!activeSession ? (
                <button
                  onClick={() => doAction('clock-in')}
                  disabled={!!actionLoading}
                  style={btnStyle('#0F766E', !!actionLoading)}
                >
                  {actionLoading === 'clock-in' ? 'Clocking in...' : '🟢 Clock In'}
                </button>
              ) : (
                <button
                  onClick={() => doAction('clock-out')}
                  disabled={!!actionLoading}
                  style={btnStyle('#DC2626', !!actionLoading)}
                >
                  {actionLoading === 'clock-out' ? 'Clocking out...' : '🔴 Clock Out'}
                </button>
              )}
            </div>
            {activeBreak && (
              <div style={{ marginTop: 10, fontSize: '0.82rem', color: '#92400E' }}>
                ⚠ Active break will be ended automatically when you clock out.
              </div>
            )}
            {activeSession?.adminNotes && (
              <div style={{ marginTop: 10, background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.82rem', color: '#1D4ED8' }}>
                <strong>Admin note:</strong> {activeSession.adminNotes}
              </div>
            )}
          </div>

          {/* ── Break Buttons ── */}
          {activeSession && (
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 4 }}>Breaks</div>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '1rem' }}>
                2 × 15-min breaks, plus either a 30-min or 1-hour lunch. Each can only be used once.
              </div>

              {activeBreak && (
                <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 10, padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem' }}>
                      {BREAK_OPTIONS.find(b => b.type === activeBreak.breakType)?.label || activeBreak.breakType} — Active
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 2 }}>
                      Started at {fmtTime(activeBreak.startedAt)} · {activeBreak.allowedMinutes} min allowed
                    </div>
                  </div>
                  <button
                    onClick={() => doAction('break/end')}
                    disabled={!!actionLoading}
                    style={btnStyle('#1D4ED8', !!actionLoading)}
                  >
                    {actionLoading === 'break/end' ? 'Ending...' : '⏹ End Break'}
                  </button>
                </div>
              )}

              {!activeBreak && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {BREAK_OPTIONS.map(opt => {
                    const used = usedBreakTypes.includes(opt.type)
                    const blocked = used
                      || (opt.type === 'break_60' && usedBreakTypes.length > 0)
                      || (opt.type !== 'break_60' && usedBreakTypes.includes('break_60'))
                      || (usedBreakTypes.includes('lunch_30') && opt.type === 'break_60')
                    return (
                      <button
                        key={opt.type}
                        onClick={() => doAction('break/start', { breakType: opt.type })}
                        disabled={!!actionLoading || blocked}
                        style={{
                          padding: '0.6rem 1rem', borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
                          border: `1px solid ${used ? '#E5E7EB' : '#A7F3D0'}`,
                          background: used ? '#F8FAF9' : '#F0FDF9',
                          color: used ? '#9CA3AF' : '#059669',
                          fontWeight: 600, fontSize: '0.85rem',
                          cursor: blocked || !!actionLoading ? 'not-allowed' : 'pointer',
                          opacity: blocked ? 0.5 : 1,
                          textDecoration: used ? 'line-through' : 'none',
                        }}
                      >
                        {opt.label} {used ? '✓' : ''}
                      </button>
                    )
                  })}
                </div>
              )}

              {breaks.filter(b => b.status === 'completed').length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>Breaks Taken</div>
                  {breaks.filter(b => b.status === 'completed').map(b => (
                    <div key={b.id} style={{ display: 'flex', gap: 10, fontSize: '0.82rem', color: '#6B7280', marginBottom: 4, alignItems: 'center' }}>
                      <span style={{ color: '#059669' }}>✓</span>
                      <span>{BREAK_OPTIONS.find(o => o.type === b.breakType)?.label || b.breakType}</span>
                      <span style={{ color: '#9CA3AF' }}>{fmtTime(b.startedAt)} — {fmtTime(b.endedAt)}</span>
                      {b.overtimePenaltyMinutes > 0 && (
                        <span style={{ color: '#B91C1C', fontSize: '0.75rem' }}>+{b.overtimePenaltyMinutes}m penalty</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Session History ── */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.5rem' }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '1rem' }}>Session History</div>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: '0.875rem' }}>No sessions recorded yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      {['Date', 'Clock In', 'Clock Out', 'Total', 'Break', 'Paid Time', 'Status', 'Notes'].map(h => (
                        <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#111827', fontWeight: 500 }}>{fmtDate(s.workDate || s.clockInAt)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#374151' }}>{fmtTime(s.clockInAt)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#374151' }}>{fmtTime(s.clockOutAt)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#6B7280' }}>{fmtMins(s.totalMinutes)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#6B7280' }}>{fmtMins(s.breakMinutes)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0F766E' }}>{fmtMins(s.paidMinutes)}</td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: s.status === 'closed' ? '#F0FDF9' : '#FEF9C3', color: s.status === 'closed' ? '#059669' : '#92400E', border: `1px solid ${s.status === 'closed' ? '#A7F3D0' : '#FDE68A'}` }}>
                            {s.status === 'closed' ? 'Completed' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#6B7280', fontSize: '0.8rem' }}>{s.adminNotes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PortalShell>
  )
}