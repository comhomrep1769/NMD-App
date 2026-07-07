const fs = require('fs')

// Schedule - find where job cards render actions
const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8').replace(/\r\n/g, '\n')
const sLines = sc.split('\n')
for (let i = 0; i < sLines.length; i++) {
  if (sLines[i].includes('Edit') && sLines[i].includes('button')) console.log('S:', i, sLines[i].trim().slice(0, 120))
  if (sLines[i].includes('Complete') && sLines[i].includes('button')) console.log('S:', i, sLines[i].trim().slice(0, 120))
  if (sLines[i].includes('Cancel') && sLines[i].includes('button')) console.log('S:', i, sLines[i].trim().slice(0, 120))
  if (sLines[i].includes('status') && sLines[i].includes('button')) console.log('S:', i, sLines[i].trim().slice(0, 120))
}

console.log('---')

// Requests - find action buttons
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8').replace(/\r\n/g, '\n')
const rLines = rc.split('\n')
for (let i = 0; i < rLines.length; i++) {
  if (rLines[i].includes('button') && (rLines[i].includes('Quote') || rLines[i].includes('Approve') || rLines[i].includes('Reject') || rLines[i].includes('status'))) console.log('R:', i, rLines[i].trim().slice(0, 140))
}
