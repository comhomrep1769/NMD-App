const fs = require('fs')

// ── SCHEDULE ──────────────────────────────────────────────────────────────────
const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8')
const sCRLF = sc.includes('\r\n')
let sw = sc.replace(/\r\n/g, '\n')

// 1. Add deletingJobId state - find the last useState line before the useEffect
const schedStateTarget = 'const [modalError, setModalError] = useState("")'
if (!sw.includes(schedStateTarget)) { console.error('S: MISS state target'); process.exit(1) }
sw = sw.replace(schedStateTarget, schedStateTarget + '\n  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)')
console.log('S: state added')

// 2. Check if deleteJob handler already exists, if not add it
if (!sw.includes('const deleteJob')) {
  const handlerTarget = '  const update = (field: string, value: string) =>'
  if (!sw.includes(handlerTarget)) { console.error('S: MISS handler target'); process.exit(1) }
  const handler = [
    '  const deleteJob = async (jobId: string, title: string) => {',
    '    if (!confirm("Delete job \\"" + title + "\\"? This cannot be undone.")) return',
    '    setDeletingJobId(jobId)',
    '    try {',
    '      const token = getNmdToken()',
    '      const res = await fetch(API + "/api/jobs/" + jobId, { method: "DELETE", headers: { Authorization: "Bearer " + token } })',
    '      if (!res.ok) throw new Error("Failed")',
    '      setJobs(p => p.filter(j => j.id !== jobId))',
    '    } catch (err) { alert("Failed to delete job") }',
    '    setDeletingJobId(null)',
    '  }',
    '',
    '',
  ].join('\n')
  sw = sw.replace(handlerTarget, handler + handlerTarget)
  console.log('S: handler added')
} else {
  console.log('S: handler already exists')
}

// 3. Add Delete button in the STATUS column render - find the Scheduled badge area
// Look for the closing of the status column cell content
const schedBtnTarget = "j.status === 'completed' ? 'Completed' : j.status === 'cancelled' ? 'Cancelled' : 'Scheduled'"
if (!sw.includes(schedBtnTarget)) {
  console.error('S: MISS button target, looking for alternative...')
  // Try to find the status render area
  if (sw.includes("'Completed'") && sw.includes("'Cancelled'") && sw.includes("'Scheduled'")) {
    console.log('S: Found status strings but not exact match')
  }
} else {
  // Find the end of the status cell and add delete button after it
  const statusCellEnd = "j.status === 'completed' ? 'Completed' : j.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}</span>"
  if (sw.includes(statusCellEnd)) {
    sw = sw.replace(statusCellEnd, statusCellEnd + '\n              <button onClick={() => deleteJob(j.id, j.title)} disabled={deletingJobId === j.id} style={{ marginLeft: 8, padding: "0.25rem 0.55rem", borderRadius: 5, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.7rem", cursor: "pointer" }}>{deletingJobId === j.id ? "..." : "Delete"}</button>')
    console.log('S: delete button added')
  } else {
    console.error('S: MISS statusCellEnd')
  }
}

fs.writeFileSync(sf, sCRLF ? sw.replace(/\n/g, '\r\n') : sw, 'utf8')
console.log('S: schedule.tsx saved')


// ── REQUESTS ──────────────────────────────────────────────────────────────────
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')
const rCRLF = rc.includes('\r\n')
let rw = rc.replace(/\r\n/g, '\n')

// 1. Add state - check if it already exists
if (rw.includes('deletingReqId')) {
  console.log('R: state already exists')
} else {
  const reqStateTarget = 'const [loading, setLoading] = useState(true)'
  if (!rw.includes(reqStateTarget)) { console.error('R: MISS state target'); process.exit(1) }
  rw = rw.replace(reqStateTarget, reqStateTarget + '\n  const [deletingReqId, setDeletingReqId] = useState<string | null>(null)')
  console.log('R: state added')
}

// 2. Add handler if not exists
if (!rw.includes('const deleteRequest')) {
  const reqHandlerTarget = '  const handleCreateQuote = async (e: React.FormEvent) => {'
  if (!rw.includes(reqHandlerTarget)) { console.error('R: MISS handler target'); process.exit(1) }
  const handler = [
    '  const deleteRequest = async (id: string, name: string) => {',
    '    if (!confirm("Delete request from \\"" + name + "\\"? This cannot be undone.")) return',
    '    setDeletingReqId(id)',
    '    try {',
    '      const token = getNmdToken()',
    '      const res = await fetch(API + "/api/requests/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } })',
    '      if (!res.ok) throw new Error("Failed")',
    '      setRequests(p => p.filter(r => r.id !== id))',
    '    } catch (err) { alert("Failed to delete request") }',
    '    setDeletingReqId(null)',
    '  }',
    '',
    '',
  ].join('\n')
  rw = rw.replace(reqHandlerTarget, handler + reqHandlerTarget)
  console.log('R: handler added')
} else {
  console.log('R: handler already exists')
}

// 3. Add Delete button in the last column - find the Quoted/Convert buttons area
// Find the "Quoted" badge or "Convert" button which is the last action in each row
const reqBtnTarget = "}>Quoted</span>"
if (rw.includes(reqBtnTarget)) {
  rw = rw.replace(
    "}>Quoted</span>",
    "}>Quoted</span>\n              <button onClick={() => deleteRequest(r.id, r.clientName)} disabled={deletingReqId === r.id} style={{ marginLeft: 6, padding: \"0.25rem 0.55rem\", borderRadius: 5, border: \"none\", background: \"#FEF2F2\", color: \"#B91C1C\", fontWeight: 600, fontSize: \"0.7rem\", cursor: \"pointer\" }}>{deletingReqId === r.id ? \"...\" : \"Del\"}</button>"
  )
  console.log('R: delete button added after Quoted')
} else {
  console.error('R: MISS Quoted target')
}

// Also add after the Convert button for non-quoted requests
const convertTarget = "}>Convert</button>"
if (rw.includes(convertTarget)) {
  rw = rw.replace(
    "}>Convert</button>",
    "}>Convert</button>\n              <button onClick={() => deleteRequest(r.id, r.clientName)} disabled={deletingReqId === r.id} style={{ marginLeft: 6, padding: \"0.25rem 0.55rem\", borderRadius: 5, border: \"none\", background: \"#FEF2F2\", color: \"#B91C1C\", fontWeight: 600, fontSize: \"0.7rem\", cursor: \"pointer\" }}>{deletingReqId === r.id ? \"...\" : \"Del\"}</button>"
  )
  console.log('R: delete button added after Convert')
} else {
  console.error('R: MISS Convert target')
}

fs.writeFileSync(rf, rCRLF ? rw.replace(/\n/g, '\r\n') : rw, 'utf8')
console.log('R: requests.tsx saved')

console.log('\nAll done!')
