'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('Invalid or missing token. Please use the link from your email.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${API_URL}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to set password.')
      setSuccess(true)
      setTimeout(() => router.push('/client/login'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 8,
    border: '1.5px solid #dde4ef', fontSize: '0.9rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
    background: '#f4f7fb', boxSizing: 'border-box',
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #c0dd97', padding: '3rem', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(14,17,23,0.07)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#0e1117', marginBottom: '0.75rem' }}>Password Set!</h2>
          <p style={{ color: '#5a6a88', fontSize: '0.9rem', lineHeight: 1.6 }}>Your account is ready. Redirecting you to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #dde4ef', padding: '2.5rem', maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(14,17,23,0.07)' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#0e1117', marginBottom: '0.5rem' }}>Set Your Password</div>
          <p style={{ color: '#5a6a88', fontSize: '0.875rem', lineHeight: 1.6 }}>Create a password to access your NMD client portal.</p>
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#c0392b' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#3a4660', display: 'block', marginBottom: 4 }}>New Password</label>
            <input type="password" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#3a4660', display: 'block', marginBottom: 4 }}>Confirm Password</label>
            <input type="password" style={inputStyle} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            style={{ padding: '0.85rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Setting Password...' : 'Set Password & Access Portal'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/client/login" style={{ fontSize: '0.85rem', color: '#1f6132', fontWeight: 600, textDecoration: 'none' }}>
            Already have a password? Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
