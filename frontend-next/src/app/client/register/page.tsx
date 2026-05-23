'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { saveNmdAuth } from '@/lib/authStorage'
import Link from 'next/link'

export default function ClientRegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8,
    border: '1.5px solid #dde4ef', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
    background: '#f4f7fb', boxSizing: 'border-box',
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    try {
      setSaving(true)
      const data = await apiFetch<{ token: string; user: object }>(
        '/api/auth/register-client',
        { method: 'POST', body: JSON.stringify({ displayName: `${firstName} ${lastName}`.trim(), email, password }) }
      )
      saveNmdAuth(data)
      router.replace('/client')
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
          Create your NMD client portal login to view quotes, invoices, appointments, and payments.
        </p>

        {error && (
          <div style={{ background: '#fcebeb', border: '1px solid #f09595', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.85rem', color: '#a32d2d', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input style={inputStyle} placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <input style={inputStyle} placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
          <input style={inputStyle} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={inputStyle} placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
          <input style={inputStyle} placeholder="Service address" value={address} onChange={e => setAddress(e.target.value)} />
          <input style={inputStyle} placeholder="Password (min 8 characters)" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <input style={inputStyle} placeholder="Confirm password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '0.75rem', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #1f6132, #124d83)',
            color: 'white', fontWeight: 600, fontSize: '0.95rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, marginTop: 4,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {saving ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid #dde4ef', paddingTop: '1.25rem' }}>
          <Link href="/client/login" style={{ fontSize: '0.85rem', color: '#5a6a88' }}>
            Already have an account? Sign in →
          </Link>
        </div>
        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: '0.82rem', color: '#8494b0' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  )
}


