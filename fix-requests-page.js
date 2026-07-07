const fs = require('fs')
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')
const rCRLF = rc.includes('\r\n')
let rw = rc.replace(/\r\n/g, '\n')
const lines = rw.split('\n')

// Fix 1: Remove <> from line 713 area
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<><button')) {
    lines[i] = lines[i].replace('<><button', '<button')
    console.log('Removed <> from line', i)
  }
}

// Fix 2: Remove the entire broken delete button line and its </> 
const newLines = []
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('deleteRequest(r.id, r.clientName)')) {
    console.log('Removed delete button line', i)
    continue // skip this line entirely
  }
  newLines.push(lines[i])
}

// Fix 3: Also remove the stray Quoted delete button if present
const finalLines = []
for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].includes('deletingReqId === r.id')) {
    console.log('Removed stray delete ref line', i)
    continue
  }
  finalLines.push(newLines[i])
}

rw = finalLines.join('\n')

// Now add the delete button properly as a new column in the DataTable
// Find the last column definition closing - look for the Signature/Quoted column end
// Add a clean "Actions" approach: put delete in each row's last cell

// Find where "Quoted</span>" is rendered and add delete after the parent div closes
const quotedIdx = rw.indexOf("}>Quoted</span>")
if (quotedIdx > -1) {
  console.log('Found Quoted span')
}

// Better approach: add delete button inside the existing render, after Signature button
// Find: Signature</button>
const sigTarget = 'Signature</button>'
const sigIdx = rw.lastIndexOf(sigTarget)
if (sigIdx > -1) {
  const after = sigIdx + sigTarget.length
  const deleteBtn = '\n              <button onClick={() => { if (confirm("Delete request from " + r.clientName + "? This cannot be undone.")) { const token = getNmdToken(); fetch(API + "/api/requests/" + r.id, { method: "DELETE", headers: { Authorization: "Bearer " + token } }).then(res => { if (res.ok) setRequests(p => p.filter(x => x.id !== r.id)) }).catch(() => alert("Failed")) } }} style={{ padding: "0.25rem 0.5rem", borderRadius: 5, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0.7rem", cursor: "pointer", marginLeft: 4 }}>Del</button>'
  rw = rw.slice(0, after) + deleteBtn + rw.slice(after)
  console.log('Delete button added after Signature button')
}

// Remove deletingReqId state and handler since we're using inline now
// Actually keep them removed - the inline approach doesn't need separate state

fs.writeFileSync(rf, rCRLF ? rw.replace(/\n/g, '\r\n') : rw, 'utf8')
console.log('requests/page.tsx fixed and saved')
