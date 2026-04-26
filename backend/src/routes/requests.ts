import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        first_name,
        last_name,
        phone,
        email,
        address,
        service_type,
        preferred_date,
        preferred_time,
        notes,
        photo_data_url,
        photo_note,
        waiver_accepted,
        waiver_signature,
        waiver_signed_at,
        status,
        created_at
      FROM service_requests
      ORDER BY created_at DESC
      `
    );

    return res.json({
      requests: result.rows.map((row) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        serviceType: row.service_type,
        preferredDate: row.preferred_date,
        preferredTime: row.preferred_time,
        notes: row.notes,
        photoDataUrl: row.photo_data_url,
        photoNote: row.photo_note,
        waiverAccepted: row.waiver_accepted,
        waiverSignature: row.waiver_signature,
        waiverSignedAt: row.waiver_signed_at,
        status: row.status,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error("service requests list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/public", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      address,
      serviceType,
      preferredDate,
      preferredTime,
      notes,
      photoDataUrl,
      photoNote,
      waiverAccepted,
      waiverSignature
    } = req.body as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      address?: string;
      serviceType?: string;
      preferredDate?: string;
      preferredTime?: string;
      notes?: string;
      photoDataUrl?: string | null;
      photoNote?: string;
      waiverAccepted?: boolean;
      waiverSignature?: string;
    };

    if (!firstName || !lastName || !address || !serviceType) {
      return res.status(400).json({
        error: "First name, last name, address, and service type are required"
      });
    }

    if (!waiverAccepted || !waiverSignature?.trim()) {
      return res.status(400).json({
        error: "Liability waiver acceptance and signature are required before submitting."
      });
    }

    if (photoDataUrl && photoDataUrl.length > 2_500_000) {
      return res.status(400).json({
        error: "Photo is too large. Please upload a smaller image."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO service_requests
        (
          first_name,
          last_name,
          phone,
          email,
          address,
          service_type,
          preferred_date,
          preferred_time,
          notes,
          photo_data_url,
          photo_note,
          waiver_accepted,
          waiver_signature,
          waiver_signed_at
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, $12, NOW())
      RETURNING
        id,
        first_name,
        last_name,
        phone,
        email,
        address,
        service_type,
        preferred_date,
        preferred_time,
        notes,
        photo_data_url,
        photo_note,
        waiver_accepted,
        waiver_signature,
        waiver_signed_at,
        status,
        created_at
      `,
      [
        firstName.trim(),
        lastName.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address.trim(),
        serviceType.trim(),
        preferredDate || null,
        preferredTime?.trim() || null,
        notes?.trim() || null,
        photoDataUrl || null,
        photoNote?.trim() || null,
        waiverSignature.trim()
      ]
    );

    const row = result.rows[0];

    return res.status(201).json({
      request: {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        serviceType: row.service_type,
        preferredDate: row.preferred_date,
        preferredTime: row.preferred_time,
        notes: row.notes,
        photoDataUrl: row.photo_data_url,
        photoNote: row.photo_note,
        waiverAccepted: row.waiver_accepted,
        waiverSignature: row.waiver_signature,
        waiverSignedAt: row.waiver_signed_at,
        status: row.status,
        createdAt: row.created_at
      }
    });
  } catch (error) {
    console.error("public service request error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:requestId/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body as {
      status?: "pending" | "reviewed" | "scheduled" | "declined";
    };

    if (!status || !["pending", "reviewed", "scheduled", "declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid request status" });
    }

    const result = await pool.query(
      `
      UPDATE service_requests
      SET status = $2
      WHERE id = $1
      RETURNING
        id,
        first_name,
        last_name,
        phone,
        email,
        address,
        service_type,
        preferred_date,
        preferred_time,
        notes,
        photo_data_url,
        photo_note,
        waiver_accepted,
        waiver_signature,
        waiver_signed_at,
        status,
        created_at
      `,
      [requestId, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Service request not found" });
    }

    const row = result.rows[0];

    return res.json({
      request: {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        serviceType: row.service_type,
        preferredDate: row.preferred_date,
        preferredTime: row.preferred_time,
        notes: row.notes,
        photoDataUrl: row.photo_data_url,
        photoNote: row.photo_note,
        waiverAccepted: row.waiver_accepted,
        waiverSignature: row.waiver_signature,
        waiverSignedAt: row.waiver_signed_at,
        status: row.status,
        createdAt: row.created_at
      }
    });
  } catch (error) {
    console.error("service request status error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:requestId/convert-to-client", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { requestId } = req.params;

    const requestResult = await pool.query(
      `
      SELECT *
      FROM service_requests
      WHERE id = $1
      LIMIT 1
      `,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: "Service request not found" });
    }

    const request = requestResult.rows[0];

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const clientResult = await client.query(
        `
        INSERT INTO clients (first_name, last_name, phone, email, address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, first_name, last_name, phone, email, address, created_at
        `,
        [
          request.first_name,
          request.last_name,
          request.phone,
          request.email,
          request.address
        ]
      );

      await client.query(
        `
        UPDATE service_requests
        SET status = 'reviewed'
        WHERE id = $1
        `,
        [requestId]
      );

      await client.query("COMMIT");

      const row = clientResult.rows[0];

      return res.status(201).json({
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
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("service request convert client error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:requestId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { requestId } = req.params;

    const result = await pool.query(
      `DELETE FROM service_requests WHERE id = $1 RETURNING id`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Service request not found" });
    }

    return res.json({ deleted: true });
  } catch (error) {
    console.error("service request delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
