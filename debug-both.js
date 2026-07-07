const fs = require('fs')

// Debug schedule
const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8').replace(/\r\n/g, '\n')
const sLines = sc.split('\n')
// Find editJob state line
for (let i = 0; i < sLines.length; i++) {
  if (sLines[i].includes('editJob, setEditJob')) console.log('sched editJob:', i, JSON.stringify(sLines[i]))
  if (sLines[i].includes('saveJob')) console.log('sched saveJob:', i, JSON.stringify(sLines[i]))
  if (sLines[i].includes('>Edit</button>')) console.log('sched Edit btn:', i, JSON.stringify(sLines[i]))
}

// Debug requests
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8').replace(/\r\n/g, '\n')
const rLines = rc.split('\n')
for (let i = 0; i < rLines.length; i++) {
  if (rLines[i].includes('saving, setSaving')) console.log('req saving:', i, JSON.stringify(rLines[i]))
  if (rLines[i].includes('updateRequest = async')) console.log('req updateReq:', i, JSON.stringify(rLines[i]))
  if (rLines[i].includes('Convert to Quote')) console.log('req convert:', i, JSON.stringify(rLines[i]))
}
