const fs = require('fs')
const rw = fs.readFileSync('frontend-next/src/app/requests/page.tsx', 'utf8').replace(/\r\n/g, '\n')
const lines = rw.split('\n')
for (let i = 720; i < 740; i++) {
  console.log(i + ': ' + JSON.stringify(lines[i]).slice(0, 140))
}
