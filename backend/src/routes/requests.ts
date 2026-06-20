import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";
import { createClientAccountAndToken } from "./auth.js";
import { logActivity } from "../services/activityLog.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, phone, email, address, service_type,
        preferred_date, preferred_time, notes, photo_data_url, photo_note,
        waiver_accepted, waiver_signature, waiver_signed_at, status, created_at
      FROM service_requests ORDER BY created_at DESC`
    );
    return res.json({
      requests: result.rows.map((row) => ({
        id: row.id, firstName: row.first_name, lastName: row.last_name,
        phone: row.phone, email: row.email, address: row.address,
        serviceType: row.service_type, preferredDate: row.preferred_date,
        preferredTime: row.preferred_time, notes: row.notes,
        photoDataUrl: row.photo_data_url, photoNote: row.photo_note,
        waiverAccepted: row.waiver_accepted, waiverSignature: row.waiver_signature,
        waiverSignedAt: row.waiver_signed_at, status: row.status, createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error("service requests list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/public", async (req, res) => {
  console.log("[requests/public] received submission");
  try {
    const {
      firstName, lastName, phone, email, address, serviceType,
      preferredDate, preferredTime, notes, photoDataUrl, photoNote,
      waiverAccepted, waiverSignature,
      client_phone, sms_consent,
    } = req.body as {
      firstName?: string; lastName?: string; phone?: string; email?: string;
      address?: string; serviceType?: string; preferredDate?: string;
      preferredTime?: string; notes?: string; photoDataUrl?: string | null;
      photoNote?: string; waiverAccepted?: boolean; waiverSignature?: string;
      client_phone?: string; sms_consent?: boolean;
    };

    if (!firstName || !address || !serviceType) {
      return res.status(400).json({ error: "First name, last name, address, and service type are required" });
    }

    if (!waiverAccepted || !waiverSignature?.trim()) {
      return res.status(400).json({ error: "Liability waiver acceptance and signature are required before submitting." });
    }

    if (photoDataUrl && photoDataUrl.length > 10_000_000) {
      return res.status(400).json({ error: "Photo is too large. Please upload a smaller image." });
    }

    // ── Insert service request (including SMS consent columns) ──
    const result = await pool.query(
      `INSERT INTO service_requests
        (first_name, last_name, phone, email, address, service_type, preferred_date,
        preferred_time, notes, photo_data_url, photo_note, waiver_accepted,
        waiver_signature, waiver_signed_at, client_phone, sms_consent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, $12, NOW(), $13, $14)
      RETURNING *`,
      [
        firstName.trim(), lastName?.trim() || null, phone?.trim() || null, email?.trim() || null,
        address.trim(), serviceType.trim(), preferredDate || null, preferredTime?.trim() || null,
        notes?.trim() || null, photoDataUrl || null, photoNote?.trim() || null,
        waiverSignature.trim(),
        client_phone?.trim() || null,
        sms_consent ?? false,
      ]
    );

    const row = result.rows[0];
    const request = {
      id: row.id, firstName: row.first_name, lastName: row.last_name,
      phone: row.phone, email: row.email, address: row.address,
      serviceType: row.service_type, preferredDate: row.preferred_date,
      preferredTime: row.preferred_time, notes: row.notes,
      photoDataUrl: row.photo_data_url, photoNote: row.photo_note,
      waiverAccepted: row.waiver_accepted, waiverSignature: row.waiver_signature,
      waiverSignedAt: row.waiver_signed_at, status: row.status, createdAt: row.created_at
    };

    console.log("[requests/public] saved to DB, email:", email);

    // ── Activity log: new service request submitted ──
    await logActivity({
      actorType: "client",
      actorName: `${firstName} ${lastName || ""}`.trim(),
      action: "service_request_submitted",
      description: `${firstName} ${lastName || ""} submitted a new service request: ${serviceType} at ${address}`,
      metadata: { requestId: row.id, serviceType, address, email: email || null },
    });

    // ── Sync phone + SMS consent to clients table if client exists ──
    if (email && client_phone) {
      try {
        await pool.query(
          `UPDATE clients
           SET phone = $1, sms_consent = $2
           WHERE LOWER(email) = LOWER($3)`,
          [client_phone.trim(), sms_consent ?? false, email.trim()]
        );
        console.log("[requests/public] synced phone/sms_consent to clients table for:", email);
      } catch (syncErr) {
        console.warn("[requests/public] sms sync skipped (client may not exist yet):", syncErr);
      }
    }

    const PORTAL_URL = process.env.FRONTEND_URL || "https://nmdpowash.com";
    let accountWasCreated = false;

    if (email) {
      try {
        console.log("[requests/public] creating client account for:", email);
        const displayName = `${firstName} ${lastName || ""}`.trim();
        const { token: setPasswordToken, isNew } = await createClientAccountAndToken({
          email: email.trim().toLowerCase(),
          displayName,
          phone: phone || null
        });
        console.log("[requests/public] account ready, isNew:", isNew);
        accountWasCreated = isNew;

        if (isNew) {
          await logActivity({
            actorType: "system",
            action: "client_account_auto_created",
            description: `New client account auto-created for ${displayName} (${email}) from a service request`,
            metadata: { email, displayName },
          });
        }

        // ── After account is created/confirmed, sync SMS consent again now that the row exists ──
        if (client_phone) {
          try {
            await pool.query(
              `UPDATE clients
               SET phone = $1, sms_consent = $2
               WHERE LOWER(email) = LOWER($3)`,
              [client_phone.trim(), sms_consent ?? false, email.trim()]
            );
          } catch (syncErr2) {
            console.warn("[requests/public] post-account sms sync error:", syncErr2);
          }
        }

        if (isNew) {
          const setPasswordUrl = `${PORTAL_URL}/client/set-password?token=${setPasswordToken}`;
          await sendEmail({
            to: email,
            subject: "Your Quote Request Has Been Received - NMD Pressure Washing",
            html: buildNmdEmailTemplate({
              title: "Quote Request Received",
              heading: "Your Quote Request Has Been Received",
              message: `Hi ${firstName},\n\nThank you for choosing NMD Pressure Washing Services LLC. We have successfully received your quote request and our team is currently reviewing the details.\n\nYOUR ACCOUNT ACCESS\n\nAn account has been created for you so you can:\n- View your quote\n- Communicate directly with our team\n- Manage scheduling and future services\n\nTo get started, please set your password using the button below.\n\nOPTIONAL: ADD THE APP TO YOUR PHONE\n\niPhone (Safari): Open the link in Safari, tap Share, select Add to Home Screen.\nAndroid (Chrome): Open in Chrome, tap menu (3 dots), select Add to Home Screen.\n\nBest regards,\nNMD Pressure Washing Services LLC\n321-888-6586`,
              buttonText: "Set Your Password & Access Your Account",
              buttonUrl: setPasswordUrl,
              footerNote: "Clean Results. Reliable Service. Every Time."
            }),
            text: `Hi ${firstName}, your quote request was received. Set your password here: ${setPasswordUrl}`
          });
        } else {
          await sendEmail({
            to: email,
            subject: "New Service Request Received - NMD Pressure Washing",
            html: buildNmdEmailTemplate({
              title: "Service Request Received",
              heading: "New Request Received",
              message: `Hi ${firstName},\n\nThank you for submitting a new service request. Our team is reviewing your request and will be in touch shortly with a quote.\n\nService: ${serviceType}\nAddress: ${address}\n\nYou can track your request status in your client portal.\n\nBest regards,\nNMD Pressure Washing Services LLC\n321-888-6586`,
              buttonText: "View Your Portal",
              buttonUrl: `${PORTAL_URL}/client`,
              footerNote: "Clean Results. Reliable Service. Every Time."
            }),
            text: `Hi ${firstName}, your new service request for ${serviceType} has been received.`
          });
        }
        console.log("[requests/public] client email sent to:", email);
      } catch (emailErr) {
        console.error("[requests/public] Client onboarding email error:", emailErr);
      }
    }

    // ── Admin notification ──
    await sendEmail({
      to: process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com",
      subject: `New NMD service request: ${serviceType}`,
      html: buildNmdEmailTemplate({
        title: "New Service Request",
        message: `Client: ${firstName} ${lastName || ""}\nPhone: ${phone || "N/A"}\nEmail: ${email || "N/A"}\nAddress: ${address}\nService: ${serviceType}\nPreferred: ${preferredDate || "N/A"} ${preferredTime || ""}\nNotes: ${notes || "N/A"}\nSMS Updates: ${sms_consent ? "Yes (consented)" : "No"}`,
      }),
      text: `New service request from ${firstName} ${lastName || ""}: ${serviceType} at ${address}`
    });

    console.log("[requests/public] admin notification sent");

    return res.status(201).json({ request, accountCreated: accountWasCreated });
  } catch (error) {
    console.error("[requests/public] error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:requestId/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body as { status?: "pending" | "reviewed" | "scheduled" | "declined" };

    if (!status || !["pending", "reviewed", "scheduled", "declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid request status" });
    }

    const result = await pool.query(
      `UPDATE service_requests SET status = $2 WHERE id = $1
      RETURNING id, first_name, last_name, phone, email, address, service_type,
        preferred_date, preferred_time, notes, photo_data_url, photo_note,
        waiver_accepted, waiver_signature, waiver_signed_at, status, created_at`,
      [requestId, status]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Service request not found" });

    const row = result.rows[0];

    await logActivity({
      actorType: "admin",
      actorId: req.user!.id,
      action: "service_request_status_changed",
      description: `Service request for ${row.first_name} ${row.last_name || ""} (${row.service_type}) marked as ${status}`,
      metadata: { requestId: row.id, status },
    });

    return res.json({
      request: {
        id: row.id, firstName: row.first_name, lastName: row.last_name,
        phone: row.phone, email: row.email, address: row.address,
        serviceType: row.service_type, preferredDate: row.preferred_date,
        preferredTime: row.preferred_time, notes: row.notes,
        photoDataUrl: row.photo_data_url, photoNote: row.photo_note,
        waiverAccepted: row.waiver_accepted, waiverSignature: row.waiver_signature,
        waiverSignedAt: row.waiver_signed_at, status: row.status, createdAt: row.created_at
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
    const requestResult = await pool.query(`SELECT * FROM service_requests WHERE id = $1 LIMIT 1`, [requestId]);
    if (requestResult.rows.length === 0) return res.status(404).json({ error: "Service request not found" });

    const request = requestResult.rows[0];
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const clientResult = await client.query(
        `INSERT INTO clients (first_name, last_name, phone, email, address, sms_consent)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, first_name, last_name, phone, email, address, created_at`,
        [
          request.first_name, request.last_name, request.phone,
          request.email, request.address,
          request.sms_consent ?? false,
        ]
      );
      await client.query(`UPDATE service_requests SET status = 'reviewed' WHERE id = $1`, [requestId]);
      await client.query("COMMIT");

      const row = clientResult.rows[0];

      await logActivity({
        actorType: "admin",
        actorId: req.user!.id,
        action: "request_converted_to_client",
        description: `Converted service request from ${row.first_name} ${row.last_name || ""} into a client record`,
        metadata: { requestId, clientId: row.id },
      });

      return res.status(201).json({
        client: {
          id: row.id, firstName: row.first_name, lastName: row.last_name,
          phone: row.phone ?? "", email: row.email ?? "",
          address: row.address ?? "", createdAt: row.created_at
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
    const result = await pool.query(`DELETE FROM service_requests WHERE id = $1 RETURNING id`, [requestId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Service request not found" });
    return res.json({ deleted: true });
  } catch (error) {
    console.error("service request delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;