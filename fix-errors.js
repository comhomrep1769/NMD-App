const fs = require('fs')
const f = 'backend/src/server.ts'
let c = fs.readFileSync(f, 'utf8')
c = c.replace(
  'const message = err instanceof Error ? err.message : "Unexpected backend server error.";',
  'const isDev = process.env.NODE_ENV !== "production";\n  const message = isDev && err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";'
)
fs.writeFileSync(f, c, 'utf8')
console.log('Done')
