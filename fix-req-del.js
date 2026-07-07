const fs = require('fs')
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')
const rCRLF = rc.includes('\r\n')
let rw = rc.replace(/\r\n/g, '\n')
const lines = rw.split('\n')

// Find the closing </div> after the Quoted span (line 731)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'Quoted'</span>")) {
    // Next line should be )}, then </div>
    for (let j = i + 1; j < i + 5; j++) {
      if (lines[j].trim() === '</div>') {
        lines.splice(j, 0, '              <button onClick={() => deleteRequest(r.id, r.clientName)} disabled={deletingReqId === r.id} style={{ padding: "0.25rem 0.5rem", borderRadius: 5, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.7rem", cursor: "pointer" }}>{deletingReqId === r.id ? "..." : "Del"}</button>')
        console.log('Delete button added at line', j)
        break
      }
    }
    break
  }
}

rw = lines.join('\n')
fs.writeFileSync(rf, rCRLF ? rw.replace(/\n/g, '\r\n') : rw, 'utf8')
console.log('Done')
