"use client"
import { useEffect, useState, useCallback } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard, MetricCard, SearchInput } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"
import Link from "next/link"

type Session = {
  id: string; employeeName: string; userId: string; workDate: string
  clockInAt: string; clockOutAt: string | null; status: string
  totalMinutes: number; paidMinutes: number; breakMinutes: number; penaltyMinutes: number
}

type MySession = {
  id: string; userId: string; employeeName: string; workDate: string
  clockInAt: string; clockOutAt: string | null; status: string
  totalMinutes: number; breakMinutes: number; penaltyMinutes: number; paidMinutes: number; adminNotes: string | null
}

type BreakLog = {
  id: string; sessionId: string; breakType: string
  allowedMinutes: number; startedAt: string; endedAt: string | null
  overtimePenaltyMinutes: number; status: string
}

type EmployeeSummary = {
  userId: string; employeeName: string; sessions: Session[]
  totalPaidMins: number; totalSessions: number; activeSessions: number
}

const BREAK_OPTIONS = [
  { type: 'break_15_1', label: '☕ 15-min #1', mins: 15 },
  { type: 'break_15_2', label: '☕ 15-min #2', mins: 15 },
  { type: 'lunch_30',   label: '🍽 30-min Lunch', mins: 30 },
  { type: 'break_60',   label: '🍽 1-hr Lunch',   mins: 60 },
]

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

