const fs = require('fs')
const c = fs.readFileSync('backend/src/routes/employees.ts', 'utf8')
const lines = c.split('\n')
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('SELECT') && lines[i].includes('FROM users')) {
    console.log(i + ': ' + lines[i].trim().slice(0, 150))
  }
}
