const fs = require('fs')
const f = 'backend/src/routes/employees.ts'
let c = fs.readFileSync(f, 'utf8')

// Remove the broken avatar route entirely
const startMarker = '// Serve employee avatar as real image'
const endMarker = '\n// Update employee'

const startIdx = c.indexOf(startMarker)
const endIdx = c.indexOf(endMarker)

if (startIdx > -1 && endIdx > -1) {
  // Replace with a clean version using split instead of regex
  const cleanRoute = [
    '// Serve employee avatar as real image',
    'router.get("/:employeeId/avatar", async (req: any, res: any) => {',
    '  try {',
    '    const { employeeId } = req.params;',
    '    const result = await pool.query("SELECT profile_image_url FROM users WHERE id =  LIMIT 1", [employeeId]);',
    '    const value = result.rows[0]?.profile_image_url || "";',
    '    if (value.startsWith("data:")) {',
    '      const semiIdx = value.indexOf(";base64,");',
    '      if (semiIdx > 5) {',
    '        const mimeType = value.substring(5, semiIdx);',
    '        const b64 = value.substring(semiIdx + 8);',
    '        const buffer = Buffer.from(b64, "base64");',
    '        res.set("Content-Type", mimeType);',
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

  c = c.substring(0, startIdx) + cleanRoute + c.substring(endIdx)
  fs.writeFileSync(f, c, 'utf8')
  console.log('Avatar route replaced cleanly')
} else {
  console.error('MISS: start', startIdx, 'end', endIdx)
}
