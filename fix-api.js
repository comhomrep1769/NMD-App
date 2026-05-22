const fs = require('fs');
const path = require('path');
const TARGET = path.join(__dirname, 'frontend-next');

// Fix lib/api.ts - use direct API URL, not proxy
const apiContent = `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

function normalizeApiPath(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const cleanBase = API_BASE_URL.replace(/\\/$/, '')
  const cleanPath = path.startsWith('/') ? path : \`/\${path}\`
  return \`\${cleanBase}\${cleanPath}\`
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try { return await response.json() } catch { return null }
  }
  try { return await response.text() } catch { return null }
}

function getErrorMessage(response: Response, body: unknown) {
  if (body && typeof body === 'object') {
    const data = body as { message?: unknown; error?: unknown }
    const message = data.message || data.error
    if (message) return String(message)
  }
  if (typeof body === 'string' && body.trim()) return body.trim()
  return \`Request failed (\${response.status} \${response.statusText})\`
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', \`Bearer \${token}\`)
    headers.set('X-Auth-Token', token)
  }
  const response = await fetch(normalizeApiPath(path), {
    ...options,
    credentials: 'include',
    headers,
  })
  const body = await parseResponseBody(response)
  if (!response.ok) throw new Error(getErrorMessage(response, body))
  return body as T
}
`;

const dest = path.join(TARGET, 'src/lib/api.ts');
fs.writeFileSync(dest, apiContent, 'utf8');
console.log('✓ Fixed src/lib/api.ts');

// Fix next.config.ts - remove the broken rewrite, use direct URL
const nextConfig = `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nmd-backend.onrender.com',
      },
    ],
  },
}

export default nextConfig
`;

const nextDest = path.join(TARGET, 'next.config.ts');
fs.writeFileSync(nextDest, nextConfig, 'utf8');
console.log('✓ Fixed next.config.ts');

console.log('\nDone! Now run:');
console.log('git add . && git commit -m "Fix API URL routing for production" && git push origin main');