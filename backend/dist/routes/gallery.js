import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
async function ensureGalleryTable() {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      service_category TEXT NOT NULL DEFAULT 'Residential',
      city TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'FL',
      description TEXT NULL,
      before_image TEXT NOT NULL,
      after_image TEXT NOT NULL,
      job_date DATE NULL,
      is_published BOOLEAN NOT NULL DEFAULT false,
      display_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
const MAX_IMAGE_CHARS = 10_000_000;
function isUsableImage(value) {
    if (typeof value !== "string")
        return false;
    const v = value.trim();
    if (!v)
        return false;
    return v.startsWith("data:image/") || v.startsWith("http") || v.startsWith("/");
}
function publicRow(row, base) {
    return {
        id: row.id,
        title: row.title,
        serviceCategory: row.service_category,
        city: row.city,
        state: row.state,
        description: row.description,
        jobDate: row.job_date,
        displayOrder: row.display_order,
        isPublished: row.is_published,
        beforeImage: `${base}/api/gallery/${row.id}/image/before`,
        afterImage: `${base}/api/gallery/${row.id}/image/after`,
    };
}
// ── Public: published gallery jobs for the landing page ──
router.get("/", async (req, res) => {
    try {
        await ensureGalleryTable();
        const base = `${req.protocol}://${req.get("host")}`;
        const result = await pool.query(`SELECT id, title, service_category, city, state, description, job_date,
              display_order, is_published
       FROM gallery_jobs
       WHERE is_published = true
       ORDER BY display_order ASC, created_at DESC`);
        return res.json({ items: result.rows.map((r) => publicRow(r, base)) });
    }
    catch (error) {
        console.error("gallery public fetch error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Public: serve one before/after photo as real binary bytes ──
// Keeps multi-megabyte base64 out of the JSON payload and lets next/image
// optimize and cache each photo like any ordinary remote image.
router.get("/:id/image/:slot", async (req, res) => {
    try {
        await ensureGalleryTable();
        const { id, slot } = req.params;
        if (slot !== "before" && slot !== "after") {
            return res.status(400).json({ error: "Invalid slot" });
        }
        const column = slot === "before" ? "before_image" : "after_image";
        const result = await pool.query(`SELECT ${column} AS value FROM gallery_jobs WHERE id = $1 AND is_published = true LIMIT 1`, [id]);
        const value = result.rows[0]?.value || "";
        if (!value)
            return res.status(404).json({ error: "Not found" });
        if (value.startsWith("data:")) {
            const semiIdx = value.indexOf(";base64,");
            if (semiIdx > 5) {
                const mimeType = value.substring(5, semiIdx);
                if (!mimeType.startsWith("image/"))
                    return res.status(415).json({ error: "Unsupported type" });
                const buffer = Buffer.from(value.substring(semiIdx + 8), "base64");
                res.set("Content-Type", mimeType);
                res.set("Cache-Control", "public, max-age=31536000, immutable");
                return res.send(buffer);
            }
            return res.status(415).json({ error: "Unsupported type" });
        }
        if (value.startsWith("http") || value.startsWith("/"))
            return res.redirect(value);
        return res.status(404).json({ error: "Not found" });
    }
    catch (error) {
        console.error("gallery image serve error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin: full list including drafts and raw image values ──
router.get("/admin", requireAuth, requireRole("admin"), async (_req, res) => {
    try {
        await ensureGalleryTable();
        const result = await pool.query(`SELECT id, title, service_category, city, state, description, job_date,
              display_order, is_published, before_image, after_image, created_at
       FROM gallery_jobs
       ORDER BY display_order ASC, created_at DESC`);
        return res.json({
            items: result.rows.map((row) => ({
                id: row.id,
                title: row.title,
                serviceCategory: row.service_category,
                city: row.city,
                state: row.state,
                description: row.description,
                jobDate: row.job_date,
                displayOrder: row.display_order,
                isPublished: row.is_published,
                beforeImage: row.before_image,
                afterImage: row.after_image,
                createdAt: row.created_at,
            })),
        });
    }
    catch (error) {
        console.error("gallery admin fetch error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin: create ──
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        await ensureGalleryTable();
        const { title, serviceCategory, city, state, description, beforeImage, afterImage, jobDate, isPublished, displayOrder, } = req.body;
        if (!title?.trim())
            return res.status(400).json({ error: "Title is required." });
        if (!city?.trim())
            return res.status(400).json({ error: "City is required." });
        if (!isUsableImage(beforeImage))
            return res.status(400).json({ error: "A before photo is required." });
        if (!isUsableImage(afterImage))
            return res.status(400).json({ error: "An after photo is required." });
        if (beforeImage.length > MAX_IMAGE_CHARS || afterImage.length > MAX_IMAGE_CHARS) {
            return res.status(400).json({ error: "Photo too large. Max 10MB each." });
        }
        const result = await pool.query(`INSERT INTO gallery_jobs
         (title, service_category, city, state, description, before_image,
          after_image, job_date, is_published, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`, [
            title.trim(), serviceCategory || "Residential", city.trim(), state?.trim() || "FL",
            description?.trim() || null, beforeImage, afterImage, jobDate || null,
            isPublished === true, Number(displayOrder) || 0,
        ]);
        return res.status(201).json({ id: result.rows[0].id });
    }
    catch (error) {
        console.error("gallery create error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin: update ──
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        await ensureGalleryTable();
        const { id } = req.params;
        const body = req.body;
        const fields = [];
        const values = [];
        let n = 1;
        const setIf = (column, value) => {
            fields.push(`${column} = $${n++}`);
            values.push(value);
        };
        if (typeof body.title === "string") {
            if (!body.title.trim())
                return res.status(400).json({ error: "Title cannot be empty." });
            setIf("title", body.title.trim());
        }
        if (typeof body.serviceCategory === "string")
            setIf("service_category", body.serviceCategory);
        if (typeof body.city === "string") {
            if (!body.city.trim())
                return res.status(400).json({ error: "City cannot be empty." });
            setIf("city", body.city.trim());
        }
        if (typeof body.state === "string")
            setIf("state", body.state.trim() || "FL");
        if (typeof body.description === "string")
            setIf("description", body.description.trim() || null);
        if (body.jobDate !== undefined)
            setIf("job_date", body.jobDate || null);
        if (typeof body.isPublished === "boolean")
            setIf("is_published", body.isPublished);
        if (body.displayOrder !== undefined)
            setIf("display_order", Number(body.displayOrder) || 0);
        for (const [key, column] of [["beforeImage", "before_image"], ["afterImage", "after_image"]]) {
            if (body[key] !== undefined) {
                if (!isUsableImage(body[key]))
                    return res.status(400).json({ error: `Invalid ${key}.` });
                if (body[key].length > MAX_IMAGE_CHARS)
                    return res.status(400).json({ error: "Photo too large. Max 10MB each." });
                setIf(column, body[key]);
            }
        }
        if (fields.length === 0)
            return res.status(400).json({ error: "Nothing to update." });
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await pool.query(`UPDATE gallery_jobs SET ${fields.join(", ")} WHERE id = $${n} RETURNING id`, values);
        if (result.rowCount === 0)
            return res.status(404).json({ error: "Not found" });
        return res.json({ id: result.rows[0].id });
    }
    catch (error) {
        console.error("gallery update error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
// ── Admin: delete ──
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        await ensureGalleryTable();
        const result = await pool.query(`DELETE FROM gallery_jobs WHERE id = $1 RETURNING id`, [req.params.id]);
        if (result.rowCount === 0)
            return res.status(404).json({ error: "Not found" });
        return res.json({ ok: true });
    }
    catch (error) {
        console.error("gallery delete error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;
