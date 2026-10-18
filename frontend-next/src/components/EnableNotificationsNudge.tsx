'use client'

import { useState, useEffect } from 'react'
import { getNmdToken } from '@/lib/authStorage'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://nmd-backend.onrender.com'
const DISMISSED_KEY = 'nmd.notifyNudgeDismissed'

// A one-time prompt shown only inside the installed app, because the option
// is otherwise buried in Security and most people never find it — which
// matters on iOS, where installing is the only way to get push at all.
//
// This is not an automatic permission request: the browser prompt still
// only fires when the button is tapped. Auto-prompting gets people to hit
// Block, which kills notifications for the whole domain on that device.
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

export default function EnableNotificationsNudge() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      if (!isStandalone()) return

      const supported =
        'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      if (!supported) return

      // Only ask when the choice is still open. Granted or blocked both mean
      // there is nothing useful to say here.
      if (Notification.permission !== 'default') return

      try {
        if (localStorage.getItem(DISMISSED_KEY) === '1') return
      } catch {
        // Private mode can throw on storage access; showing once is fine.
      }

      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) return
      } catch {
        return
      }

      // Let the app finish painting before sliding anything over it.
      setTimeout(() => {
        if (!cancelled) setVisible(true)
      }, 1800)
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Not worth failing over; it just means they may see it again.
    }
    setVisible(false)
  }

  const enable = async () => {
    setBusy(true)
    setError('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        dismiss()
        return
      }

      const keyRes = await fetch(`${API}/api/notifications/vapid-public-key`)
      if (!keyRes.ok) throw new Error('Notifications are not available right now.')
      const { publicKey } = await keyRes.json()

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        })
      }

      // Signed-in devices are tied to the account so they get personal
      // updates. Anonymous ones are stored without a name and claimed
      // automatically if that person later signs in.
      const token = getNmdToken()
      const endpoint = token
        ? `${API}/api/notifications/subscribe`
        : `${API}/api/notifications/subscribe-public`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => null)
        throw new Error(detail?.error || 'Could not turn on notifications.')
      }

      try {
        localStorage.setItem(DISMISSED_KEY, '1')
      } catch {
        // Ignore.
      }
      setDone(true)
      setTimeout(() => setVisible(false), 1800)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not turn on notifications.')
    } finally {
      setBusy(false)
    }
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes nmdNudgeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nmd-nudge { animation: nmdNudgeUp 0.26s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .nmd-nudge { animation: none; }
        }
      `}</style>

      <div
        role="dialog"
        aria-label="Turn on notifications"
        className="nmd-nudge"
        style={{
          position: 'fixed',
          left: 12,
          right: 12,
          bottom: 12,
          zIndex: 200,
          background: '#FFFFFF',
          border: '1px solid #DDD8CF',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          padding: '1rem 1.1rem calc(1rem + env(safe-area-inset-bottom))',
          fontFamily: 'DM Sans, sans-serif',
          maxWidth: 460,
          margin: '0 auto',
        }}
      >
        {done ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', fontWeight: 600, color: '#0B5D52' }}>
            <CheckIcon />
            Notifications are on
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 14 }}>
              <span style={{ color: '#0B5D52', flexShrink: 0, marginTop: 1 }}><BellIcon /></span>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0C1614', marginBottom: 3 }}>
                  Turn on notifications
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.55, color: '#4A4741' }}>
                  Get alerted about jobs, schedule changes, quotes and messages
                  without opening the app.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 9 }}>
              <button
                type="button"
                onClick={enable}
                disabled={busy}
                style={{
                  flex: 1,
                  minHeight: 46,
                  borderRadius: 10,
                  border: 'none',
                  background: '#0B5D52',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? 'Turning on…' : 'Turn on'}
              </button>
              <button
                type="button"
                onClick={dismiss}
                style={{
                  minHeight: 46,
                  padding: '0 1.1rem',
                  borderRadius: 10,
                  border: '1px solid #DDD8CF',
                  background: '#fff',
                  color: '#4A4741',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Not now
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#A32D2D' }}>{error}</div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}