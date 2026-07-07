const fs = require('fs')
const sw = fs.readFileSync('frontend-next/src/app/schedule/page.tsx', 'utf8').replace(/\r\n/g, '\n')
const lines = sw.split('\n')
// Find the delete button
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('deleteJob')) console.log(i + ': ' + lines[i].trim().slice(0, 120))
}
console.log('---')
// Find DataTable rows render
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('rows=')) console.log(i + ': ' + lines[i].trim().slice(0, 120))
  if (lines[i].includes('StatusBadge') || lines[i].includes('status')) {
    if (lines[i].includes('badge') || lines[i].includes('Badge')) console.log(i + ': ' + lines[i].trim().slice(0, 120))
  }
}
