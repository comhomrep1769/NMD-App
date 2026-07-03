'use client'
import { useEffect, useState, useRef } from 'react'
import PortalShell from '@/components/portal/PortalShell'
import { LoadingCard, ErrorCard } from '@/components/portal/PortalUI'
import { getNmdToken } from '@/lib/authStorage'

type ContentItem = {
  id: string; key: string; value: string; valueType: string
  section: string; page: string; label: string; sortOrder: number; updatedAt: string
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Homepage', login: 'Login & Auth Pages', global: 'Site-wide',
}

const FIELD_HINTS: Record<string, string> = {
  'seo.global.search_console_verification': "Paste only the verification code Google gives you — e.g. from <meta name=\"google-site-verification\" content=\"THIS PART\" />, not the whole tag.",
  'scripts.head': "Paste Google Tag Manager or Facebook Pixel <script> tags here. Injected into <head>. Put <noscript> fallbacks in Body Start below.",
  'scripts.body_start': "Injected immediately after <body> opens. Use for GTM or Facebook Pixel <noscript> iframe fallbacks.",
  'scripts.body_end': "Injected just before </body> closes. Good for chat widgets, analytics, or any deferred scripts.",
}

type Tab = 'content' | 'images' | 'seo' | 'scripts'

export default function SiteContentPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('content')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const API = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/site-content/admin`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || d.message || `Request failed (${r.status})`); return d })
      .then(d => {
        const list: ContentItem[] = d.items || []
        setItems(list)
        const initialDrafts: Record<string, string> = {}
        list.forEach(i => { initialDrafts[i.key] = i.value })
        setDrafts(initialDrafts)
        setLoading(false)
      })
      .catch(err => { setError(err instanceof Error ? err.message : 'Could not load site content.'); setLoading(false) })
  }, [])

  const updateDraft = (key: string, value: string) => setDrafts(prev => ({ ...prev, [key]: value }))

  const saveItem = async (key: string) => {
    setSavingKey(key); setSavedKey(null)
    const token = getNmdToken()
    try {
      const res = await fetch(`${API}/api/site-content/${encodeURIComponent(key)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: drafts[key] ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setItems(prev => prev.map(i => i.key === key ? { ...i, value: drafts[key] ?? '' } : i))
      setSavedKey(key); setTimeout(() => setSavedKey(k => (k === key ? null : k)), 2000)
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save') }
    setSavingKey(null)
  }

  const handleImageUpload = (key: string, files: FileList | null) => {
    const file = files?.[0]; if (!file) return
    if (file.size > 10_000_000) { alert('Image too large. Max 10MB.'); return }
    const reader = new FileReader()
    reader.onload = (e) => { const dataUrl = e.target?.result as string; updateDraft(key, dataUrl) }
    reader.readAsDataURL(file)
  }

  const SaveButton = ({ item }: { item: ContentItem }) => {
    const draft = drafts[item.key] ?? ''; const dirty = draft !== item.value
    const isSaving = savingKey === item.key; const justSaved = savedKey === item.key
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {justSaved && <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Saved</span>}
        <button onClick={() => saveItem(item.key)} disabled={!dirty || isSaving}
          style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', background: !dirty || isSaving ? '#E5E7EB' : '#0F766E', color: !dirty || isSaving ? '#9CA3AF' : 'white', fontWeight: 600, fontSize: '0.78rem', cursor: !dirty || isSaving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    )
  }

  const FieldCard = ({ item, imageStyle }: { item: ContentItem; imageStyle?: boolean }) => {
    const draft = drafts[item.key] ?? ''; const hint = FIELD_HINTS[item.key]
    return (
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: imageStyle ? '1rem' : '1rem 1.25rem', display: imageStyle ? 'flex' : undefined, flexDirection: imageStyle ? 'column' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{item.label}</label>
          <SaveButton item={item} />
        </div>
        {hint && <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 6, lineHeight: 1.4 }}>{hint}</div>}
        {item.valueType === 'image' ? (
          <>
            {draft && <img src={draft} alt={item.label} style={{ width: '100%', height: imageStyle ? 160 : 180, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={draft} onChange={e => updateDraft(item.key, e.target.value)} placeholder="Image URL" style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.78rem', fontFamily: 'DM Sans, sans-serif', color: '#111827', outline: 'none' }} />
              <input ref={el => { fileRefs.current[item.key] = el }} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleImageUpload(item.key, e.target.files); e.target.value = '' }} />
              <button onClick={() => fileRefs.current[item.key]?.click()} style={{ padding: '0.5rem 0.9rem', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>Upload</button>
            </div>
          </>
        ) : item.valueType === 'code' ? (
          <textarea value={draft} onChange={e => updateDraft(item.key, e.target.value)} rows={8} spellCheck={false} placeholder="Paste your code here (include full <script> tags)..."
            style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.78rem', fontFamily: 'monospace', color: '#111827', outline: 'none', resize: 'vertical', boxSizing: 'border-box', background: '#F9FAFB', lineHeight: 1.6 }} />
        ) : item.valueType === 'richtext' ? (
          <textarea value={draft} onChange={e => updateDraft(item.key, e.target.value)} rows={3}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', color: '#111827', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        ) : (
          <input value={draft} onChange={e => updateDraft(item.key, e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
        )}
      </div>
    )
  }

  const contentItems = items.filter(i => i.section === 'content' && i.valueType !== 'image')
  const imageItems = items.filter(i => i.section === 'content' && i.valueType === 'image')
  const seoItems = items.filter(i => i.section === 'seo')
  const scriptItems = items.filter(i => i.section === 'scripts')
  const contentPages = Array.from(new Set(contentItems.map(i => i.page)))
  const imagePages = Array.from(new Set(imageItems.map(i => i.page)))
  const seoPages = Array.from(new Set(seoItems.map(i => i.page)))
  const scriptPages = Array.from(new Set(scriptItems.map(i => i.page)))

  const TABS: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'content', label: 'Content', count: contentItems.length },
    { key: 'images', label: 'Images', count: imageItems.length },
    { key: 'seo', label: 'SEO', count: seoItems.length },
    { key: 'scripts', label: 'Scripts', count: scriptItems.length },
  ]

  return (
    <PortalShell requiredRole={['admin', 'superadmin']}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>NMD Portal</div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: 6 }}>Site Content</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Edit titles, text, images, SEO settings, and tracking scripts shown on the public website.</p>
      </div>

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: tab === t.key ? '#0F766E' : '#6B7280', borderBottom: tab === t.key ? '2px solid #0F766E' : '2px solid transparent', marginBottom: '-1px' }}>
                {t.label} {t.count > 0 && <span style={{ color: '#9CA3AF', fontWeight: 500 }}>({t.count})</span>}
              </button>
            ))}
          </div>

          {tab === 'content' && contentPages.map(page => (
            <div key={page} style={{ marginBottom: '2rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '1rem' }}>{PAGE_LABELS[page] || page}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {contentItems.filter(i => i.page === page).map(item => <FieldCard key={item.key} item={item} />)}
              </div>
            </div>
          ))}
          {tab === 'content' && contentPages.length === 0 && <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '2.5rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>No text content fields yet.</div>}

          {tab === 'images' && imagePages.map(page => (
            <div key={page} style={{ marginBottom: '2rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '1rem' }}>{PAGE_LABELS[page] || page}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {imageItems.filter(i => i.page === page).map(item => <FieldCard key={item.key} item={item} imageStyle />)}
              </div>
            </div>
          ))}
          {tab === 'images' && imagePages.length === 0 && <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '2.5rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>No image fields yet.</div>}

          {tab === 'seo' && seoPages.map(page => (
            <div key={page} style={{ marginBottom: '2rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '1rem' }}>{PAGE_LABELS[page] || page}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {seoItems.filter(i => i.page === page).map(item => <FieldCard key={item.key} item={item} />)}
              </div>
            </div>
          ))}
          {tab === 'seo' && seoPages.length === 0 && (
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 8 }}>No SEO fields configured yet</div>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>Title, meta description, and social share image fields will appear here.</div>
            </div>
          )}

          {tab === 'scripts' && (
            <>
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#92400E', lineHeight: 1.6 }}>
                Scripts are injected directly into the page HTML and go live as soon as you save — no redeploy needed. Paste full code blocks including &lt;script&gt; tags.
              </div>
              {scriptPages.map(page => (
                <div key={page} style={{ marginBottom: '2rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '1rem' }}>{PAGE_LABELS[page] || page}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {scriptItems.filter(i => i.page === page).map(item => <FieldCard key={item.key} item={item} />)}
                  </div>
                </div>
              ))}
              {scriptPages.length === 0 && <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '2.5rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>No script fields yet.</div>}
            </>
          )}
        </>
      )}
    </PortalShell>
  )
}
