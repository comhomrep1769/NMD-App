const fs = require('fs')
const f = 'backend/src/routes/employees.ts'
let c = fs.readFileSync(f, 'utf8')

// Fix: add proper types to the avatar route
c = c.replace(
  'router.get("/:employeeId/avatar", async (req, res) => {',
  'router.get("/:employeeId/avatar", async (req: any, res: any) => {'
)

fs.writeFileSync(f, c, 'utf8')
console.log('Done')
