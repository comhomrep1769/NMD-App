import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, first_name, last_name, phone, email, address, created_at
      FROM clients
      ORDER BY created_at DESC
    `);

    res.json({
      clients: result.rows.map((row) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone ?? "",
        email: row.email ?? "",
        address: row.address ?? "",
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error("clients list error", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { firstName, lastName, phone, email, address } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "First and last name are required" });
    }

    const result = await pool.query(
      `
      INSERT INTO clients (first_name, last_name, phone, email, address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, last_name, phone, email, address, created_at
      `,
      [firstName, lastName, phone ?? "", email ?? "", address ?? ""]
    );

    const row = result.rows[0];

    res.status(201).json({
      client: {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone ?? "",
        email: row.email ?? "",
        address: row.address ?? "",
        createdAt: row.created_at
      }
    });
  } catch (error) {
    console.error("client create error", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:clientId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { clientId } = req.params;
    const { firstName, lastName, phone, email, address } = req.body;

    const result = await pool.query(
      `
      UPDATE clients
      SET
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        address = COALESCE($6, address)
      WHERE id = $1
      RETURNING id, first_name, last_name, phone, email, address, created_at
      `,
      [clientId, firstName ?? null, lastName ?? null, phone ?? null, email ?? null, address ?? null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    const row = result.rows[0];

    res.json({
      client: {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone ?? "",
        email: row.email ?? "",
        address: row.address ?? "",
        createdAt: row.created_at
      }
    });
  } catch (error) {
    console.error("client update error", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:clientId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { clientId } = req.params;

    const result = await pool.query(
      `DELETE FROM clients WHERE id = $1 RETURNING id`,
      [clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ deleted: true });
  } catch (error) {
    console.error("client delete error", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
