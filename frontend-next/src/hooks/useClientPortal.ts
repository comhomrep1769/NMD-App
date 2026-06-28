'use client'
import { useEffect, useState, useCallback } from 'react'
import { getNmdToken } from '@/lib/authStorage'

export type JobPhotoEntry = {
  id: string
  photoDataUrl: string
  caption: string | null
  photoType: 'before' | 'after' | 'job' | string | null
  createdAt: string
}

export type ClientPortalData = {
  client: {
    id: string; firstName: string; lastName: string
    email: string; phone: string; address: string
  } | null
  quotes: Array<{ id: string; quoteNumber: number; serviceType: string; total: number; status: string; createdAt: string; acceptedAt: string | null }>
  invoices: Array<{ id: string; invoiceNumber: number; jobName: string; total: number; status: string; createdAt: string; paymentLinkUrl: string | null }>
  jobs: Array<{
    id: string
    title: string
    clientName: string
    address: string
    startTime: string
    endTime: string
    status: string
    notes: string | null
    createdAt: string
    photos: JobPhotoEntry[]
  }>
  recurringServices: Array<{ id: string; serviceType: string; frequency: string; price: number; status: string; nextServiceDate: string | null }>
  serviceRequests: Array<{
    id: string
    serviceType: string
    status: string
    createdAt: string
    address?: string
    preferredDate?: string | null
    preferredTime?: string | null
    notes?: string | null
    photoDataUrl?: string | null
    photoNote?: string | null
  }>
}

export function useClientPortal() {
  const [data, setData] = useState<ClientPortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    setError('')
    const token = getNmdToken()
    const API = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${API}/api/client-portal/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Could not load your portal data.'); setLoading(false) })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, reload: fetchData }
}