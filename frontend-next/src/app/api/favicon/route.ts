import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch('https://nmd-backend.onrender.com/api/site-content/favicon', { cache: 'no-store' })
    if (!res.ok) throw new Error('fetch failed')
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' }
    })
  } catch {
    return NextResponse.redirect(new URL('/nmd-logo-email.png', 'https://nmdpowash.com'))
  }
}
