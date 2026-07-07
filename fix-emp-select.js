const fs = require('fs')
const f = 'backend/src/routes/employees.ts'
let c = fs.readFileSync(f, 'utf8')

// Fix list query - add profile_image_url
c = c.replace(
  'SELECT id, email, display_name, role, created_at, pay_rate, must_change_password',
  'SELECT id, email, display_name, role, created_at, pay_rate, must_change_password, profile_image_url'
)
console.log('1: list query fixed')

// Fix single employee query
c = c.replace(
  "SELECT id, email, display_name, role FROM users WHERE id =  AND role IN ('admin','superadmin','employee','sales') LIMIT 1",
  "SELECT id, email, display_name, role, profile_image_url FROM users WHERE id =  AND role IN ('admin','superadmin','employee','sales') LIMIT 1"
)
console.log('2: single query fixed')

fs.writeFileSync(f, c, 'utf8')
console.log('Done')
