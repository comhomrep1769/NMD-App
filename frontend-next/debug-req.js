const fs = require('fs')
const rw = fs.readFileSync('frontend-next/src/app/requests/page.tsx', 'utf8').replace(/\r\n/g, '\n')
const rLines = rw.split('\n')
for (let i = 715; i < 730; i++) {
  console.log(i + ': ' + JSON.stringify(rLines[i]))
}
