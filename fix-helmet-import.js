const fs = require('fs')
const f = 'backend/src/server.ts'
let c = fs.readFileSync(f, 'utf8')

// Try both quote styles
if (c.includes('import helmet')) {
  console.log('Import already there')
} else if (c.includes('import cors from "cors"')) {
  c = c.replace('import cors from "cors";', 'import cors from "cors";\nimport helmet from "helmet";')
  fs.writeFileSync(f, c, 'utf8')
  console.log('Import added with double quotes')
} else {
  console.log('Could not find cors import. First 200 chars:', c.slice(0, 200))
}
