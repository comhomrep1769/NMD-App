'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { getNmdToken } from '@/lib/authStorage'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://nmd-backend.onrender.com'

const CATEGORIES = ['Residential', 'Commercial', 'Industrial', 'Specialty', 'Seasonal'] as const

type GalleryJob = {
  id: string
  title: string
  serviceCategory: string
  city: string
  state: string
  description: string | null
  jobDate: string | null
  displayOrder: number
  isPublished: boolean
  beforeImage: string
  afterImage: string
  createdAt: string
}

type Draft = {
  title: string
  serviceCategory: string
  city: string
  state: string
  description: string
  jobDate: string
  displayOrder: number
  isPublished: boolean
  beforeImage: string
  afterImage: string
}

const EMPTY_DRAFT: Draft = {
  title: '', serviceCategory: 'Residential', city: '', state: 'FL',
  description: '', jobDate: '', displayOrder: 0, isPublished: false,
  beforeImage: '', afterImage: '',
}

const card: React.CSSProperties = {
  background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.25rem',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid #E5E7EB',
  fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', color: '#111827', outline: 'none',
  boxSizing: 'border-box', background: 'white',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 6,
}
const btnPrimary: React.CSSProperties = {
  padding: '0.55rem 1.1rem', borderRadius: 8, border: 'none', background: '#0F766E',
  color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
}
const btnGhost: React.CSSProperties = {
  padding: '0.55rem 1.1rem', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white',
  color: '#374151', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
}

