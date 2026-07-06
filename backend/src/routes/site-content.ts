import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

async function ensureSiteContentTable() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_content (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      value_type TEXT NOT NULL DEFAULT 'text',
      section TEXT NOT NULL DEFAULT 'content',
      page TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by UUID NULL
    );
  `);
  await pool.query(`ALTER TABLE site_content ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'content';`);
}

// ── Default content — every value below is the REAL current text already
// live in the corresponding file. Only inserted if the key doesn't already
// exist, so admin edits are never overwritten on server restart.
const DEFAULT_CONTENT: Array<{
  key: string; value: string; valueType: string; section: string; page: string; label: string; sortOrder: number;
}> = [
  // ── Homepage content (Hero.tsx) ──
  { key: "hero.image_url", value: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1800&q=80", valueType: "image", section: "content", page: "home", label: "Hero Background Image", sortOrder: 1 },
  { key: "hero.badge_text", value: "Orlando & Central Florida · Brevard County", valueType: "text", section: "content", page: "home", label: "Hero Badge Text", sortOrder: 2 },
  { key: "hero.headline_main", value: "We make every surface", valueType: "text", section: "content", page: "home", label: "Hero Headline (main)", sortOrder: 3 },
  { key: "hero.headline_highlight", value: "spotless.", valueType: "text", section: "content", page: "home", label: "Hero Headline (highlighted word)", sortOrder: 4 },
  { key: "hero.subtext", value: "Professional pressure washing for homes, businesses, and industrial properties across Orlando, Orange County & Brevard County. From driveways to rooftops — we restore every surface to its best.", valueType: "richtext", section: "content", page: "home", label: "Hero Subtext", sortOrder: 5 },
  { key: "hero.cta_primary_text", value: "Get a Free Quote", valueType: "text", section: "content", page: "home", label: "Hero Primary Button Text", sortOrder: 6 },
  { key: "hero.cta_secondary_text", value: "View Services", valueType: "text", section: "content", page: "home", label: "Hero Secondary Button Text", sortOrder: 7 },
  { key: "hero.stat1_value", value: "100+", valueType: "text", section: "content", page: "home", label: "Hero Stat 1 Value", sortOrder: 8 },
  { key: "hero.stat1_label", value: "Services offered", valueType: "text", section: "content", page: "home", label: "Hero Stat 1 Label", sortOrder: 9 },
  { key: "hero.stat2_value", value: "2", valueType: "text", section: "content", page: "home", label: "Hero Stat 2 Value", sortOrder: 10 },
  { key: "hero.stat2_label", value: "Counties served", valueType: "text", section: "content", page: "home", label: "Hero Stat 2 Label", sortOrder: 11 },
  { key: "hero.stat3_value", value: "20%", valueType: "text", section: "content", page: "home", label: "Hero Stat 3 Value", sortOrder: 12 },
  { key: "hero.stat3_label", value: "Recurring discount", valueType: "text", section: "content", page: "home", label: "Hero Stat 3 Label", sortOrder: 13 },

  // ── Homepage SEO (page.tsx) ──
  { key: "seo.home.title", value: "NMD Pressure Washing | Brevard & Orange County, FL", valueType: "text", section: "seo", page: "home", label: "Page Title Tag", sortOrder: 1 },
  { key: "seo.home.description", value: "Professional pressure washing in Brevard County & Orange County, FL. Residential, commercial, industrial, and specialty restoration. Free quotes. 20% off recurring plans.", valueType: "richtext", section: "seo", page: "home", label: "Meta Description", sortOrder: 2 },
  { key: "seo.home.og_image", value: "/og-image.jpg", valueType: "image", section: "seo", page: "home", label: "Social Share Image (1200×630px recommended)", sortOrder: 3 },

  // ── Site-wide SEO (layout.tsx) ──
  { key: "seo.global.description", value: "Professional pressure washing services in Brevard County and Orange County, Florida. Residential, commercial, industrial, and specialty restoration. Get a free quote today.", valueType: "richtext", section: "seo", page: "global", label: "Site-wide Default Meta Description", sortOrder: 1 },
  { key: "seo.global.search_console_verification", value: "", valueType: "text", section: "seo", page: "global", label: "Google Search Console Verification Code", sortOrder: 2 },
];

async function ensureSiteContentSeeded() {
  for (const item of DEFAULT_CONTENT) {
    await pool.query(
      `INSERT INTO site_content (key, value, value_type, section, page, label, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (key) DO NOTHING`,
      [item.key, item.value, item.valueType, item.section, item.page, item.label, item.sortOrder]
    );
  }
}


// Serve favicon as real image from DB
router.get("/favicon", async (_req, res) => {
  try {
    await ensureSiteContentTable();
    const result = await pool.query("SELECT value FROM site_content WHERE key = 'site.favicon_url' LIMIT 1");
    const value = result.rows[0]?.value || '';
    if (value.startsWith('data:')) {
      const matches = value.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.set('Content-Type', mimeType);
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }
    }
    if (value && (value.startsWith('http') || value.startsWith('/'))) {
      return res.redirect(value);
    }
    return res.redirect('/nmd-logo-email.png');
  } catch (error) {
    console.error('favicon serve error', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Public: anonymous visitors / public pages need this with no auth.
// Returns BOTH content and seo rows — meta tags are public-facing data
// by nature, no reason to gate them behind auth. ──
router.get("/", async (_req, res) => {
  try {
    await ensureSiteContentTable();
    await ensureSiteContentSeeded();
    const result = await pool.query(`SELECT key, value FROM site_content`);
    const content: Record<string, string> = {};
    for (const row of result.rows) content[row.key] = row.value;
    return res.json({ content });
  } catch (error) {
    console.error("site content public fetch error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── Admin: full metadata for the editor UI ──
router.get("/admin", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    await ensureSiteContentTable();
    await ensureSiteContentSeeded();
    const result = await pool.query(
      `SELECT id, key, value, value_type, section, page, label, sort_order, updated_at
       FROM site_content ORDER BY section ASC, page ASC, sort_order ASC`
    );
    return res.json({
      items: result.rows.map((row) => ({
        id: row.id, key: row.key, value: row.value, valueType: row.value_type,
        section: row.section, page: row.page, label: row.label,
        sortOrder: row.sort_order, updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error("site content admin fetch error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// ── Admin: update one field ──
router.put("/:key", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body as { value?: string };

    if (value === undefined || value === null) {
      return res.status(400).json({ error: "Value is required." });
    }
    if (value.length > 10_000_000) {
      return res.status(400).json({ error: "Value is too large. Max 10MB (relevant for uploaded images)." });
    }

    const result = await pool.query(
      `UPDATE site_content
       SET value = $1, updated_at = NOW(), updated_by = $2
       WHERE key = $3
       RETURNING id, key, value, value_type, section, page, label, sort_order, updated_at`,
      [value, req.user!.id, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Content key not found." });
    }

    const row = result.rows[0];
    return res.json({
      item: {
        id: row.id, key: row.key, value: row.value, valueType: row.value_type,
        section: row.section, page: row.page, label: row.label,
        sortOrder: row.sort_order, updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error("site content update error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;