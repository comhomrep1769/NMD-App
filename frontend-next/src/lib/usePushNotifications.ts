'use client'

import { useState, useEffect, useCallback } from 'react'
import { getNmdToken } from '@/lib/authStorage'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://nmd-backend.onrender.com'

export type PushState =
  | 'loading'
  | 'unsupported'
  | 'ios-needs-install'
  | 'denied'
  | 'off'
  | 'on'

// The browser wants the VAPID key as a byte array, not the base64url
// string the server stores.
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
    // iPadOS reports as Mac but has touch points.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari's own flag, which is not in the standard typings.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined') return

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    if (!supported) {
      // On iPhone, push exists only once the site is installed to the
      // home screen. Safari in a normal tab exposes no PushManager at all,
      // so this is the common case rather than a genuine unsupported browser.
      setState(isIos() && !isStandalone() ? 'ios-needs-install' : 'unsupported')
      return
    }

    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? 'on' : 'off')
    } catch {
      setState('off')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const enable = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off')
        return false
      }

      const keyRes = await fetch(`${API}/api/notifications/vapid-public-key`)
      if (!keyRes.ok) throw new Error('Push is not configured on the server yet.')
      const { publicKey } = await keyRes.json()
      if (!publicKey) throw new Error('Push is not configured on the server yet.')

      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        })
      }

      const saveRes = await fetch(`${API}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getNmdToken()}`,
        },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!saveRes.ok) throw new Error('Could not save your device. Try again.')

      setState('on')
      return true
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not turn on notifications.')
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const disable = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch(`${API}/api/notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getNmdToken()}`,
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {})
        await sub.unsubscribe()
      }
      setState('off')
      return true
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not turn off notifications.')
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const sendTest = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/notifications/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getNmdToken()}` },
      })
      if (!res.ok) throw new Error('Could not send the test notification.')
      return true
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send the test notification.')
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  return { state, busy, error, enable, disable, sendTest, refresh, isIos: isIos() }
}