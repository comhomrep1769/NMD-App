'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function OnboardForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  const fileRef = useRef<HTMLInputElement>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarData, setAvatarData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('Invalid or missing onboarding link. Please use the link from your email.')
  }, [token])

  const handleAvatar = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (file.size > 5_000_000) { setError('Image too large. Max 5MB.'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result as string
      setAvatarPreview(data)
      setAvatarData(data)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(API_URL + '/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, profileImageUrl: avatarData || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete onboarding.')
      setSuccess(true)
      setTimeout(() => router.push('/employee/login'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
    border: '1.5px solid #E5E7EB', fontSize: '0.9rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#111827',
    background: '#F9FAFB', boxSizing: 'border-box',
  }

  if (success) {
    return (
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #D1FAE5', padding: '3rem', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(14,17,23,0.07)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>You're All Set!</h2>
        <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.6 }}>Your account is ready. Redirecting you to the employee login...</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '2.5rem', maxWidth: 460, width: '100%', boxShadow: '0 8px 40px rgba(14,17,23,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>NMD</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>NMD Pressure Washing</div>
          <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Employee Onboarding</div>
        </div>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: 6, letterSpacing: '-0.025em' }}>Welcome to the Team!</h1>
      <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>Set up your password and profile image to get started.</p>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#B91C1C' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '1.25rem', background: '#F8FAF9', borderRadius: 12, border: '1.5px dashed #E5E7EB' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: avatarPreview ? 'none' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid #0F766E' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" /></svg>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Profile Photo</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 8 }}>Optional — you can add this later</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleAvatar(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '0.45rem 1rem', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Choose Photo
          </button>
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Password</label>
          <input type="password" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
        </div>
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Confirm Password</label>
          <input type="password" style={inputStyle} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required />
        </div>

        {password.length > 0 && (
          <div style={{ fontSize: '0.78rem', color: password.length >= 8 ? '#059669' : '#B91C1C' }}>
            {password.length >= 8 ? '✓ Password length is good' : (8 - password.length) + ' more character' + (8 - password.length !== 1 ? 's' : '') + ' needed'}
          </div>
        )}

        <button type="submit" disabled={loading || !token} style={{
          width: '100%', padding: '0.85rem', borderRadius: 10, border: 'none',
          background: '#0F766E', color: 'white', fontWeight: 700, fontSize: '0.95rem',
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif',
          marginTop: 4, opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Setting Up...' : 'Complete Setup & Join Team'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
        <Link href="/employee/login" style={{ fontSize: '0.85rem', color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}>
          Already set up? Log in
        </Link>
      </div>
    </div>
  )
}

export default function OnboardPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '2rem' }}>
      <Suspense fallback={<div style={{ color: '#6B7280' }}>Loading...</div>}>
        <OnboardForm />
      </Suspense>
    </div>
  )
}