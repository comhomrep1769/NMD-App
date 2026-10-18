'use client'

import { useState } from 'react'
import { usePushNotifications } from '@/lib/usePushNotifications'

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #DDD8CF',
  borderRadius: 10,
  padding: '1.25rem',
}

const btnPrimary: React.CSSProperties = {
  minHeight: 44,
  padding: '0.6rem 1.15rem',
  borderRadius: 10,
  border: 'none',
  background: '#0B5D52',
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.85rem',
  fontFamily: 'DM Sans, sans-serif',
  cursor: 'pointer',
}

const btnGhost: React.CSSProperties = {
  minHeight: 44,
  padding: '0.6rem 1.15rem',
  borderRadius: 10,
  border: '1px solid #DDD8CF',
  background: '#fff',
  color: '#4A4741',
  fontWeight: 600,
  fontSize: '0.85rem',
  fontFamily: 'DM Sans, sans-serif',
  cursor: 'pointer',
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

export default function NotificationSettings() {
  const { state, busy, error, enable, disable, sendTest, isIos } = usePushNotifications()
  const [note, setNote] = useState('')

  const handleEnable = async () => {
    setNote('')
    const ok = await enable()
    if (ok) setNote('Notifications are on for this device.')
  }

  const handleDisable = async () => {
    setNote('')
    const ok = await disable()
    if (ok) setNote('Notifications are off for this device.')
  }

  const handleTest = async () => {
    setNote('')
    const ok = await sendTest()
    if (ok) setNote('Test sent. It should arrive in a moment.')
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ color: '#0B5D52' }}><BellIcon /></span>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0C1614', margin: 0 }}>
          Push notifications
        </h2>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#4A4741', lineHeight: 1.6, margin: '0 0 1rem' }}>
        Get alerted about new jobs, schedule changes, messages and quotes — even
        when the app is closed. This applies to the device you&apos;re using now.
      </p>

      {state === 'loading' && (
        <div style={{ fontSize: '0.85rem', color: '#6E6A62' }}>Checking this device…</div>
      )}

      {state === 'ios-needs-install' && (
        <div style={{ background: '#FBF1DF', border: '1px solid #EEDFBD', borderRadius: 10, padding: '0.9rem 1rem', fontSize: '0.82rem', color: '#8A5A0B', lineHeight: 1.65 }}>
          <strong>Add NMD to your home screen first.</strong>
          <div style={{ marginTop: 6 }}>
            On iPhone and iPad, notifications only work once the app is installed.
            Tap the Share button in Safari, choose <strong>Add to Home Screen</strong>,
            then open NMD from the new icon and come back here.
          </div>
        </div>
      )}

      {state === 'unsupported' && (
        <div style={{ fontSize: '0.85rem', color: '#6E6A62', lineHeight: 1.6 }}>
          This browser doesn&apos;t support push notifications.
          {isIos ? ' Try opening NMD from its home screen icon.' : ' Try Chrome, Edge or Firefox.'}
        </div>
      )}

      {state === 'denied' && (
        <div style={{ background: '#FCEBEB', border: '1px solid #F0C6C6', borderRadius: 10, padding: '0.9rem 1rem', fontSize: '0.82rem', color: '#A32D2D', lineHeight: 1.65 }}>
          <strong>Notifications are blocked for this site.</strong>
          <div style={{ marginTop: 6 }}>
            The browser is blocking them, so we can&apos;t ask again from here. Open
            your browser&apos;s site settings for nmdpowash.com, allow notifications,
            then reload this page.
          </div>
        </div>
      )}

      {state === 'off' && (
        <button type="button" onClick={handleEnable} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Turning on…' : 'Turn on notifications'}
        </button>
      )}

      {state === 'on' && (
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#E7F0ED', color: '#0B5D52', fontSize: '0.78rem', fontWeight: 600, padding: '0.3rem 0.7rem', borderRadius: 6, marginBottom: 14 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: '#0B5D52' }} />
            On for this device
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleTest} disabled={busy} style={{ ...btnGhost, opacity: busy ? 0.6 : 1 }}>
              Send a test
            </button>
            <button type="button" onClick={handleDisable} disabled={busy} style={{ ...btnGhost, opacity: busy ? 0.6 : 1 }}>
              Turn off
            </button>
          </div>
        </div>
      )}

      {note && (
        <div style={{ marginTop: 12, fontSize: '0.82rem', color: '#0B5D52' }}>{note}</div>
      )}
      {error && (
        <div style={{ marginTop: 12, fontSize: '0.82rem', color: '#A32D2D' }}>{error}</div>
      )}
    </div>
  )
}