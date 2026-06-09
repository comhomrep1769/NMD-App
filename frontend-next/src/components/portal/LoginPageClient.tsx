"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { saveNmdAuth } from "@/lib/authStorage"
import Link from "next/link"

function getPortalPath(role: string) {
  const r = role.toLowerCase()
  if (r === "superadmin" || r === "admin") return "/dashboard/admin"
  if (r === "employee") return "/dashboard/employee"
  return "/clientdashboard"
}

function LoginForm({ portalRole }: { portalRole: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || ""

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const title =
    portalRole === "client" ? "Client Login" :
    portalRole === "employee" ? "Employee Login" :
    portalRole === "superadmin" ? "Super Admin Login" : "Admin Login"

  const subtitle =
    portalRole === "client" ? "Access your estimates, appointments, and service requests." :
    portalRole === "employee" ? "Access assigned jobs, schedule, treatments, and chat." :
    "Access operations, clients, estimates, scheduling, and Guru."

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch<{ token: string; user: { role: string } }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password, rememberMe, portalRole }) }
      )
      const auth = saveNmdAuth(data)
      const role = String(auth.user?.role || data.user?.role || portalRole || "client")
      router.replace(redirectTo || getPortalPath(role))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#f4f7fb",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "DM Sans, sans-serif", padding: "2rem",
    }}>
      <div style={{
        background: "white", borderRadius: 16, border: "1px solid #dde4ef",
        padding: "2.5rem", width: "100%", maxWidth: 420,
        boxShadow: "0 8px 40px rgba(14,17,23,0.07)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "linear-gradient(135deg, #1f6132, #124d83)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: "0.75rem", fontWeight: 800,
          }}>NMD</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0e1117" }}>NMD Pressure Washing</div>
            <div style={{ fontSize: "0.68rem", color: "#8494b0" }}>Services LLC</div>
          </div>
        </div>

        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0e1117", marginBottom: 6, fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>{title}</h1>
        <p style={{ fontSize: "0.85rem", color: "#5a6a88", marginBottom: "1.5rem", lineHeight: 1.5 }}>{subtitle}</p>

        {error && (
          <div style={{ background: "#fcebeb", border: "1px solid #f09595", borderRadius: 8, padding: "0.65rem 0.9rem", fontSize: "0.85rem", color: "#a32d2d", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "#3a4660", display: "block", marginBottom: 4 }}>Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.875rem", outline: "none", fontFamily: "DM Sans, sans-serif", color: "#0e1117", background: "#f4f7fb", boxSizing: "border-box" }}
            />
          </div>

          {/* Password with show/hide eye */}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "#3a4660", display: "block", marginBottom: 4 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: "100%", padding: "0.6rem 2.5rem 0.6rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.875rem", outline: "none", fontFamily: "DM Sans, sans-serif", color: "#0e1117", background: "#f4f7fb", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "#8494b0", fontSize: "1.1rem" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  // Eye icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#5a6a88", cursor: "pointer" }}>
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: "#1f6132" }} />
            Keep me logged in
          </label>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "0.75rem", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #1f6132, #124d83)",
            color: "white", fontWeight: 600, fontSize: "0.95rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, marginTop: 4,
            fontFamily: "DM Sans, sans-serif",
          }}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid #dde4ef", paddingTop: "1.25rem" }}>
          {portalRole === "admin" || portalRole === "superadmin" ? (
            <Link href="/client/login" style={{ fontSize: "0.82rem", color: "#5a6a88", textAlign: "center" }}>Client portal</Link>
          ) : null}
          <Link href="/" style={{ fontSize: "0.82rem", color: "#5a6a88", textAlign: "center" }}>Back to home</Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPageClient({ portalRole = "" }: { portalRole?: string }) {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", color: "#5a6a88" }}>
        Loading...
      </div>
    }>
      <LoginForm portalRole={portalRole} />
    </Suspense>
  )
}