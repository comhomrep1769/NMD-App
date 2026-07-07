const fs = require('fs')

const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8').replace(/\r\n/g, '\n')
const sLines = sc.split('\n')
for (let i = 0; i < sLines.length; i++) {
  if (sLines[i].includes('useState') && sLines[i].includes('edit')) console.log('S-edit:', i, sLines[i].trim())
  if (sLines[i].includes('useState') && sLines[i].includes('null')) console.log('S-null:', i, sLines[i].trim())
  if (sLines[i].includes('const save') || sLines[i].includes('const update')) console.log('S-fn:', i, sLines[i].trim())
  if (sLines[i].includes('Edit</')) console.log('S-btn:', i, sLines[i].trim())
}

console.log('---')

const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8').replace(/\r\n/g, '\n')
const rLines = rc.split('\n')
for (let i = 0; i < rLines.length; i++) {
  if (rLines[i].includes('useState') && rLines[i].includes('saving') || rLines[i].includes('useState') && rLines[i].includes('loading')) console.log('R-state:', i, rLines[i].trim())
  if (rLines[i].includes('const update') || rLines[i].includes('const handle')) console.log('R-fn:', i, rLines[i].trim())
  if (rLines[i].includes('Convert') || rLines[i].includes('convert')) console.log('R-convert:', i, rLines[i].trim())
}
