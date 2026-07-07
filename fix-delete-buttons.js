const fs = require('fs')

// ── PATCH schedule/page.tsx ──
const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8')

// 1. Add deletingJobId state
sc = sc.replace(
  "const [editJob, setEditJob] = useState<Job | null>(null)",
  "const [editJob, setEditJob] = useState<Job | null>(null)\n  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)"
)

// 2. Add delete handler after fetchJobs function
sc = sc.replace(
  "const saveJob = async () => {",
  "const deleteJob = async (job: Job) => {\n    if (!confirm('Delete job \"' + job.title + '\" for ' + job.clientName + '? This cannot be undone.')) return\n    setDeletingJobId(job.id)\n    try {\n      const token = getNmdToken()\n      const res = await fetch(API + '/api/jobs/' + job.id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })\n      if (!res.ok) throw new Error('Failed')\n      setJobs(p => p.filter(j => j.id !== job.id))\n    } catch (err) { alert('Failed to delete job') }\n    setDeletingJobId(null)\n  }\n\n  const saveJob = async () => {"
)

// 3. Add delete button next to the edit button in the job card
sc = sc.replace(
  "onClick={() => setEditJob(job)} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Edit</button>",
  "onClick={() => setEditJob(job)} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Edit</button>\n                      <button onClick={() => deleteJob(job)} disabled={deletingJobId === job.id} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, border: 'none', background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>{deletingJobId === job.id ? '...' : 'Delete'}</button>"
)

fs.writeFileSync(sf, sc, 'utf8')
console.log('Schedule delete done')

// ── PATCH requests/page.tsx ──
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')

// 1. Add deletingId state
rc = rc.replace(
  "const [saving, setSaving] = useState(false)",
  "const [saving, setSaving] = useState(false)\n  const [deletingId, setDeletingId] = useState<string | null>(null)"
)

// 2. Add delete handler
rc = rc.replace(
  "const updateRequest = async (",
  "const deleteRequest = async (req: ServiceRequest) => {\n    if (!confirm('Delete request from ' + req.clientName + '? This cannot be undone.')) return\n    setDeletingId(req.id)\n    try {\n      const token = getNmdToken()\n      const res = await fetch(API + '/api/requests/' + req.id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })\n      if (!res.ok) throw new Error('Failed')\n      setRequests(p => p.filter(r => r.id !== req.id))\n      if (selected?.id === req.id) setSelected(null)\n    } catch (err) { alert('Failed to delete request') }\n    setDeletingId(null)\n  }\n\n  const updateRequest = async ("
)

// 3. Add delete button - find the Convert to Quote button and add Delete after it
rc = rc.replace(
  "Convert to Quote</button>\n              </div>",
  "Convert to Quote</button>\n                <button onClick={() => selected && deleteRequest(selected)} disabled={deletingId === selected?.id} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>{deletingId === selected?.id ? 'Deleting...' : 'Delete Request'}</button>\n              </div>"
)

fs.writeFileSync(rf, rc, 'utf8')
console.log('Requests delete done')

console.log('All done')
