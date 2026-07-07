const fs = require('fs')

// Fix schedule - remove duplicate state declaration (line 42)
const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8')
const sCRLF = sc.includes('\r\n')
let sw = sc.replace(/\r\n/g, '\n')
const sLines = sw.split('\n')

// Remove only the SECOND occurrence of deletingJobId state (line 41, 0-indexed)
let found = 0
for (let i = 0; i < sLines.length; i++) {
  if (sLines[i].includes('const [deletingJobId, setDeletingJobId]')) {
    found++
    if (found === 2) {
      sLines.splice(i, 1)
      console.log('S: removed duplicate state at line', i)
      break
    }
  }
}
sw = sLines.join('\n')
fs.writeFileSync(sf, sCRLF ? sw.replace(/\n/g, '\r\n') : sw, 'utf8')
console.log('S: saved')

// Fix requests - move delete button inside the conditional block
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')
const rCRLF = rc.includes('\r\n')
let rw = rc.replace(/\r\n/g, '\n')

// The button is at the wrong nesting level - it should be before </button>'s closing parent
// Remove the misplaced button line and add it correctly before the closing of the Create Quote conditional
rw = rw.replace(
  '                </button>\n              <button onClick={() => deleteRequest(r.id, r.clientName)} disabled={deletingReqId ===',
  '                </button>\n                <button onClick={() => deleteRequest(r.id, r.clientName)} disabled={deletingReqId ==='
)

fs.writeFileSync(rf, rCRLF ? rw.replace(/\n/g, '\r\n') : rw, 'utf8')
console.log('R: saved')
console.log('Done')
