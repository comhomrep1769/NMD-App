const fs = require('fs')
const f = 'backend/src/routes/auth.ts'
let c = fs.readFileSync(f, 'utf8')
const hasCRLF = c.includes('\r\n')
let w = c.replace(/\r\n/g, '\n')

// Find and remove the seed-test-users route block
const start = w.indexOf('\nrouter.post("/seed-test-users"')
const end = w.indexOf('\nexport default router')

if (start === -1 || end === -1) {
  console.error('Could not find seed route or export. start:', start, 'end:', end)
  process.exit(1)
}

w = w.slice(0, start) + '\n' + w.slice(end)
const final = hasCRLF ? w.replace(/\n/g, '\r\n') : w
fs.writeFileSync(f, final, 'utf8')
console.log('Seed route removed. File size:', final.length)
