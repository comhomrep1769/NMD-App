import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

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

function mapGuruEstimate(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    source: row.source,
    status: row.status,
    clientName: row.client_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    serviceType: row.service_type,
    propertyArea: row.property_area,
    surfaceType: row.surface_type,
    conditionLevel: row.condition_level,
    squareFootage: row.square_footage,
    preferredSchedule: row.preferred_schedule,
    specialConcerns: row.special_concerns,
    preliminaryNotes: row.preliminary_notes,
    preliminaryEstimateLow: Number(row.preliminary_estimate_low || 0),
    preliminaryEstimateHigh: Number(row.preliminary_estimate_high || 0),
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by
  };
}

function mapQuote(row: any) {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    clientId: row.client_id,
    clientName: row.client_name,
    serviceType: row.service_type,
    total: Number(row.total || 0),
    status: row.status,
    convertedInvoiceId: row.converted_invoice_id,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at
  };
}

function getGuruReply(role: string, message: string) {
  const lower = message.toLowerCase();

  if (role === "client") {
    if (lower.includes("quote") || lower.includes("estimate")) {
      return "I can help start your estimate. Tell me what area needs cleaning, the surface type, approximate size, condition, and whether you can upload photos. I can collect this for NMD admin review.";
    }

    if (lower.includes("recurring")) {
      return "Recurring service is a great option. NMD can help with routine exterior cleaning, trash can cleaning, and maintenance schedules. I can help collect the details for admin review.";
    }

    if (lower.includes("photo") || lower.includes("image")) {
      return "Photos help NMD estimate more accurately. Please upload clear pictures showing the full area, stains, surface type, access points, and any problem spots. Photo upload for Guru is coming in a later phase.";
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

  if (lower.includes("estimate")) {
    return "Guru estimates needing review can be checked from the admin review workflow. Client estimates are preliminary until reviewed and approved by admin.";
  }

  return "I can help with NMD operations, quotes, invoices, scheduling, payments, treatments, pricing, job planning, and business workflow. What would you like to work on?";
}

function estimateRange(input: {
  serviceType?: string;
  conditionLevel?: string;
  squareFootage?: string;
}) {
  const rawSqft = input.squareFootage || "";
  const sqftMatch = rawSqft.match(/\d+/);
  const sqft = sqftMatch ? Number(sqftMatch[0]) : 0;

  const service = (input.serviceType || "").toLowerCase();
  const condition = (input.conditionLevel || "").toLowerCase();

  let baseLow = 125;
  let baseHigh = 250;

  if (service.includes("roof")) {
    baseLow = 350;
    baseHigh = 900;
  } else if (service.includes("house") || service.includes("siding")) {
    baseLow = 200;
    baseHigh = 600;
  } else if (service.includes("driveway") || service.includes("concrete")) {
    baseLow = 125;
    baseHigh = 450;
  } else if (service.includes("fence")) {
    baseLow = 200;
    baseHigh = 700;
  } else if (service.includes("trash")) {
    baseLow = 10;
    baseHigh = 40;
  } else if (service.includes("commercial")) {
    baseLow = 300;
    baseHigh = 1500;
  }

  if (sqft > 0) {
    if (service.includes("roof")) {
      baseLow = Math.max(baseLow, sqft * 0.25);
      baseHigh = Math.max(baseHigh, sqft * 0.55);
    } else if (service.includes("driveway") || service.includes("concrete")) {
      baseLow = Math.max(baseLow, sqft * 0.15);
      baseHigh = Math.max(baseHigh, sqft * 0.45);
    } else if (service.includes("house") || service.includes("siding")) {
      baseLow = Math.max(baseLow, sqft * 0.12);
      baseHigh = Math.max(baseHigh, sqft * 0.35);
    }
  }

  if (condition.includes("heavy") || condition.includes("bad") || condition.includes("severe")) {
    baseLow *= 1.25;
    baseHigh *= 1.5;
  }

  if (condition.includes("light") || condition.includes("easy")) {
    baseLow *= 0.85;
    baseHigh *= 0.9;
  }

  return {
    low: Number(baseLow.toFixed(2)),
    high: Number(baseHigh.toFixed(2))
  };
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

router.post("/estimate-intake", requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    if (req.user!.role !== "client") {
      return res.status(403).json({
        error: "Only client accounts can submit Guru estimate intake"
      });
    }

    const {
      clientName,
      phone,
      email,
      address,
      serviceType,
      propertyArea,
      surfaceType,
      conditionLevel,
      squareFootage,
      preferredSchedule,
      specialConcerns
    } = req.body as {
      clientName?: string;
      phone?: string;
      email?: string;
      address?: string;
      serviceType?: string;
      propertyArea?: string;
      surfaceType?: string;
      conditionLevel?: string;
      squareFootage?: string;
      preferredSchedule?: string;
      specialConcerns?: string;
    };

    if (!clientName || !phone || !email || !address || !serviceType) {
      return res.status(400).json({
        error: "Name, phone, email, address, and service type are required"
      });
    }

    const range = estimateRange({
      serviceType,
      conditionLevel,
      squareFootage
    });

    const profileResult = await client.query(
      `
      SELECT id
      FROM clients
      WHERE user_id = $1
         OR LOWER(email) = LOWER($2)
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [req.user!.id, email.trim()]
    );

    const clientId = profileResult.rows[0]?.id || null;

    await client.query("BEGIN");

    const estimateResult = await client.query(
      `
      INSERT INTO guru_estimates (
        user_id,
        client_id,
        source,
        status,
        client_name,
        phone,
        email,
        address,
        service_type,
        property_area,
        surface_type,
        condition_level,
        square_footage,
        preferred_schedule,
        special_concerns,
        preliminary_notes,
        preliminary_estimate_low,
        preliminary_estimate_high
      )
      VALUES (
        $1,$2,'guru','needs_review',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      )
      RETURNING *
      `,
      [
        req.user!.id,
        clientId,
        clientName.trim(),
        phone.trim(),
        email.trim().toLowerCase(),
        address.trim(),
        serviceType.trim(),
        propertyArea?.trim() || "",
        surfaceType?.trim() || "",
        conditionLevel?.trim() || "",
        squareFootage?.trim() || "",
        preferredSchedule?.trim() || "",
        specialConcerns?.trim() || "",
        "Preliminary Guru estimate only. Final pricing requires admin review, photos when available, and/or in-person verification.",
        range.low,
        range.high
      ]
    );

    await client.query(
      `
      INSERT INTO guru_messages (
        user_id,
        role_context,
        sender,
        body
      )
      VALUES
        ($1, 'client', 'user', $2),
        ($1, 'client', 'guru', $3)
      `,
      [
        req.user!.id,
        `Submitted Guru estimate intake for ${serviceType} at ${address}.`,
        `Thanks. I submitted your preliminary estimate request for admin review. Early range: $${range.low.toFixed(
          2
        )} - $${range.high.toFixed(
          2
        )}. This is not a final quote. NMD will review the details before confirming official pricing.`
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      estimate: mapGuruEstimate(estimateResult.rows[0])
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("guru estimate intake error", error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

router.get(
  "/estimates",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT *
        FROM guru_estimates
        ORDER BY created_at DESC
        `
      );

      return res.json({
        estimates: result.rows.map(mapGuruEstimate)
      });
    } catch (error) {
      console.error("guru estimates list error", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

router.patch(
  "/estimates/:estimateId/review",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { estimateId } = req.params;
      const { status } = req.body as {
        status?: "reviewed" | "converted_to_quote" | "declined" | "archived";
      };

      if (!status || !["reviewed", "converted_to_quote", "declined", "archived"].includes(status)) {
        return res.status(400).json({
          error: "Valid status is required"
        });
      }

      const result = await pool.query(
        `
        UPDATE guru_estimates
        SET
          status = $2,
          reviewed_at = NOW(),
          reviewed_by = $3
        WHERE id = $1
        RETURNING *
        `,
        [estimateId, status, req.user!.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Guru estimate not found"
        });
      }

      return res.json({
        estimate: mapGuruEstimate(result.rows[0])
      });
    } catch (error) {
      console.error("guru estimate review error", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/estimates/:estimateId/convert-to-quote",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { estimateId } = req.params;

      const { quoteTotal, notes } = req.body as {
        quoteTotal?: number;
        notes?: string;
      };

      await client.query("BEGIN");

      const estimateResult = await client.query(
        `
        SELECT *
        FROM guru_estimates
        WHERE id = $1
        LIMIT 1
        `,
        [estimateId]
      );

      if (estimateResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          error: "Guru estimate not found"
        });
      }

      const estimate = estimateResult.rows[0];

      const total =
        quoteTotal !== undefined && quoteTotal !== null
          ? Number(quoteTotal)
          : Number(estimate.preliminary_estimate_high || estimate.preliminary_estimate_low || 0);

      if (!total || total <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Quote total must be greater than 0"
        });
      }

      const serviceDescription = [
        estimate.service_type,
        estimate.property_area ? `Area: ${estimate.property_area}` : "",
        estimate.surface_type ? `Surface: ${estimate.surface_type}` : "",
        estimate.condition_level ? `Condition: ${estimate.condition_level}` : "",
        estimate.square_footage ? `Size: ${estimate.square_footage}` : "",
        estimate.special_concerns ? `Concerns: ${estimate.special_concerns}` : "",
        notes ? `Admin notes: ${notes}` : ""
      ]
        .filter(Boolean)
        .join(" | ");

      const quoteResult = await client.query(
        `
        INSERT INTO quotes (
          client_id,
          client_name,
          service_type,
          total,
          status
        )
        VALUES ($1, $2, $3, $4, 'draft')
        RETURNING *
        `,
        [
          estimate.client_id || null,
          estimate.client_name || "Guru Client",
          serviceDescription || estimate.service_type || "Guru Estimate",
          total
        ]
      );

      const updatedEstimateResult = await client.query(
        `
        UPDATE guru_estimates
        SET
          status = 'converted_to_quote',
          reviewed_at = NOW(),
          reviewed_by = $2
        WHERE id = $1
        RETURNING *
        `,
        [estimateId, req.user!.id]
      );

      if (estimate.user_id) {
        await client.query(
          `
          INSERT INTO guru_messages (
            user_id,
            role_context,
            sender,
            body
          )
          VALUES ($1, 'client', 'guru', $2)
          `,
          [
            estimate.user_id,
            `Your Guru estimate has been reviewed and converted into a draft quote for admin finalization. This is still not a final sent quote until NMD sends it officially.`
          ]
        );
      }

      await client.query("COMMIT");

      return res.status(201).json({
        estimate: mapGuruEstimate(updatedEstimateResult.rows[0]),
        quote: mapQuote(quoteResult.rows[0])
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("guru estimate convert to quote error", error);
      return res.status(500).json({
        error: "Server error"
      });
    } finally {
      client.release();
    }
  }
);

export default router;
