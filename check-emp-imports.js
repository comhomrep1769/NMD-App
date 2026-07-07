const fs = require('fs')
const c = fs.readFileSync('backend/src/routes/employees.ts', 'utf8')
const lines = c.split('\n')
for (let i = 0; i < 15; i++) {
  console.log(i + ': ' + lines[i])
}