export default function GalleryAdminPage() {
  const [items, setItems] = useState<GalleryJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const beforeRef = useRef<HTMLInputElement | null>(null)
  const afterRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    const token = getNmdToken()
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`${API}/api/gallery/admin`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to load gallery.')
      setItems(d.items || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load gallery.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const readImage = (slot: 'beforeImage' | 'afterImage', files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (file.size > 7_000_000) { alert('Image too large. Keep it under 7MB.'); return }
    const reader = new FileReader()
    reader.onload = e => setDraft(prev => ({ ...prev, [slot]: (e.target?.result as string) || '' }))
    reader.readAsDataURL(file)
  }

  const openNew = () => { setDraft(EMPTY_DRAFT); setEditingId(null); setShowForm(true) }

  const openEdit = (job: GalleryJob) => {
    setDraft({
      title: job.title, serviceCategory: job.serviceCategory, city: job.city, state: job.state,
      description: job.description || '', jobDate: job.jobDate ? job.jobDate.substring(0, 10) : '',
      displayOrder: job.displayOrder, isPublished: job.isPublished,
      beforeImage: job.beforeImage, afterImage: job.afterImage,
    })
    setEditingId(job.id)
    setShowForm(true)
  }

  const save = async () => {
    if (!draft.title.trim()) { alert('Add a title.'); return }
    if (!draft.city.trim()) { alert('Add a city.'); return }
    if (!draft.beforeImage) { alert('A before photo is required.'); return }
    if (!draft.afterImage) { alert('An after photo is required.'); return }

    const token = getNmdToken()
    setSaving(true)
    try {
      const url = editingId ? `${API}/api/gallery/${editingId}` : `${API}/api/gallery`
      const r = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Save failed.')
      setShowForm(false)
      setEditingId(null)
      setDraft(EMPTY_DRAFT)
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (job: GalleryJob) => {
    const token = getNmdToken()
    try {
      const r = await fetch(`${API}/api/gallery/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPublished: !job.isPublished }),
      })
      if (!r.ok) throw new Error('Update failed.')
      await load()
    } catch {
      alert('Could not update that entry.')
    }
  }

  const remove = async (job: GalleryJob) => {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return
    const token = getNmdToken()
    try {
      const r = await fetch(`${API}/api/gallery/${job.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error('Delete failed.')
      await load()
    } catch {
      alert('Could not delete that entry.')
    }
  }

  const publishedCount = items.filter(i => i.isPublished).length

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <div style={{ maxWidth: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0F766E', marginBottom: 6 }}>NMD Portal</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>Gallery</h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              Before and after photos shown on the homepage. {publishedCount} published of {items.length}.
            </p>
          </div>
          <button onClick={openNew} style={btnPrimary}>Add a job</button>
        </div>

        {showForm && (
          <div style={{ ...card, marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 18 }}>
              {editingId ? 'Edit job' : 'Add a job'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Service title</label>
                <input style={inputStyle} value={draft.title} placeholder="Driveway Cleaning"
                  onChange={e => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={draft.serviceCategory}
                  onChange={e => setDraft({ ...draft, serviceCategory: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={draft.city} placeholder="Winter Park"
                  onChange={e => setDraft({ ...draft, city: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={draft.state}
                  onChange={e => setDraft({ ...draft, state: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Job date</label>
                <input type="date" style={inputStyle} value={draft.jobDate}
                  onChange={e => setDraft({ ...draft, jobDate: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Display order</label>
                <input type="number" style={inputStyle} value={draft.displayOrder}
                  onChange={e => setDraft({ ...draft, displayOrder: Number(e.target.value) })} />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>One line about the job (optional)</label>
              <input style={inputStyle} value={draft.description}
                placeholder="Six years of algae off 900 sq ft of concrete."
                onChange={e => setDraft({ ...draft, description: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 18 }}>
              {([
                ['beforeImage', 'Before photo', beforeRef],
                ['afterImage', 'After photo', afterRef],
              ] as const).map(([slot, label, ref]) => (
                <div key={slot}>
                  <label style={labelStyle}>{label}</label>
                  {draft[slot] ? (
                    <img src={draft[slot]} alt={label} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 8 }} />
                  ) : (
                    <div style={{ width: '100%', height: 160, borderRadius: 8, border: '1.5px dashed #E5E7EB', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#9CA3AF' }}>
                      No photo yet
                    </div>
                  )}
                  <input ref={el => { ref.current = el }} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { readImage(slot, e.target.files); e.target.value = '' }} />
                  <button onClick={() => ref.current?.click()} style={{ ...btnGhost, width: '100%' }}>
                    {draft[slot] ? 'Replace photo' : 'Upload photo'}
                  </button>
                </div>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#374151', marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.isPublished}
                onChange={e => setDraft({ ...draft, isPublished: e.target.checked })} />
              Show this on the homepage
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add to gallery'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); setDraft(EMPTY_DRAFT) }} style={btnGhost}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ ...card, color: '#6B7280', fontSize: '0.85rem' }}>Loading gallery...</div>
        ) : error ? (
          <div style={{ ...card, borderColor: '#FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: '0.85rem' }}>{error}</div>
        ) : items.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827', marginBottom: 6 }}>No jobs in the gallery yet</div>
            <div style={{ fontSize: '0.85rem', color: '#6B7280', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
              The homepage gallery section stays hidden until at least one job is published here.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {items.map(job => (
              <div key={job.id} style={{ ...card, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <img src={job.beforeImage} alt="" style={{ width: 84, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #E5E7EB' }} />
                  <img src={job.afterImage} alt="" style={{ width: 84, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #E5E7EB' }} />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{job.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 2 }}>
                    {job.city}, {job.state} · {job.serviceCategory}
                    {job.jobDate ? ` · ${new Date(job.jobDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: 6,
                  background: job.isPublished ? '#F0FDF9' : '#FEF9C3',
                  color: job.isPublished ? '#059669' : '#92400E',
                }}>
                  {job.isPublished ? 'Published' : 'Draft'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => togglePublish(job)} style={btnGhost}>
                    {job.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => openEdit(job)} style={btnGhost}>Edit</button>
                  <button onClick={() => remove(job)} style={{ ...btnGhost, color: '#B91C1C', borderColor: '#FECACA' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  )
}