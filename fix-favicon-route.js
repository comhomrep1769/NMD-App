const fs = require('fs')
const f = 'backend/src/routes/site-content.ts'
let c = fs.readFileSync(f, 'utf8')

const faviconRoute = [
  '',
  '// Serve favicon as real image from DB',
  'router.get("/favicon", async (_req, res) => {',
  '  try {',
  '    await ensureSiteContentTable();',
  '    const result = await pool.query("SELECT value FROM site_content WHERE key = \'site.favicon_url\' LIMIT 1");',
  '    const value = result.rows[0]?.value || \'\';',
  '    if (value.startsWith(\'data:\')) {',
  '      const matches = value.match(/^data:([^;]+);base64,(.+)$/);',
  '      if (matches) {',
  '        const mimeType = matches[1];',
  '        const buffer = Buffer.from(matches[2], \'base64\');',
  '        res.set(\'Content-Type\', mimeType);',
  '        res.set(\'Cache-Control\', \'public, max-age=86400\');',
  '        return res.send(buffer);',
  '      }',
  '    }',
  '    if (value && (value.startsWith(\'http\') || value.startsWith(\'/\'))) {',
  '      return res.redirect(value);',
  '    }',
  '    return res.redirect(\'/nmd-logo-email.png\');',
  '  } catch (error) {',
  '    console.error(\'favicon serve error\', error);',
  '    return res.status(500).json({ error: \'Server error\' });',
  '  }',
  '});',
  '',
].join('\n')

c = c.replace('// ── Public: anonymous visitors', faviconRoute + '\n// ── Public: anonymous visitors')
fs.writeFileSync(f, c, 'utf8')
console.log('Favicon route added')
