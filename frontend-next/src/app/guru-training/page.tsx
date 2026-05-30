'use client'

import { useState, useEffect } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard, SectionHeader } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type GuruEntry = {
  id: number
  category: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

const CATEGORIES = ['All', 'Treatment Notes', 'Pricing Info', 'FAQ', 'Company Policy', 'General']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8,
  border: '1.5px solid #dde4ef', fontSize: '0.875rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', color: '#0e1117',
  background: '#f4f7fb', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 500, color: '#3a4660', display: 'block', marginBottom: 4,
}

export default function GuruTrainingPage() {
  const [entries, setEntries] = useState<GuruEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<GuruEntry | null>(null)
  const [form, setForm] = useState({ category: 'Treatment Notes', title: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL || ''

  const load = async () => {
    setLoading(true)
    try {
      const token = getNmdToken()
      const params = new URLSearchParams()
      if (activeCategory !== 'All') params.set('category', activeCategory)
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`${API}/api/guru-training?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : (data.entries || []))
    } catch {
      setError('Could not load Guru training data.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [activeCategory, search])

  const openAdd = () => {
    setEditEntry(null)
    setForm({ category: 'Treatment Notes', title: '', content: '' })
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (entry: GuruEntry) => {
    setEditEntry(entry)
    setForm({ category: entry.category, title: entry.title, content: entry.content })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and content are required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const token = getNmdToken()
      const url = editEntry
        ? `${API}/api/guru-training/${editEntry.id}`
        : `${API}/api/guru-training`
      const res = await fetch(url, {
        method: editEntry ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Save failed')
      setShowForm(false)
      load()
    } catch {
      setFormError('Failed to save entry. Please try again.')
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    setDeleting(true)
    try {
      const token = getNmdToken()
      await fetch(`${API}/api/guru-training/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setDeleteId(null)
      load()
    } catch {
      alert('Failed to delete entry.')
    }
    setDeleting(false)
  }

  const filtered = entries.filter(e =>
    search.trim()
      ? e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.content.toLowerCase().includes(search.toLowerCase())
      : true
  )

  const categoryColor: Record<string, string> = {
    'Treatment Notes': '#1f6132',
    'Pricing Info': '#124d83',
    'FAQ': '#7c3aed',
    'Company Policy': '#b45309',
    'General': '#5a6a88',
  }

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>

      {/* Delete confirm modal */}
      {deleteId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(14,17,23,0.2)' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117', marginBottom: 8 }}>Delete Entry</div>
            <p style={{ fontSize: '0.875rem', color: '#5a6a88', marginBottom: '1.25rem' }}>Are you sure you want to delete this training entry? Guru will no longer have access to this knowledge.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting} style={{ flex: 1, padding: '0.65rem', borderRadius: 8, border: 'none', background: '#e74c3c', color: 'white', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,17,23,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(14,17,23,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #dde4ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0e1117' }}>
                {editEntry ? 'Edit Training Entry' : 'Add Training Entry'}
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#8494b0' }}>×</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
              {formError && (
                <div style={{ background: '#fff0f0', border: '1.5px solid #ffc0c0', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#c0392b' }}>{formError}</div>
              )}
              <div>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. House Washing SH Mix Ratio" />
              </div>
              <div>
                <label style={labelStyle}>Content *</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 140 }}
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Enter the training content, pricing details, treatment notes, or FAQ answer..."
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: 8, border: '1.5px solid #dde4ef', background: 'white', color: '#5a6a88', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '0.7rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : editEntry ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="Guru Training"
        sub={`${entries.length} entries — knowledge Guru uses to answer questions and give estimates`}
        action={
          <button onClick={openAdd} style={{ padding: '0.6rem 1.1rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            + Add Entry
          </button>
        }
      />

      {/* Search + category filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search entries..."
          style={{ ...inputStyle, maxWidth: 280, marginBottom: 0 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.35rem 0.85rem', borderRadius: 20, border: '1.5px solid',
                borderColor: activeCategory === cat ? '#1f6132' : '#dde4ef',
                background: activeCategory === cat ? '#eaf7ef' : 'white',
                color: activeCategory === cat ? '#1f6132' : '#5a6a88',
                fontWeight: activeCategory === cat ? 700 : 400,
                fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', padding: '3rem', textAlign: 'center', color: '#8494b0' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>AI</div>
          <div style={{ fontWeight: 600, color: '#3a4660', marginBottom: 6 }}>No training entries yet</div>
          <div style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Add treatment notes, pricing info, and FAQs to train Guru.</div>
          <button onClick={openAdd} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg, #1f6132, #124d83)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            + Add First Entry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {filtered.map(entry => (
            <div key={entry.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #dde4ef', padding: '1.1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: `${categoryColor[entry.category] || '#5a6a88'}18`,
                    color: categoryColor[entry.category] || '#5a6a88',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {entry.category}
                  </span>
                  <span style={{ fontWeight: 600, color: '#0e1117', fontSize: '0.9rem' }}>{entry.title}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#5a6a88', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {entry.content.length > 200 ? entry.content.slice(0, 200) + '...' : entry.content}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEdit(entry)} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: '1px solid #dde4ef', background: 'white', color: '#3a4660', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Edit</button>
                <button onClick={() => setDeleteId(entry.id)} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#e74c3c', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  )
}