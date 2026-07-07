const fs = require('fs')
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')
const rCRLF = rc.includes('\r\n')
let rw = rc.replace(/\r\n/g, '\n')
const lines = rw.split('\n')

// Line 718 is </button>, line 719 is the delete button, line 720 is )}
// Need to wrap both buttons in a fragment
// Find the opening of this conditional to add <>
for (let i = 710; i < 720; i++) {
  if (lines[i].includes('openQuoteModal(r)')) {
    // The <button is on the line before or at this line - find the <button
    for (let j = i; j > i - 5; j--) {
      if (lines[j].trim() === '<button') {
        lines[j] = lines[j].replace('<button', '<><button')
        console.log('Added <> at line', j)
        break
      }
    }
    break
  }
}

// Find the delete button line and add </> after it
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('deleteRequest(r.id, r.clientName)')) {
    lines[i] = lines[i].replace('</button>', '</button></>')
    console.log('Added </> at line', i)
    break
  }
}

rw = lines.join('\n')
fs.writeFileSync(rf, rCRLF ? rw.replace(/\n/g, '\r\n') : rw, 'utf8')
console.log('Done')
