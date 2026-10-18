'use client'

import { useEffect } from 'react'

// Registers the service worker that receives web push and serves the
// offline page. Without a registered worker, push can never be delivered,
// no matter what the backend sends.
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        // A failed registration must never break the page; the site works
        // fine without push or offline support.
        console.warn('Service worker registration failed:', err)
      })
    }

    // Wait for load so registration never competes with first paint.
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register)

    return () => window.removeEventListener('load', register)
  }, [])

  return null
}