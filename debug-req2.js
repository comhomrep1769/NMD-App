const fs = require('fs')
const rw = fs.readFileSync('frontend-next/src/app/requests/page.tsx', 'utf8').replace(/\r\n/g, '\n')
const lines = rw.split('\n')
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('deleteRequest') || lines[i].includes('deletingReq') || lines[i].includes('Del</')) {
    console.log(i + ': ' + lines[i].trim().slice(0, 130))
  }
}
console.log('---')
// Find the Signature and Quoted buttons
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Signature</') || lines[i].includes('Quoted</') || lines[i].includes('Del</')) {
    console.log(i + ': ' + lines[i].trim().slice(0, 130))
  }
}
