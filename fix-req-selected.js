const fs = require('fs')
const f = 'frontend-next/src/app/requests/page.tsx'
let c = fs.readFileSync(f, 'utf8')
c = c.replace('      if (selected?.id === id) setSelected(null)\n', '')
c = c.replace('      if (selected?.id === id) setSelected(null)\r\n', '')
fs.writeFileSync(f, c, 'utf8')
console.log('Done')
