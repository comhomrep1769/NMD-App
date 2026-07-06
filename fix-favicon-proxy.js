const fs = require('fs')
const f = 'frontend-next/src/app/layout.tsx'
let c = fs.readFileSync(f, 'utf8')
c = c.replace(
  "const faviconUrl = 'https://nmd-backend.onrender.com/api/site-content/favicon'",
  "const faviconUrl = '/api/favicon'"
)
fs.writeFileSync(f, c, 'utf8')
console.log('Done:', c.includes("'/api/favicon'"))
