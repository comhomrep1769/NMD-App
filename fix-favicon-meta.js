const fs = require('fs')
const f = 'frontend-next/src/app/layout.tsx'
let c = fs.readFileSync(f, 'utf8')

// Add icons to generateMetadata return object
c = c.replace(
  "alternates: { canonical: 'https://nmdpowash.com' },",
  "alternates: { canonical: 'https://nmdpowash.com' },\n    icons: { icon: '/api/favicon', shortcut: '/api/favicon', apple: '/api/favicon' },"
)

// Remove the manual link tag since metadata handles it
c = c.replace("\n        <link rel=\"icon\" href={faviconUrl} />", '')

fs.writeFileSync(f, c, 'utf8')
console.log('Done')
