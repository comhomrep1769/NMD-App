'use client'

import { useState, useEffect } from 'react'

// Chrome fires this so a site can offer its own install button instead of
// relying on people noticing the address-bar icon. It is not in the DOM
// typings, so the shape is declared here.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Mode = 'hidden' | 'ready' | 'ios' | 'installed'

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

export default function InstallAppButton() {
  const [mode, setMode] = useState<Mode>('hidden')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) {
      setMode('installed')
      return
    }

    // iPhone and iPad never fire beforeinstallprompt. Installing there is a
    // manual Safari step, so the button explains it rather than pretending
    // it can trigger an install.
    if (isIos()) {
      setMode('ios')
      return
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('ready')
    }

    const onInstalled = () => {
      setMode('installed')
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    // The event can only be used once; Chrome re-fires it if they decline.
    setDeferred(null)
    if (outcome === 'accepted') setMode('installed')
    else setMode('hidden')
  }

  if (mode === 'hidden') return null

  if (mode === 'installed') {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-700">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        App installed
      </span>
    )
  }

  if (mode === 'ios') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowIosHelp(v => !v)}
          aria-expanded={showIosHelp}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#DDD8CF] bg-white px-5 py-3 text-[15px] font-semibold text-gray-900"
        >
          <PhoneIcon />
          Add to Home Screen
        </button>

        {showIosHelp && (
          <div className="mt-3 max-w-[340px] rounded-[10px] border border-[#DDD8CF] bg-white p-4 text-sm leading-relaxed text-gray-700">
            <ol className="m-0 list-decimal space-y-1.5 pl-4">
              <li>Tap the Share button at the bottom of Safari</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong>, then open NMD from the new icon</li>
            </ol>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={install}
      className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#DDD8CF] bg-white px-5 py-3 text-[15px] font-semibold text-gray-900 hover:border-teal-700 hover:text-teal-700"
      style={{ transition: 'border-color 0.15s ease-out, color 0.15s ease-out' }}
    >
      <DownloadIcon />
      Install the app
    </button>
  )
}

function DownloadIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18.5h2" />
    </svg>
  )
}