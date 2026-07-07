const fs = require('fs')

// Schedule - find the status render
const sw = fs.readFileSync('frontend-next/src/app/schedule/page.tsx', 'utf8').replace(/\r\n/g, '\n')
const sLines = sw.split('\n')
for (let i = 0; i < sLines.length; i++) {
  if (sLines[i].includes('Scheduled') || sLines[i].includes('Completed') || sLines[i].includes('Cancelled')) {
    console.log('S:' + i + ': ' + sLines[i].trim().slice(0, 150))
  }
}

console.log('---')

// Requests - find Convert area
const rw = fs.readFileSync('frontend-next/src/app/requests/page.tsx', 'utf8').replace(/\r\n/g, '\n')
const rLines = rw.split('\n')
for (let i = 0; i < rLines.length; i++) {
  if (rLines[i].includes('onvert') || rLines[i].includes('Quote')) {
    console.log('R:' + i + ': ' + rLines[i].trim().slice(0, 150))
  }
}
