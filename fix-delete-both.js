const fs = require('fs')

// ── SCHEDULE ──
const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8')
const sCRLF = sc.includes('\r\n')
let sw = sc.replace(/\r\n/g, '\n')

// Find the line numbers we need
const sLines = sw.split('\n')

// Add state after existing useState lines - find the last useState
let lastUseState = -1
for (let i = 0; i < sLines.length; i++) {
  if (sLines[i].includes('useState')) lastUseState = i
}
if (lastUseState > 0) {
  sLines.splice(lastUseState + 1, 0, '  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)')
  console.log('S: state added after line', lastUseState)
}

// Add delete handler before the update function at line 67
let updateLine = -1
for (let i = 0; i < sLines.length; i++) {
  if (sLines[i].includes('const update = (field: string, value: string) =>')) { updateLine = i; break }
}
if (updateLine > 0) {
  const handler = [
    '',
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
  ]
  sLines.splice(updateLine, 0, ...handler)
  console.log('S: handler added before line', updateLine)
}

// Find where status buttons are (around line 206) and add delete button
// Look for the last status button in each job card
for (let i = sLines.length - 1; i >= 0; i--) {
  if (sLines[i].includes("'completed'})}>Complete</button>")) {
    sLines.splice(i + 1, 0, '                    <button onClick={() => deleteJob(j.id, j.title)} disabled={deletingJobId === j.id} style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.72rem", cursor: "pointer" }}>{deletingJobId === j.id ? "..." : "Delete"}</button>')
    console.log('S: delete button added after line', i)
    break
  }
}

sw = sLines.join('\n')
fs.writeFileSync(sf, sCRLF ? sw.replace(/\n/g, '\r\n') : sw, 'utf8')
console.log('Schedule patched')

// ── REQUESTS ──
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')
const rCRLF = rc.includes('\r\n')
let rw = rc.replace(/\r\n/g, '\n')
const rLines = rw.split('\n')

// Add state
let rLastState = -1
for (let i = 0; i < rLines.length; i++) {
  if (rLines[i].includes('useState')) rLastState = i
}
if (rLastState > 0) {
  rLines.splice(rLastState + 1, 0, '  const [deletingReqId, setDeletingReqId] = useState<string | null>(null)')
  console.log('R: state added after line', rLastState)
}

// Add handler before handleCreateQuote
let createQuoteLine = -1
for (let i = 0; i < rLines.length; i++) {
  if (rLines[i].includes('const handleCreateQuote = async')) { createQuoteLine = i; break }
}
if (createQuoteLine > 0) {
  const handler = [
    '',
    '  const deleteRequest = async (id: string, name: string) => {',
    '    if (!confirm("Delete request from \\"" + name + "\\"? This cannot be undone.")) return',
    '    setDeletingReqId(id)',
    '    try {',
    '      const token = getNmdToken()',
    '      const res = await fetch(API + "/api/requests/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } })',
    '      if (!res.ok) throw new Error("Failed")',
    '      setRequests(p => p.filter(r => r.id !== id))',
    '      if (selected?.id === id) setSelected(null)',
    '    } catch (err) { alert("Failed to delete request") }',
    '    setDeletingReqId(null)',
    '  }',
    '',
  ]
  rLines.splice(createQuoteLine, 0, ...handler)
  console.log('R: handler added before line', createQuoteLine)
}

// Add delete button after Create Quote button
for (let i = rLines.length - 1; i >= 0; i--) {
  if (rLines[i].includes('Create Quote</button>')) {
    rLines.splice(i + 1, 0, '                <button onClick={() => selected && deleteRequest(selected.id, selected.clientName)} disabled={deletingReqId === selected?.id} style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>{deletingReqId === selected?.id ? "Deleting..." : "Delete Request"}</button>')
    console.log('R: delete button added after line', i)
    break
  }
}

rw = rLines.join('\n')
fs.writeFileSync(rf, rCRLF ? rw.replace(/\n/g, '\r\n') : rw, 'utf8')
console.log('Requests patched')
console.log('All done')
