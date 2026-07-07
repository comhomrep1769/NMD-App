const fs = require('fs')
const rf = 'frontend-next/src/app/requests/page.tsx'
let rw = fs.readFileSync(rf, 'utf8')

// Find the Request type to see field names
const lines = rw.split('\n')
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('clientName') || lines[i].includes('client_name') || lines[i].includes('firstName') || lines[i].includes('name:')) {
    if (i < 50) console.log(i + ': ' + lines[i].trim())
  }
}
