const fs = require('fs')
const f = 'backend/src/routes/employees.ts'
let c = fs.readFileSync(f, 'utf8')
const hasCRLF = c.includes('\r\n')
let w = c.replace(/\r\n/g, '\n')

// 1. Add profile_image_url to the PUT destructuring
w = w.replace(
  'const { displayName, email, phone, payRate, role, status } = req.body;',
  'const { displayName, email, phone, payRate, role, status, profileImageUrl } = req.body;'
)
console.log('1: destructuring updated')

// 2. Add profile_image_url to the UPDATE query
w = w.replace(
  "SET display_name = COALESCE(, display_name),\n           email = COALESCE(, email),\n           phone = COALESCE(, phone),\n           pay_rate = COALESCE(, pay_rate),\n           role = COALESCE(, role),\n           status = COALESCE(, status)\n       WHERE id = \n       RETURNING *,\n      [employeeId, displayName, email, phone, payRate, role, status]",
  "SET display_name = COALESCE(, display_name),\n           email = COALESCE(, email),\n           phone = COALESCE(, phone),\n           pay_rate = COALESCE(, pay_rate),\n           role = COALESCE(, role),\n           status = COALESCE(, status),\n           profile_image_url = COALESCE(, profile_image_url)\n       WHERE id = \n       RETURNING *,\n      [employeeId, displayName, email, phone, payRate, role, status, profileImageUrl]"
)
console.log('2: UPDATE query updated')

// 3. Add avatar endpoint before the PUT route
const avatarRoute = [
  '',
  '// Serve employee avatar as real image',
  'router.get("/:employeeId/avatar", async (req, res) => {',
  '  try {',
  '    const { employeeId } = req.params;',
  '    const result = await pool.query("SELECT profile_image_url FROM users WHERE id =  LIMIT 1", [employeeId]);',
  '    const value = result.rows[0]?.profile_image_url || "";',
  '    if (value.startsWith("data:")) {',
  '      const matches = value.match(/^data:([^;]+);base64,(.+)$/);',
  '      if (matches) {',
  '        const buffer = Buffer.from(matches[2], "base64");',
  '        res.set("Content-Type", matches[1]);',
  '        res.set("Cache-Control", "public, max-age=3600");',
  '        return res.send(buffer);',
  '      }',
  '    }',
  '    if (value && (value.startsWith("http") || value.startsWith("/"))) return res.redirect(value);',
  '    return res.status(404).json({ error: "No avatar" });',
  '  } catch (error) {',
  '    return res.status(500).json({ error: "Server error" });',
  '  }',
  '});',
  '',
].join('\n')

w = w.replace(
  '// Update employee',
  avatarRoute + '\n// Update employee'
)
console.log('3: avatar endpoint added')

const final = hasCRLF ? w.replace(/\n/g, '\r\n') : w
fs.writeFileSync(f, final, 'utf8')
console.log('employees.ts patched')