export default function AdminTimeclockPage() {
  // ── All-employees view ──
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // ── Personal timeclock ──
  const [mySession, setMySession] = useState<MySession | null>(null)
  const [myBreaks, setMyBreaks] = useState<BreakLog[]>([])
  const [myLoading, setMyLoading] = useState(true)
  const [myActionLoading, setMyActionLoading] = useState<string | null>(null)
  const [myMsg, setMyMsg] = useState('')
  const [myError, setMyError] = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL || ""

  const loadAll = useCallback(() => {
    const token = getNmdToken()
    fetch(`${API}/api/timeclock/admin/sessions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setSessions(Array.isArray(d) ? d : d.sessions || []); setLoading(false) })
      .catch(() => { setError("Could not load time clock data."); setLoading(false) })
  }, [API])

  const loadMe = useCallback(async () => {
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/timeclock/me`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      setMySession(d.activeSession || null)
      setMyBreaks(d.breaks || [])
    } catch { /* silent */ }
    setMyLoading(false)
  }, [API])

  useEffect(() => { loadAll(); loadMe() }, [loadAll, loadMe])

  const doMyAction = async (endpoint: string, body?: object) => {
    setMyActionLoading(endpoint)
    setMyMsg('')
    setMyError('')
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/timeclock/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      await loadMe()
      loadAll()
      if (endpoint === 'clock-in') setMyMsg('✓ Clocked in')
      if (endpoint === 'clock-out') setMyMsg('✓ Clocked out')
      if (endpoint === 'break/start') setMyMsg('✓ Break started')
      if (endpoint === 'break/end') setMyMsg('✓ Break ended')
    } catch (err) {
      setMyError(err instanceof Error ? err.message : 'Action failed')
    }
    setMyActionLoading(null)
  }

  const activeBreak = myBreaks.find(b => b.status === 'active')
  const usedBreakTypes = myBreaks.map(b => b.breakType)
  const overtimeBreak = myBreaks.find(b => b.overtimePenaltyMinutes > 0)

  const btnStyle = (color: string, disabled: boolean): React.CSSProperties => ({
    padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none',
    background: disabled ? '#E5E7EB' : color,
    color: disabled ? '#9CA3AF' : 'white',
    fontWeight: 700, fontSize: '0.875rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    opacity: disabled ? 0.7 : 1,
    transition: 'all 0.15s',
  })

  // Group by employee for overview
  const employeeMap = new Map<string, EmployeeSummary>()
  sessions.forEach(s => {
    const key = s.userId || s.employeeName
    if (!employeeMap.has(key)) {
      employeeMap.set(key, { userId: s.userId, employeeName: s.employeeName, sessions: [], totalPaidMins: 0, totalSessions: 0, activeSessions: 0 })
    }
    const emp = employeeMap.get(key)!
    emp.sessions.push(s)
    emp.totalPaidMins += s.paidMinutes || 0
    emp.totalSessions++
    if (s.status === 'open') emp.activeSessions++
  })

  const employees = Array.from(employeeMap.values())
    .filter(e => !search || e.employeeName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName))

  const totalPaidMins = sessions.filter(s => s.status === 'closed').reduce((sum, s) => sum + (s.paidMinutes || 0), 0)
  const activeSessions = sessions.filter(s => s.status === 'open').length
  const totalSessions = sessions.filter(s => s.status === 'closed').length

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>NMD Portal</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>Time Clock</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Clock yourself in/out, and view all employee hours.</p>
        </div>
        <Link href="/payroll" style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: '#0F766E', color: 'white', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          → View Payroll
        </Link>
      </div>

      {/* ── My Clock ── */}
      {!myLoading && (
        <div style={{ background: 'white', border: `1.5px solid ${mySession ? 'rgba(15,118,110,0.35)' : '#E5E7EB'}`, borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: mySession ? '1rem' : 0 }}>
            <div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                {mySession ? '🟢 You are clocked in' : '⚪ You are not clocked in'}
              </div>
              {mySession && (
                <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 3 }}>
                  Since {fmtTime(mySession.clockInAt)} · <ElapsedTimer since={mySession.clockInAt} />
                </div>
              )}
              {mySession?.adminNotes && (
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#92400E', background: '#FEF9C3', borderRadius: 6, padding: '0.5rem 0.75rem', maxWidth: 420 }}>
                  📝 Note from admin: {mySession.adminNotes}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {!mySession ? (
                <button onClick={() => doMyAction('clock-in')} disabled={!!myActionLoading} style={btnStyle('#0F766E', !!myActionLoading)}>
                  {myActionLoading === 'clock-in' ? 'Clocking in...' : '🟢 Clock In'}
                </button>
              ) : (
                <button onClick={() => doMyAction('clock-out')} disabled={!!myActionLoading} style={btnStyle('#DC2626', !!myActionLoading)}>
                  {myActionLoading === 'clock-out' ? 'Clocking out...' : '🔴 Clock Out'}
                </button>
              )}
            </div>
          </div>

          {myMsg && <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 500, marginBottom: 8 }}>{myMsg}</div>}
          {myError && <div style={{ fontSize: '0.82rem', color: '#B91C1C', marginBottom: 8 }}>{myError}</div>}

          {/* Break buttons */}
          {mySession && (
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
              {activeBreak ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: '0.82rem', color: '#92400E', fontWeight: 600 }}>
                    {BREAK_OPTIONS.find(b => b.type === activeBreak.breakType)?.label || activeBreak.breakType} — Active since {fmtTime(activeBreak.startedAt)}
                  </div>
                  <button onClick={() => doMyAction('break/end')} disabled={!!myActionLoading} style={btnStyle('#0F766E', !!myActionLoading)}>
                    {myActionLoading === 'break/end' ? 'Ending...' : '⏹ End Break'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginRight: 4 }}>Breaks:</span>
                  {BREAK_OPTIONS.map(opt => {
                    const used = usedBreakTypes.includes(opt.type)
                    const blocked = used
                      || (opt.type === 'break_60' && usedBreakTypes.length > 0)
                      || (opt.type !== 'break_60' && usedBreakTypes.includes('break_60'))
                    return (
                      <button key={opt.type}
                        onClick={() => doMyAction('break/start', { breakType: opt.type })}
                        disabled={!!myActionLoading || blocked}
                        style={{
                          padding: '0.4rem 0.85rem', borderRadius: 7, fontFamily: 'DM Sans, sans-serif',
                          border: `1.5px solid ${used ? '#E5E7EB' : 'rgba(15,118,110,0.3)'}`,
                          background: used ? '#F8FAF9' : 'rgba(15,118,110,0.06)',
                          color: used ? '#9CA3AF' : '#0F766E',
                          fontWeight: 600, fontSize: '0.8rem',
                          cursor: blocked || !!myActionLoading ? 'not-allowed' : 'pointer',
                          opacity: blocked ? 0.5 : 1,
                          textDecoration: used ? 'line-through' : 'none',
                        }}>
                        {opt.label} {used ? '✓' : ''}
                      </button>
                    )
                  })}
                  {activeBreak && (
                    <div style={{ fontSize: '0.75rem', color: '#92400E', marginLeft: 4 }}>
                      ⚠ Break ends automatically on clock-out
                    </div>
                  )}
                </div>
              )}
              {overtimeBreak && (
                <div style={{ fontSize: '0.78rem', color: '#B91C1C', marginTop: 8 }}>
                  ⚠ A break today ran over by {fmtMins(overtimeBreak.overtimePenaltyMinutes)} — this was deducted from your paid time.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '1.5rem' }}>
            <MetricCard
              label="Total Paid Hours"
              value={fmtMins(totalPaidMins)}
              sub={`${totalSessions} completed session${totalSessions !== 1 ? 's' : ''}`}
              accent="#0F766E"
            />
            <MetricCard
              label="Currently Clocked In"
              value={activeSessions}
              sub={`employee${activeSessions !== 1 ? 's' : ''} active now`}
              accent={activeSessions > 0 ? '#F59E0B' : '#9CA3AF'}
            />
            <MetricCard
              label="Employees Tracked"
              value={employees.length}
              sub="with recorded sessions"
              accent="#1D4ED8"
            />
          </div>

          {/* Search */}
          <div style={{ marginBottom: '1rem', maxWidth: 280 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search employee..." />
          </div>

          {/* Employee breakdown */}
          {employees.length === 0 ? (
            <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🕐</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#111827', marginBottom: 8 }}>No sessions recorded yet</div>
              <div style={{ fontSize: '0.875rem' }}>Sessions will appear here when employees clock in.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {employees.map(emp => {
                const isExpanded = expandedEmployee === emp.userId
                const closedSessions = emp.sessions.filter(s => s.status === 'closed')
                const hasActive = emp.activeSessions > 0
                return (
                  <div key={emp.userId} style={{ background: 'white', border: `1.5px solid ${hasActive ? 'rgba(146,64,14,0.35)' : '#E5E7EB'}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div onClick={() => setExpandedEmployee(isExpanded ? null : emp.userId)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F766E', color: 'white', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {emp.employeeName?.[0]?.toUpperCase() || 'E'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {emp.employeeName}
                            {hasActive && <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#FEF9C3', color: '#92400E' }}>● Active Now</span>}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 2 }}>{emp.totalSessions} session{emp.totalSessions !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>Total Paid</div>
                          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{fmtMins(emp.totalPaidMins)}</div>
                        </div>
                        <div style={{ color: '#9CA3AF', fontSize: '1rem' }}>{isExpanded ? '▲' : '▼'}</div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #E5E7EB', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#F8FAF9' }}>
                              {['Date', 'Clock In', 'Clock Out', 'Total', 'Break', 'Penalty', 'Paid Time', 'Status'].map(h => (
                                <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {emp.sessions.sort((a, b) => new Date(b.clockInAt).getTime() - new Date(a.clockInAt).getTime()).map(s => (
                              <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: '0.65rem 1rem', color: '#111827', fontWeight: 500 }}>{fmtDate(s.workDate || s.clockInAt)}</td>
                                <td style={{ padding: '0.65rem 1rem', color: '#374151' }}>{fmtTime(s.clockInAt)}</td>
                                <td style={{ padding: '0.65rem 1rem', color: '#374151' }}>{fmtTime(s.clockOutAt)}</td>
                                <td style={{ padding: '0.65rem 1rem', color: '#6B7280' }}>{fmtMins(s.totalMinutes)}</td>
                                <td style={{ padding: '0.65rem 1rem', color: '#6B7280' }}>{fmtMins(s.breakMinutes)}</td>
                                <td style={{ padding: '0.65rem 1rem', color: s.penaltyMinutes > 0 ? '#B91C1C' : '#9CA3AF', fontWeight: s.penaltyMinutes > 0 ? 700 : 400 }}>
                                  {s.penaltyMinutes > 0 ? fmtMins(s.penaltyMinutes) : '—'}
                                </td>
                                <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#059669' }}>{fmtMins(s.paidMinutes)}</td>
                                <td style={{ padding: '0.65rem 1rem' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: s.status === 'closed' ? '#F0FDF9' : '#FEF9C3', color: s.status === 'closed' ? '#059669' : '#92400E' }}>
                                    {s.status === 'closed' ? 'Completed' : 'Active'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            <tr style={{ background: '#F8FAF9', borderTop: '1.5px solid #E5E7EB' }}>
                              <td colSpan={6} style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#111827', fontSize: '0.82rem' }}>
                                Total ({closedSessions.length} completed session{closedSessions.length !== 1 ? 's' : ''})
                              </td>
                              <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#059669', fontFamily: 'DM Sans, sans-serif' }}>{fmtMins(emp.totalPaidMins)}</td>
                              <td />
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ padding: '0.75rem 1rem', background: '#F8FAF9', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10 }}>
                          <Link href="/payroll" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1D4ED8', textDecoration: 'none', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(29,78,216,0.2)', background: 'rgba(29,78,216,0.05)' }}>
                            → Use in Payroll
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </PortalShell>
  )
}