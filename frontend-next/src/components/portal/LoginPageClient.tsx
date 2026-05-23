Set-Content -Encoding UTF8 frontend-next/src/components/portal/LoginPageClient.tsx -Value @'
"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { saveNmdAuth } from "@/lib/authStorage"
import Link from "next/link"

function getPortalPath(role: string) {
  const r = role.toLowerCase()
  if (r === "superadmin" || r === "admin") return "/dashboard"
  if (r === "employee") return "/employee"
  return "/client"
}

function LoginForm({ portalRole }: { portalRole: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || ""

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "#3a4660", display: "block", marginBottom: 4 }}>Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.875rem", outline: "none", fontFamily: "DM Sans, sans-serif", color: "#0e1117", background: "#f4f7fb", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "#3a4660", display: "block", marginBottom: 4 }}>Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ width: "100%", padding: "0.6rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.875rem", outline: "none", fontFamily: "DM Sans, sans-serif", color: "#0e1117", background: "#f4f7fb", boxSizing: "border-box" }}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#5a6a88", cursor: "pointer" }}>
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
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
          {portalRole !== "client" && (
            <Link href="/client/login" style={{ fontSize: "0.82rem", color: "#5a6a88", textAlign: "center" }}>Client portal</Link>
          )}
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
'@