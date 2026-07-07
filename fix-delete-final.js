const fs = require('fs')

// ── SCHEDULE - add delete button after the status column ──
const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8')
const sCRLF = sc.includes('\r\n')
let sw = sc.replace(/\r\n/g, '\n')
const sLines = sw.split('\n')

// Find the line with <option value="cancelled">Cancelled</option> and add delete button a few lines after
let cancelLine = -1
for (let i = 0; i < sLines.length; i++) {
  if (sLines[i].includes('<option value="cancelled">Cancelled</option>')) { cancelLine = i; break }
}
// Find the closing </select> after that
if (cancelLine > 0) {
  for (let i = cancelLine; i < cancelLine + 5; i++) {
    if (sLines[i].includes('</select>')) {
      sLines.splice(i + 1, 0, '              <button onClick={() => deleteJob(j.id, j.title)} disabled={deletingJobId === j.id} style={{ padding: "0.25rem 0.55rem", borderRadius: 5, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.7rem", cursor: "pointer", marginLeft: 6 }}>{deletingJobId === j.id ? "..." : "Delete"}</button>')
      console.log('S: delete button added after line', i)
      break
    }
  }
}
sw = sLines.join('\n')
fs.writeFileSync(sf, sCRLF ? sw.replace(/\n/g, '\r\n') : sw, 'utf8')
console.log('S: saved')

// ── REQUESTS - add delete button after Create Quote button ──
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')
const rCRLF = rc.includes('\r\n')
let rw = rc.replace(/\r\n/g, '\n')
const rLines = rw.split('\n')

// Find "Create Quote" text button (line 716 area)
for (let i = 0; i < rLines.length; i++) {
  if (rLines[i].trim() === 'Create Quote') {
    // Find closing </button> after it
    for (let j = i; j < i + 3; j++) {
      if (rLines[j].includes('</button>')) {
        rLines.splice(j + 1, 0, '              <button onClick={() => deleteRequest(r.id, r.clientName)} disabled={deletingReqId === r.id} style={{ padding: "0.25rem 0.55rem", borderRadius: 5, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.7rem", cursor: "pointer" }}>{deletingReqId === r.id ? "..." : "Del"}</button>')
        console.log('R: delete button added after Create Quote at line', j)
        break
      }
    }
    break
  }
}
rw = rLines.join('\n')
fs.writeFileSync(rf, rCRLF ? rw.replace(/\n/g, '\r\n') : rw, 'utf8')
console.log('R: saved')

console.log('All done')
