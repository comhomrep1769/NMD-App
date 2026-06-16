export type StoredNmdUser = {
  id?: string
  email?: string
  displayName?: string
  name?: string
  role?: 'superadmin' | 'admin' | 'employee' | 'client' | string
  mustChangePassword?: boolean
}

export type StoredNmdAuth = {
  token: string
  user: StoredNmdUser | null
}

const AUTH_KEY = 'nmd_auth'
const TOKEN_KEY = 'nmd_token'
const USER_KEY = 'nmd_user'

const JWT_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/

function isJwtLike(value: unknown) {
  return typeof value === 'string' && JWT_PATTERN.test(value.trim())
}

function findTokenDeep(value: unknown, depth = 0): string {
  if (depth > 6 || value === null || value === undefined) return ''
  if (isJwtLike(value)) return String(value).trim()
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (isJwtLike(trimmed)) return trimmed
    try { return findTokenDeep(JSON.parse(trimmed), depth + 1) } catch { return '' }
  }
  if (Array.isArray(value)) {
    for (const item of value) { const f = findTokenDeep(item, depth + 1); if (f) return f }
    return ''
  }
  if (typeof value === 'object') {
    const r = value as Record<string, unknown>
    for (const key of ['token', 'authToken', 'accessToken', 'jwt']) {
      const f = findTokenDeep(r[key], depth + 1); if (f) return f
    }
    for (const v of Object.values(r)) { const f = findTokenDeep(v, depth + 1); if (f) return f }
  }
  return ''
}

function findUserDeep(value: unknown, depth = 0): StoredNmdUser | null {
  if (depth > 6 || value === null || value === undefined) return null
  if (typeof value === 'string') {
    try { return findUserDeep(JSON.parse(value), depth + 1) } catch { return null }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const r = value as Record<string, unknown>
    const u = r.user || r.authUser || r.account
    if (u && typeof u === 'object') {
      const n = u as Record<string, unknown>
      if (n.email || n.role || n.id) {
        return {
          id: String(n.id || ''),
          email: String(n.email || ''),
          displayName: String(n.displayName || n.name || n.email || ''),
          name: String(n.name || n.displayName || ''),
          role: String(n.role || ''),
          mustChangePassword: Boolean(n.mustChangePassword ?? false),
        }
      }
    }
    if (r.email || r.role || r.id) {
      return {
        id: String(r.id || ''),
        email: String(r.email || ''),
        displayName: String(r.displayName || r.name || r.email || ''),
        name: String(r.name || r.displayName || ''),
        role: String(r.role || ''),
        mustChangePassword: Boolean(r.mustChangePassword ?? false),
      }
    }
  }
  return null
}

export function saveNmdAuth(loginResponse: unknown): StoredNmdAuth {
  const token = findTokenDeep(loginResponse)
  const user = findUserDeep(loginResponse)
  if (!token) throw new Error('No JWT token found in login response.')
  const auth: StoredNmdAuth = { token, user }
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  localStorage.setItem(TOKEN_KEY, token)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  return auth
}

export function getNmdAuth(): StoredNmdAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) {
      const token = localStorage.getItem(TOKEN_KEY) || ''
      if (!token) return null
      return { token, user: getNmdUser() }
    }
    const parsed = JSON.parse(raw) as StoredNmdAuth
    if (!parsed.token) return null
    return parsed
  } catch { return null }
}

export function getNmdToken(): string {
  try {
    const auth = getNmdAuth()
    if (auth?.token) return auth.token
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch { return '' }
}

export function getNmdUser(): StoredNmdUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredNmdUser
  } catch { return null }
}

export function clearNmdAuth() {
  try {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {}
}

export function hasNmdToken(): boolean {
  try { return Boolean(getNmdToken()) } catch { return false }
}