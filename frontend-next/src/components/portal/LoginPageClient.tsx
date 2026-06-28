'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { saveNmdAuth } from '@/lib/authStorage'
import Link from 'next/link'

function getPortalPath(role: string, mustChangePassword?: boolean) {
  const r = role.toLowerCase()
  if (mustChangePassword) {
    if (r === 'employee') return '/employee/change-password'
    if (r === 'admin' || r === 'superadmin') return '/admin/change-password'
  }
  if (r === 'superadmin' || r === 'admin') return '/dashboard/admin'
  if (r === 'employee') return '/dashboard/employee'
  return '/clientdashboard'
}

function LoginForm({ portalRole }: { portalRole: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roleLabel =
    portalRole === 'client' ? 'Client' :
    portalRole === 'employee' ? 'Employee' :
    portalRole === 'superadmin' ? 'Super Admin' : 'Admin'

  const subtitle =
    portalRole === 'client' ? 'Enter your credentials to access your estimates and appointments.' :
    portalRole === 'employee' ? 'Enter your credentials to access your jobs, schedule, and team chat.' :
    'Enter your credentials to access the operations portal.'

  const heroDescription =
    portalRole === 'client' ? 'Track your estimates, appointments, invoices, and service requests in one place.' :
    portalRole === 'employee' ? 'Your jobs, schedule, treatments, and team chat — everything you need out in the field.' :
    'Business operations dashboard — revenue, clients, scheduling, employees, and route management.'

  const badge =
    portalRole === 'admin' ? { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', text: 'Restricted Access — Admin Only' } :
    portalRole === 'superadmin' ? { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', text: 'Restricted Access — Super Admin Only' } :
    portalRole === 'employee' ? { bg: '#F0FDF9', border: '#D1FAE5', color: '#0F766E', text: 'Staff Access — Employee Portal' } :
    null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<{ token: string; user: { role: string; mustChangePassword?: boolean } }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password, rememberMe, portalRole }) }
      )
      const auth = saveNmdAuth(data)
      const role = String(auth.user?.role || data.user?.role || portalRole || 'client')
      const mustChangePassword = data.user?.mustChangePassword === true
      router.replace(redirectTo || getPortalPath(role, mustChangePassword))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[100vh] overflow-hidden">
      <style>{`@keyframes nmdLoginHeroZoom { from { transform: scale(1.06); } to { transform: scale(1); } }`}</style>

      {/* LEFT — brand panel */}
        <div className="nmd-login-brand flex flex-col justify-end relative overflow-hidden" style={{ flex: '0 0 55%', background: '#0A1F1C', padding: 48 }}>
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0, rgba(255,255,255,0.015) 1px, transparent 0, transparent 50%)', backgroundSize: '28px 28px' }}
          />
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1800&q=80')",
              animation: 'nmdLoginHeroZoom 14s ease-out forwards',
            }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)' }} />
          <div className="relative z-[2]">
            <div className="text-[20px] font-bold !text-white tracking-[-0.025em] mb-[3px]">NMD Pressure Washing</div>
            <div className="text-[9px] font-bold tracking-[0.14em] uppercase mb-[20px]" style={{ color: '#34D399' }}>
              SERVICES LLC &mdash; {roleLabel.toUpperCase()} PORTAL
            </div>
            <p className="text-[14px] leading-[1.65] max-w-[340px] m-0" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {heroDescription}
            </p>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div className="nmd-login-right flex-1 bg-white flex items-center justify-center px-[48px]">
          <div className="w-full max-w-[360px]">
            {badge && (
              <div
                className="inline-flex items-center gap-[6px] rounded-[7px] px-[12px] py-[8px] mb-[24px]"
                style={{ background: badge.bg, border: `1px solid ${badge.border}` }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2L7 8M7 10V10.5" stroke={badge.color} strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="7" cy="7" r="6" stroke={badge.color} strokeWidth="1.3" />
                </svg>
                <span className="text-[12px] font-semibold" style={{ color: badge.color }}>{badge.text}</span>
              </div>
            )}

            <h2 className="text-[26px] font-bold text-[#111827] tracking-[-0.025em] mb-[6px]">{roleLabel} Sign In</h2>
            <p className="text-[14px] text-[#6B7280] mb-[24px]">{subtitle}</p>

            {error && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-[14px] py-[10px] mb-[16px] text-[13px] text-[#B91C1C]">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-[14px]">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">Email</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-[6px]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                    className="w-full px-[14px] py-[11px] pr-[40px] border border-[#E5E7EB] rounded-[8px] text-[14px] outline-none"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-[10px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center"
                    style={{ color: '#9CA3AF' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-[8px] text-[13px] cursor-pointer" style={{ color: '#6B7280' }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#0F766E' }} />
                Keep me logged in
              </label>

              <button
                type="submit" disabled={loading}
                className="w-full text-[15px] font-semibold py-[12px] rounded-[8px] border-none mt-[2px]"
                style={{
                  background: loading ? '#D1FAE5' : '#0F766E',
                  color: loading ? '#0F766E' : '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Signing in...' : `Sign In to ${roleLabel} Portal`}
              </button>
            </form>

            {/* Sign-up prompt — client portal only, sits right under the form */}
            {portalRole === 'client' && (
              <div style={{
                marginTop: '14px', padding: '0.85rem 1rem', borderRadius: 8,
                background: '#F0FDF9', border: '1px solid #D1FAE5',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '0.75rem', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '13px', color: '#374151', fontFamily: 'DM Sans, sans-serif' }}>
                  New to NMD Pressure Washing?
                </span>
                <Link href="/client/register" style={{
                  fontSize: '13px', fontWeight: 700, color: '#0F766E',
                  textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap',
                }}>
                  Create a Free Account →
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-[8px] mt-[24px] pt-[20px] border-t border-[#E5E7EB] text-center">
              {(portalRole === 'admin' || portalRole === 'superadmin') && (
                <Link href="/client/login" className="text-[13px] !text-[#0F766E] font-medium">Client portal</Link>
              )}
              <Link href="/" className="text-[13px] text-[#6B7280]">Back to home</Link>
            </div>
          </div>
        </div>
    </div>
  )
}

export default function LoginPageClient({ portalRole = '' }: { portalRole?: string }) {
  return (
    <Suspense fallback={
      <div className="min-h-[100vh] bg-[#F8FAF9] flex items-center justify-center text-[#6B7280]">
        Loading...
      </div>
    }>
      <LoginForm portalRole={portalRole} />
    </Suspense>
  )
}