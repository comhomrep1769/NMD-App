import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function mapGuruMessage(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    roleContext: row.role_context,
    sender: row.sender,
    body: row.body,
    createdAt: row.created_at
  };
}

function getGuruReply(role: string, message: string) {
  const lower = message.toLowerCase();

  if (role === "client") {
    if (lower.includes("quote") || lower.includes("estimate")) {
      return "I can help start your estimate. Please tell me what area needs cleaning, the surface type, approximate size, condition, and whether you can upload photos.";
    }

    if (lower.includes("recurring")) {
      return "Recurring service is a great option. NMD can help with routine exterior cleaning, trash can cleaning, and maintenance schedules. I can help collect the details for admin review.";
    }

    if (lower.includes("photo") || lower.includes("image")) {
      return "Photos help NMD estimate more accurately. Please upload clear pictures showing the full area, stains, surface type, access points, and any problem spots.";
    }

    return "I can help you request service, describe the issue, prepare estimate details, and guide you toward the right NMD service. What part of the property needs cleaning?";
  }

  if (role === "employee") {
    if (lower.includes("treatment") || lower.includes("chemical")) {
      return "For treatment guidance, check surface type, stain type, plant/property protection, dwell time, runoff control, PPE, and whether the surface needs soft washing instead of pressure.";
    }

    if (lower.includes("payment") || lower.includes("cash")) {
      return "For cash collection, use POS, enter the invoice/client details, upload a clear photo of the cash collected, and submit it for admin approval.";
    }

    if (lower.includes("job")) {
      return "For job prep, review address, photos, surface type, assigned services, required equipment, treatment notes, safety risks, and payment status before arrival.";
    }

    return "I can help with field workflow, job notes, treatments, safety reminders, payment collection, and customer-facing details. What do you need help with?";
  }

  if (lower.includes("quote")) {
    return "I can help draft a quote workflow. Gather client name, address, service type, surface/material, square footage, condition, photos, notes, subtotal, tax, and final total before sending.";
  }

  if (lower.includes("invoice")) {
    return "I can help with invoice prep. Make sure the invoice includes client info, service details, subtotal, sales tax, total, payment link, due terms, and payment status.";
  }

  if (lower.includes("payment") || lower.includes("pos") || lower.includes("cash")) {
    return "For payments, use POS to send card links or record cash. Cash requires photo proof and admin approval before the invoice is marked paid.";
  }

  if (lower.includes("schedule")) {
    return "For scheduling, check employee availability, job location, estimated job time, required equipment, recurring conflicts, and travel time before confirming.";
  }

  return "I can help with NMD operations, quotes, invoices, scheduling, payments, treatments, pricing, job planning, and business workflow. What would you like to work on?";
}

router.get("/messages", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM guru_messages
      WHERE user_id = $1
      ORDER BY created_at ASC
      LIMIT 200
      `,
      [req.user!.id]
    );

    return res.json({
      messages: result.rows.map(mapGuruMessage)
    });
  } catch (error) {
    console.error("guru messages list error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/messages", requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { body } = req.body as {
      body?: string;
    };

    if (!body || !body.trim()) {
      return res.status(400).json({
        error: "Message body is required"
      });
    }

    const roleContext = req.user!.role;

    if (!["admin", "employee", "client"].includes(roleContext)) {
      return res.status(403).json({
        error: "Invalid Guru role context"
      });
    }

    await client.query("BEGIN");

    const userMessageResult = await client.query(
      `
      INSERT INTO guru_messages (
        user_id,
        role_context,
        sender,
        body
      )
      VALUES ($1, $2, 'user', $3)
      RETURNING *
      `,
      [req.user!.id, roleContext, body.trim()]
    );

    const reply = getGuruReply(roleContext, body.trim());

    const guruMessageResult = await client.query(
      `
      INSERT INTO guru_messages (
        user_id,
        role_context,
        sender,
        body
      )
      VALUES ($1, $2, 'guru', $3)
      RETURNING *
      `,
      [req.user!.id, roleContext, reply]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      userMessage: mapGuruMessage(userMessageResult.rows[0]),
      guruMessage: mapGuruMessage(guruMessageResult.rows[0])
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("guru message create error", error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

router.delete("/messages", requireAuth, async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM guru_messages
      WHERE user_id = $1
      `,
      [req.user!.id]
    );

    return res.json({
      deleted: true
    });
  } catch (error) {
    console.error("guru messages delete error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
