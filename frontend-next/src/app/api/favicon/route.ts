import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    const res = await fetch(`${API}/api/site-content/favicon`, { cache: 'no-store' })
    if (!res.ok) return NextResponse.redirect(new URL('/nmd-logo-email.png', 'https://nmdpowash.com'))
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      }
    })
  } catch {
    return NextResponse.redirect(new URL('/nmd-logo-email.png', 'https://nmdpowash.com'))
  }
}