'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getNmdAuth, saveNmdAuth } from '@/lib/authStorage'
import Link from 'next/link'

export default function AdminChangePasswordPage() {
  const router = useRouter()
  const auth = getNmdAuth()
  const isMustChange = auth?.user?.mustChangePassword === true

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (newPassword === currentPassword) { setError('New password must be different from current password.'); return }

    setSaving(true)
    try {
      const token = auth?.token
      const res = await fetch(`${API}/api/employees/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')

      if (auth?.user) {
        saveNmdAuth({ token: auth.token, user: { ...auth.user, mustChangePassword: false } })
      }

      setSuccess(true)
      setTimeout(() => router.replace('/dashboard/admin'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 2.5rem 0.6rem 0.85rem', borderRadius: 8,
    border: '1.5px solid #dde4ef', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
    background: '#f4f7fb', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #dde4ef', padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(14,17,23,0.07)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>NMD</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0e1117' }}>NMD Pressure Washing</div>
            <div style={{ fontSize: '0.68rem', color: '#8494b0' }}>Services LLC</div>
          </div>
        </div>

        {isMustChange && (
          <div style={{ background: '#fff9e6', border: '1px solid #f5e6a0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#7a5c00', lineHeight: 1.5 }}>
            🔐 <strong>Action required:</strong> You must set a new password before accessing the admin portal.
          </div>
        )}

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0e1117', marginBottom: 6, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
          {isMustChange ? 'Set Your Password' : 'Change Password'}
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#5a6a88', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {isMustChange ? 'Enter your temporary password and choose a new secure password.' : 'Enter your current password and choose a new one.'}
        </p>

        {error && (
          <div style={{ background: '#fcebeb', border: '1px solid #f09595', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.85rem', color: '#a32d2d', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#f0fff4', border: '1px solid #c0dd97', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.85rem', color: '#1f6132', fontWeight: 600, marginBottom: '1rem' }}>
            ✓ Password changed! Redirecting to admin portal...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#3a4660', display: 'block', marginBottom: 4 }}>
              {isMustChange ? 'Temporary Password' : 'Current Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} required placeholder="Enter current/temporary password" />
              <button type="button" onClick={() => setShowCurrent(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8494b0', display: 'flex', alignItems: 'center', padding: 0 }}>
                <EyeIcon show={showCurrent} />
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#3a4660', display: 'block', marginBottom: 4 }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} required placeholder="Min 8 characters" />
              <button type="button" onClick={() => setShowNew(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8494b0', display: 'flex', alignItems: 'center', padding: 0 }}>
                <EyeIcon show={showNew} />
              </button>
            </div>
            {newPassword.length > 0 && (
              <div style={{ fontSize: '0.75rem', marginTop: 4, color: newPassword.length >= 8 ? '#1f6132' : '#a32d2d' }}>
                {newPassword.length >= 8 ? '✓ Good length' : `${8 - newPassword.length} more characters needed`}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#3a4660', display: 'block', marginBottom: 4 }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} required placeholder="Repeat new password" />
              <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8494b0', display: 'flex', alignItems: 'center', padding: 0 }}>
                <EyeIcon show={showConfirm} />
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <div style={{ fontSize: '0.75rem', marginTop: 4, color: '#a32d2d' }}>Passwords do not match</div>
            )}
          </div>

          <button type="submit" disabled={saving || success} style={{
            width: '100%', padding: '0.75rem', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white',
            fontWeight: 700, fontSize: '0.95rem', cursor: saving || success ? 'not-allowed' : 'pointer',
            opacity: saving || success ? 0.7 : 1, marginTop: 4, fontFamily: 'DM Sans, sans-serif',
          }}>
            {saving ? 'Saving...' : 'Set New Password →'}
          </button>
        </form>

        {!isMustChange && (
          <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid #dde4ef', paddingTop: '1.25rem' }}>
            <Link href="/dashboard/admin" style={{ fontSize: '0.85rem', color: '#5a6a88' }}>← Back to Dashboard</Link>
          </div>
        )}
      </div>
    </div>
  )
}