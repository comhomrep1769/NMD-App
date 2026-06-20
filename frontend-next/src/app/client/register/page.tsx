'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { saveNmdAuth } from '@/lib/authStorage'
import Link from 'next/link'

declare global {
  interface Window {
    google: any
  }
}

export default function ClientRegisterPage() {
  const router = useRouter()
  const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Google Places Autocomplete for Service Address ───────────────────────
  const [placesStatus, setPlacesStatus] = useState('starting') // starting | script-loaded | widget-attached | failed
  const addressDivRef = useRef<HTMLDivElement>(null)
  const placeElementRef = useRef<any>(null)

  useEffect(() => {
    if (!GOOGLE_KEY) { setPlacesStatus('failed'); return }
    let cancelled = false

    function waitForPlaces(attemptsLeft: number) {
      if (cancelled) return
      if (window.google?.maps?.places?.PlaceAutocompleteElement) { setPlacesStatus('script-loaded'); return }
      if (attemptsLeft <= 0) { setPlacesStatus('failed'); return }
      setTimeout(() => waitForPlaces(attemptsLeft - 1), 100)
    }

    if (window.google?.maps?.places?.PlaceAutocompleteElement) {
      setPlacesStatus('script-loaded')
    } else {
      if (!document.getElementById('google-maps-js')) {
        const script = document.createElement('script')
        script.id = 'google-maps-js'
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&loading=async&v=beta`
        script.async = true
        document.head.appendChild(script)
      }
      waitForPlaces(80)
    }
    return () => { cancelled = true }
  }, [GOOGLE_KEY])

  useEffect(() => {
    if (placesStatus !== 'script-loaded') return
    if (placeElementRef.current) return

    let cancelled = false
    function tryAttach(attemptsLeft: number) {
      if (cancelled) return
      if (!addressDivRef.current) {
        if (attemptsLeft <= 0) { setPlacesStatus('failed'); return }
        setTimeout(() => tryAttach(attemptsLeft - 1), 100)
        return
      }
      try {
        const google = window.google
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
          includedRegionCodes: ['us'],
        })
        placeAutocomplete.style.width = '100%'
        addressDivRef.current.appendChild(placeAutocomplete)
        placeElementRef.current = placeAutocomplete

        placeAutocomplete.addEventListener('gmp-select', async (event: any) => {
          const prediction = event.placePrediction
          if (!prediction) return
          const place = prediction.toPlace()
          await place.fetchFields({ fields: ['formattedAddress'] })
          setAddress(place.formattedAddress || '')
        })

        setPlacesStatus('widget-attached')
      } catch {
        setPlacesStatus('failed')
      }
    }
    tryAttach(30)
    return () => { cancelled = true }
  }, [placesStatus])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8,
    border: '1.5px solid #dde4ef', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
    background: '#f4f7fb', boxSizing: 'border-box',
  }

  const EyeIcon = ({ show }: { show: boolean }) => show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    try {
      setSaving(true)
      const data = await apiFetch<{ token: string; user: object }>(
        '/api/auth/register-client',
        { method: 'POST', body: JSON.stringify({ displayName: `${firstName} ${lastName}`.trim(), email, phone, address, password }) }
      )
      saveNmdAuth(data)
      router.replace('/clientdashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f4f7fb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif', padding: '2rem',
    }}>
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #dde4ef',
        padding: '2.5rem', width: '100%', maxWidth: 460,
        boxShadow: '0 8px 40px rgba(14,17,23,0.07)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #1f6132, #124d83)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.75rem', fontWeight: 800,
          }}>NMD</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0e1117' }}>NMD Pressure Washing</div>
            <div style={{ fontSize: '0.68rem', color: '#8494b0' }}>Services LLC</div>
          </div>
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0e1117', marginBottom: 6, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
          Create Client Account
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#5a6a88', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Track your quotes, invoices, appointments, and service history — all in one place.
        </p>

        {error && (
          <div style={{ background: '#fcebeb', border: '1px solid #f09595', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.85rem', color: '#a32d2d', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input style={inputStyle} placeholder="First name *" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <input style={inputStyle} placeholder="Last name *" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
          <input style={inputStyle} placeholder="Email address *" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={inputStyle} placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />

          <div ref={addressDivRef} style={{ width: '100%' }}>
            {placesStatus !== 'widget-attached' && (
              <input
                style={inputStyle}
                placeholder={placesStatus === 'failed' ? 'Service address' : 'Loading address search...'}
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            )}
          </div>

          {/* Password with eye */}
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...inputStyle, paddingRight: '2.5rem' }}
              placeholder="Password (min 8 characters) *"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(p => !p)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8494b0', display: 'flex', alignItems: 'center', padding: 0 }}>
              <EyeIcon show={showPassword} />
            </button>
          </div>

          {/* Confirm password with eye */}
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...inputStyle, paddingRight: '2.5rem' }}
              placeholder="Confirm password *"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowConfirm(p => !p)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8494b0', display: 'flex', alignItems: 'center', padding: 0 }}>
              <EyeIcon show={showConfirm} />
            </button>
          </div>

          {/* Password strength hint */}
          {password.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: password.length >= 8 ? '#1f6132' : '#a32d2d' }}>
              {password.length >= 8 ? '✓ Password length is good' : `${8 - password.length} more character${8 - password.length !== 1 ? 's' : ''} needed`}
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '0.75rem', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #1f6132, #124d83)',
            color: 'white', fontWeight: 700, fontSize: '0.95rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, marginTop: 6,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {saving ? 'Creating Account...' : 'Create My Account →'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid #dde4ef', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/client/login" style={{ fontSize: '0.85rem', color: '#1f6132', fontWeight: 600 }}>
            Already have an account? Sign in →
          </Link>
          <Link href="/client/request-service" style={{ fontSize: '0.82rem', color: '#5a6a88' }}>
            Just need a quote? Request service without an account
          </Link>
          <Link href="/" style={{ fontSize: '0.82rem', color: '#8494b0' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  )
}