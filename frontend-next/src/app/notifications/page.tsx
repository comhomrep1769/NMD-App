'use client'

import { useState } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import NotificationSettings from '@/components/portal/NotificationSettings'
import { getNmdToken } from '@/lib/authStorage'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://nmd-backend.onrender.com'

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #DDD8CF',
  borderRadius: 10,
  padding: '1.25rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '0.6rem 0.85rem',
  borderRadius: 10,
  border: '1.5px solid #DDD8CF',
  fontSize: '1rem',
  fontFamily: 'DM Sans, sans-serif',
  color: '#0C1614',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#4A4741',
  marginBottom: 6,
}

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'client', label: 'Clients' },
  { value: 'employee', label: 'Employees' },
  { value: 'sales', label: 'Sales team' },
  { value: 'admin', label: 'Admins' },
]

export default function NotificationsAdminPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [role, setRole] = useState('all')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const audienceLabel = AUDIENCES.find(a => a.value === role)?.label || 'Everyone'

  const send = async () => {
    setSending(true)
    setError('')
    setResult('')
    try {
      const res = await fetch(`${API}/api/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getNmdToken()}`,
        },
        body: JSON.stringify({ title, body, url, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send.')
      setResult(
        data.recipients === 0
          ? 'Nobody in that group has notifications turned on yet, so nothing was sent.'
          : `Sent to ${data.sent} of ${data.recipients} ${data.recipients === 1 ? 'person' : 'people'}.`
      )
      setTitle('')
      setBody('')
      setUrl('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send.')
    } finally {
      setSending(false)
      setConfirming(false)
    }
  }

  const canSend = title.trim() !== '' && body.trim() !== ''

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <div style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0B5D52', marginBottom: 6 }}>
            NMD Portal
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0C1614', fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>
            Notifications
          </h1>
          <p style={{ fontSize: 14, color: '#6E6A62' }}>
            Turn on alerts for your own device, or send an announcement to the team.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <NotificationSettings />
        </div>

        <div style={card}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0C1614', margin: '0 0 6px' }}>
            Send an announcement
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#4A4741', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
            This goes straight to people&apos;s phones. Only those who have turned
            notifications on will receive it.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="notif-audience">Send to</label>
            <select
              id="notif-audience"
              style={inputStyle}
              value={role}
              onChange={e => { setRole(e.target.value); setConfirming(false) }}
            >
              {AUDIENCES.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="notif-title">Title</label>
            <input
              id="notif-title"
              style={inputStyle}
              value={title}
              maxLength={60}
              placeholder="Schedule change for tomorrow"
              onChange={e => { setTitle(e.target.value); setConfirming(false) }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="notif-body">Message</label>
            <textarea
              id="notif-body"
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', paddingTop: '0.6rem' }}
              value={body}
              maxLength={200}
              placeholder="Rain pushed the Melbourne jobs to Thursday. Check your route for details."
              onChange={e => { setBody(e.target.value); setConfirming(false) }}
            />
            <div style={{ fontSize: '0.75rem', color: '#6E6A62', marginTop: 5 }}>
              {body.length}/200 — phones cut off long messages.
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle} htmlFor="notif-url">Open this page when tapped (optional)</label>
            <input
              id="notif-url"
              style={inputStyle}
              value={url}
              placeholder="/employee/schedule"
              onChange={e => setUrl(e.target.value)}
            />
          </div>

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!canSend}
              style={{
                minHeight: 44, padding: '0.6rem 1.15rem', borderRadius: 10, border: 'none',
                background: '#0B5D52', color: '#fff', fontWeight: 600, fontSize: '0.85rem',
                fontFamily: 'DM Sans, sans-serif', cursor: canSend ? 'pointer' : 'not-allowed',
                opacity: canSend ? 1 : 0.5,
              }}
            >
              Review and send
            </button>
          ) : (
            <div style={{ background: '#FBF1DF', border: '1px solid #EEDFBD', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#8A5A0B', lineHeight: 1.6, marginBottom: 12 }}>
                This will buzz the phone of every <strong>{audienceLabel.toLowerCase()}</strong> with
                notifications on. It can&apos;t be recalled once sent.
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={send}
                  disabled={sending}
                  style={{
                    minHeight: 44, padding: '0.6rem 1.15rem', borderRadius: 10, border: 'none',
                    background: '#0B5D52', color: '#fff', fontWeight: 600, fontSize: '0.85rem',
                    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', opacity: sending ? 0.6 : 1,
                  }}
                >
                  {sending ? 'Sending…' : `Send to ${audienceLabel.toLowerCase()}`}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  style={{
                    minHeight: 44, padding: '0.6rem 1.15rem', borderRadius: 10,
                    border: '1px solid #DDD8CF', background: '#fff', color: '#4A4741',
                    fontWeight: 600, fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                  }}
                >
                  Go back
                </button>
              </div>
            </div>
          )}

          {result && (
            <div style={{ marginTop: 14, fontSize: '0.85rem', color: '#0B5D52' }}>{result}</div>
          )}
          {error && (
            <div style={{ marginTop: 14, fontSize: '0.85rem', color: '#A32D2D' }}>{error}</div>
          )}
        </div>
      </div>
    </PortalShell>
  )
}