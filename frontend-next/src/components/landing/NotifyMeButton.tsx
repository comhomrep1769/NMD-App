'use client'

import { useState, useEffect, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://nmd-backend.onrender.com'

type State = 'loading' | 'unsupported' | 'ios' | 'denied' | 'off' | 'on'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

// Lets a visitor turn on notifications without an account. The permission
// is only ever requested from a click — never on page load, which browsers
// penalise and people resent.
export default function NotifyMeButton() {
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined') return

    const supported =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

    if (!supported) {
      setState(isIos() && !isStandalone() ? 'ios' : 'unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) {
        setState('off')
        return
      }
      // A browser subscription the server never stored would deliver nothing,
      // so confirm the endpoint is actually on file.
      const res = await fetch(
        `${API}/api/notifications/status-public?endpoint=${encodeURIComponent(sub.endpoint)}`
      )
      const data = res.ok ? await res.json() : null
      setState(data?.subscribed ? 'on' : 'off')
    } catch {
      setState('off')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const enable = async () => {
    setBusy(true)
    setError('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off')
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

      const saveRes = await fetch(`${API}/api/notifications/subscribe-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!saveRes.ok) {
        const detail = await saveRes.json().catch(() => null)
        throw new Error(detail?.error || 'Could not turn on notifications.')
      }
      setState('on')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not turn on notifications.')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    setError('')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch(`${API}/api/notifications/unsubscribe-public`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {})
        await sub.unsubscribe()
      }
      setState('off')
    } catch {
      setError('Could not turn off notifications.')
    } finally {
      setBusy(false)
    }
  }

  // Nothing useful to offer on these, so stay out of the way.
  if (state === 'loading' || state === 'unsupported' || state === 'ios') return null

  if (state === 'denied') {
    return (
      <span className="text-sm text-gray-500">
        Notifications are blocked in your browser settings.
      </span>
    )
  }

  if (state === 'on') {
    return (
      <button
        type="button"
        onClick={disable}
        disabled={busy}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <BellIcon />
        Notifications on — turn off
      </button>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#DDD8CF] bg-white px-5 py-3 text-[15px] font-semibold text-gray-900 hover:border-teal-700 hover:text-teal-700"
        style={{ transition: 'border-color 0.15s ease-out, color 0.15s ease-out' }}
      >
        <BellIcon />
        {busy ? 'Turning on…' : 'Notify me about offers'}
      </button>
      {error && <div className="mt-2 text-sm text-[#A32D2D]">{error}</div>}
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}