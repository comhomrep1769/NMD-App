const fs = require('fs')
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')
const rCRLF = rc.includes('\r\n')
let rw = rc.replace(/\r\n/g, '\n')

// 1. Remove the existing misplaced delete button
const lines = rw.split('\n')
const newLines = lines.filter(l => !l.includes('deleteRequest(r.id, r.clientName)'))
rw = newLines.join('\n')
console.log('Removed old button')

// 2. Add ACTIONS column header to DataTable columns prop
// Find the columns array and add '' at the end
rw = rw.replace(
  "columns={['CLIENT', 'SERVICE', 'CONTACT', 'PREFERRED DATE', 'STATUS', 'RECEIVED', '']}",
  "columns={['CLIENT', 'SERVICE', 'CONTACT', 'PREFERRED DATE', 'STATUS', 'RECEIVED', '', '']}"
)
console.log('Added column header')

// 3. Add delete button as last element in each row array
// Find the closing of the rows array: ])} before />
// The pattern is: the last element before ])} is the div with Signature/Quoted/etc
rw = rw.replace(
  /(\s*<\/div>\s*\n\s*\]\)\})/g,
  (match, group) => {
    // Only replace the first occurrence (the rows map)
    return match
  }
)

// More targeted: find the exact spot. The rows end with </div>\n          ])}
// Add delete button element before the ])
rw = rw.replace(
  "            </div>\n          ])}\n        />",
  "            </div>,\n            <button key=\"del\" onClick={() => deleteRequest(r.id, r.clientName)} disabled={deletingReqId === r.id} style={{ padding: '0.25rem 0.5rem', borderRadius: 5, border: 'none', background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer' }}>{deletingReqId === r.id ? '...' : 'Del'}</button>\n          ])}\n        />"
)
console.log('Added delete as new column')

fs.writeFileSync(rf, rCRLF ? rw.replace(/\n/g, '\r\n') : rw, 'utf8')
console.log('Done')
