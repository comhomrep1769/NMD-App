const fs = require('fs')

// ── FIX site-content.ts favicon route ──
const scf = 'backend/src/routes/site-content.ts'
let sc = fs.readFileSync(scf, 'utf8')

const oldFavicon = `// Serve favicon as real image from DB
router.get("/favicon", async (_req, res) => {`

if (sc.includes(oldFavicon)) {
  // Find the entire favicon route block
  const start = sc.indexOf(oldFavicon)
  const endMarker = '});'
  let end = sc.indexOf(endMarker, start)
  // Find the correct closing }); for this route
  let depth = 0
  for (let i = start; i < sc.length; i++) {
    if (sc[i] === '{') depth++
    if (sc[i] === '}') depth--
    if (depth === 0 && sc.substring(i, i + 3) === '});') {
      end = i + 3
      break
    }
  }

  const cleanFavicon = `// Serve favicon as real image from DB
router.get("/favicon", async (_req: any, res: any) => {
  try {
    await ensureSiteContentTable();
    const result = await pool.query("SELECT value FROM site_content WHERE key = 'site.favicon_url' LIMIT 1");
    const value = result.rows[0]?.value || "";
    if (value.startsWith("data:")) {
      const semiIdx = value.indexOf(";base64,");
      if (semiIdx > 5) {
        const mimeType = value.substring(5, semiIdx);
        const b64 = value.substring(semiIdx + 8);
        const buffer = Buffer.from(b64, "base64");
        res.set("Content-Type", mimeType);
        res.set("Cache-Control", "public, max-age=86400");
        return res.send(buffer);
      }
    }
    if (value && (value.startsWith("http") || value.startsWith("/"))) {
      return res.redirect(value);
    }
    return res.redirect("/nmd-logo-email.png");
  } catch (error) {
    console.error("favicon serve error", error);
    return res.status(500).json({ error: "Server error" });
  }
});`

  sc = sc.substring(0, start) + cleanFavicon + sc.substring(end)
  fs.writeFileSync(scf, sc, 'utf8')
  console.log('site-content.ts favicon fixed')
} else {
  console.log('site-content.ts: favicon route not found, skipping')
}

// ── FIX employees.ts avatar route ──
const ef = 'backend/src/routes/employees.ts'
let ec = fs.readFileSync(ef, 'utf8')

const oldAvatar = '// Serve employee avatar as real image'
if (ec.includes(oldAvatar)) {
  const start = ec.indexOf(oldAvatar)
  const endMarker = '\n// Update employee'
  const end = ec.indexOf(endMarker, start)

  if (end > start) {
    const cleanAvatar = `// Serve employee avatar as real image
router.get("/:employeeId/avatar", async (req: any, res: any) => {
  try {
    const { employeeId } = req.params;
    const result = await pool.query("SELECT profile_image_url FROM users WHERE id = $1 LIMIT 1", [employeeId]);
    const value = result.rows[0]?.profile_image_url || "";
    if (value.startsWith("data:")) {
      const semiIdx = value.indexOf(";base64,");
      if (semiIdx > 5) {
        const mimeType = value.substring(5, semiIdx);
        const b64 = value.substring(semiIdx + 8);
        const buffer = Buffer.from(b64, "base64");
        res.set("Content-Type", mimeType);
        res.set("Cache-Control", "public, max-age=3600");
        return res.send(buffer);
      }
    }
    if (value && (value.startsWith("http") || value.startsWith("/"))) return res.redirect(value);
    return res.status(404).json({ error: "No avatar" });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});
`

    ec = ec.substring(0, start) + cleanAvatar + ec.substring(end)
    fs.writeFileSync(ef, ec, 'utf8')
    console.log('employees.ts avatar fixed')
  } else {
    console.error('employees.ts: could not find end marker')
  }
} else {
  console.log('employees.ts: avatar route not found, skipping')
}

console.log('All done')
