const fs = require('fs')
const rf = 'frontend-next/src/app/requests/page.tsx'
let c = fs.readFileSync(rf, 'utf8')
c = c.replace('deleteRequest(r.id, r.clientName)', 'deleteRequest(r.id, r.firstName + " " + r.lastName)')
fs.writeFileSync(rf, c, 'utf8')
console.log('Done')
