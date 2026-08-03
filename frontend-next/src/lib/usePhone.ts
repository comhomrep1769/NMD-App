'use client'

import { useState, useEffect } from 'react'
import { formatPhone, telHref, PHONE_FALLBACK } from '@/lib/phone'

export function usePhone(): { display: string; href: string } {
  const [raw, setRaw] = useState<string>(PHONE_FALLBACK)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://nmd-backend.onrender.com'
    fetch(`${API}/api/site-content`)
      .then(r => r.json())
      .then(d => { if (d.content?.['site.phone']) setRaw(d.content['site.phone']) })
      .catch(() => {})
  }, [])

  return { display: formatPhone(raw), href: telHref(raw) }
}