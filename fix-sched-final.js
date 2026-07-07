const fs = require('fs')
const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8')
const sCRLF = sc.includes('\r\n')
let sw = sc.replace(/\r\n/g, '\n')
const lines = sw.split('\n')

// 1. Remove misplaced button from line 168
const newLines = []
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('deleteJob(j.id, j.title)')) {
    console.log('Removed misplaced button from line', i)
    continue
  }
  newLines.push(lines[i])
}

// 2. Add delete button after StatusBadge in DataTable
for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].includes('<StatusBadge key="status" status={j.status} />')) {
    newLines[i] = newLines[i] + ',\n              <button key="del" onClick={() => deleteJob(j.id, j.title)} disabled={deletingJobId === j.id} style={{ padding: "0.25rem 0.5rem", borderRadius: 5, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.7rem", cursor: "pointer" }}>{deletingJobId === j.id ? "..." : "Delete"}</button>'
    console.log('Added delete button after StatusBadge at line', i)
    break
  }
}

sw = newLines.join('\n')
fs.writeFileSync(sf, sCRLF ? sw.replace(/\n/g, '\r\n') : sw, 'utf8')
console.log('Done')
