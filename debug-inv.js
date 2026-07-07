const fs = require('fs')
const f = 'frontend-next/src/app/invoices/page.tsx'
let c = fs.readFileSync(f, 'utf8')
const lines = c.split('\n')
for (let i = 464; i < 475; i++) {
  console.log(i + ':', JSON.stringify(lines[i]))
}
