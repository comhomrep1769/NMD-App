'use client'
import { useEffect, useState } from 'react'

export function useSiteContent() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/site-content`)
      .then(r => r.json())
      .then(d => { setContent(d.content || {}); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  return { content, loaded }
}