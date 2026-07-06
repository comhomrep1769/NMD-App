const fs = require('fs')
const f = 'frontend-next/src/app/layout.tsx'
let c = fs.readFileSync(f, 'utf8')
c = c.replace(
  "const faviconUrl = site['site.favicon_url']?.trim() || '/favicon.ico'",
  "const faviconUrl = (process.env.NEXT_PUBLIC_API_URL || '') + '/api/site-content/favicon'"
)
fs.writeFileSync(f, c, 'utf8')
console.log('layout.tsx updated:', c.includes('/api/site-content/favicon'))
