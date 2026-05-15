import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";

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
    quoteId: row.quote_id,
    quoteNumber: row.quote_number ? Number(row.quote_number) : null,
    quoteTotal: row.quote_total ? Number(row.quote_total) : null,
    quoteStatus: row.quote_status || null,
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
    photoDataUrl: row.photo_data_url,
    photoNote: row.photo_note,
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
      return "Photos help NMD estimate more accurately. Upload clear pictures showing the full area, stains, surface type, access points, and any problem spots.";
    }

    if (lower.includes("status") || lower.includes("history")) {
      return "You can check your Guru estimate history from your client portal estimate page. Estimates are preliminary until NMD reviews and confirms official pricing.";
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

function extractNumber(value?: string) {
  if (!value) return 0;

  const clean = value.replace(/,/g, "");
  const matches = clean.match(/\d+(\.\d+)?/g);

  if (!matches || matches.length === 0) return 0;

  return Number(matches[0]) || 0;
}

function textIncludesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function estimateRange(input: {
  serviceType?: string;
  propertyArea?: string;
  surfaceType?: string;
  conditionLevel?: string;
  squareFootage?: string;
  specialConcerns?: string;
}) {
  const service = (input.serviceType || "").toLowerCase();
  const area = (input.propertyArea || "").toLowerCase();
  const surface = (input.surfaceType || "").toLowerCase();
  const condition = (input.conditionLevel || "").toLowerCase();
  const concerns = (input.specialConcerns || "").toLowerCase();
  const combined = `${service} ${area} ${surface} ${condition} ${concerns}`;

  const sqft = extractNumber(input.squareFootage);

  let low = 125;
  let high = 250;
  let pricingBasis = "General NMD minimum service estimate";

  const isRoof = textIncludesAny(combined, ["roof", "shingle", "tile roof", "moss", "black streak"]);
  const isHouse = textIncludesAny(combined, ["house", "siding", "vinyl", "stucco", "soft wash", "exterior"]);
  const isConcrete = textIncludesAny(combined, ["driveway", "concrete", "sidewalk", "walkway", "flatwork", "pool deck", "patio"]);
  const isFence = textIncludesAny(combined, ["fence", "wood fence", "vinyl fence"]);
  const isTrashCan = textIncludesAny(combined, ["trash", "garbage", "can cleaning", "bin"]);
  const isCommercial = textIncludesAny(combined, ["commercial", "storefront", "restaurant", "parking", "business"]);
  const isRestroom = textIncludesAny(combined, ["restroom", "bathroom", "public restroom"]);
  const isPortableRestroom = textIncludesAny(combined, ["portable restroom", "porta", "porta potty", "portable toilet"]);
  const isLuxuryRestroomTrailer = textIncludesAny(combined, ["luxury restroom", "restroom trailer", "trailer"]);
  const isRust = textIncludesAny(combined, ["rust", "irrigation stain", "orange stain", "f9", "barc", "oxalic"]);
  const isOil = textIncludesAny(combined, ["oil", "grease", "degrease", "restaurant grease", "dumpster pad"]);
  const isPaintPrep = textIncludesAny(combined, ["paint prep", "surface prep", "strip", "stain removal", "sealer removal"]);

  if (isTrashCan) {
    low = 10;
    high = 40;
    pricingBasis = "Trash can cleaning preliminary range";
  }

  if (isHouse) {
    low = 200;
    high = 600;
    pricingBasis = "House wash / siding preliminary range";

    if (sqft > 0) {
      low = Math.max(low, sqft * 0.12);
      high = Math.max(high, sqft * 0.35);
    }
  }

  if (isRoof) {
    low = 350;
    high = 900;
    pricingBasis = "Roof cleaning preliminary range";

    if (sqft > 0) {
      low = Math.max(low, sqft * 0.25);
      high = Math.max(high, sqft * 0.55);
    }
  }

  if (isConcrete) {
    low = 125;
    high = 450;
    pricingBasis = "Driveway/concrete/flatwork preliminary range";

    if (sqft > 0) {
      low = Math.max(low, sqft * 0.15);
      high = Math.max(high, sqft * 0.45);
    }
  }

  if (isFence) {
    low = 200;
    high = 700;
    pricingBasis = "Fence cleaning preliminary range";

    if (sqft > 0) {
      low = Math.max(low, sqft * 0.2);
      high = Math.max(high, sqft * 0.6);
    }
  }

  if (isCommercial) {
    low = 300;
    high = 1500;
    pricingBasis = "Commercial cleaning preliminary range";

    if (sqft > 0) {
      low = Math.max(low, sqft * 0.15);
      high = Math.max(high, sqft * 0.8);
    }
  }

  if (isRestroom && !isPortableRestroom && !isLuxuryRestroomTrailer) {
    low = 200;
    high = 500;
    pricingBasis = "Public restroom cleaning preliminary range";

    if (sqft > 0) {
      low = Math.max(150, sqft * 0.15);
      high = Math.max(400, sqft * 0.8);
    }
  }

  if (isPortableRestroom) {
    const unitCount = Math.max(1, sqft || extractNumber(input.propertyArea) || 1);

    low = unitCount * 50;
    high = unitCount * 150;
    pricingBasis = "Portable restroom cleaning preliminary range";
  }

  if (isLuxuryRestroomTrailer) {
    low = 150;
    high = 300;
    pricingBasis = "Luxury restroom trailer cleaning preliminary range";
  }

  if (isRust) {
    low = 125;
    high = 800;
    pricingBasis = "Rust removal / specialty restoration preliminary range";

    if (sqft > 0) {
      low = Math.max(low, sqft * 0.4);
      high = Math.max(high, sqft * 1.25);
    }
  }

  if (isOil) {
    low = Math.max(low, 175);
    high = Math.max(high, 850);
    pricingBasis = `${pricingBasis} + oil/grease specialty concern`;
  }

  if (isPaintPrep) {
    low = Math.max(low, 250);
    high = Math.max(high, 1200);
    pricingBasis = `${pricingBasis} + surface prep/stripping concern`;
  }

  if (condition.includes("moderate")) {
    low *= 1.05;
    high *= 1.15;
  }

  if (
    condition.includes("heavy") ||
    condition.includes("bad") ||
    condition.includes("severe") ||
    concerns.includes("heavy") ||
    concerns.includes("severe")
  ) {
    low *= 1.25;
    high *= 1.5;
  }

  if (condition.includes("light") || condition.includes("easy")) {
    low *= 0.85;
    high *= 0.9;
  }

  if (concerns.includes("oxidation")) {
    low *= 1.15;
    high *= 1.35;
    pricingBasis = `${pricingBasis} + oxidation caution`;
  }

  if (concerns.includes("plant") || concerns.includes("landscape")) {
    high *= 1.1;
    pricingBasis = `${pricingBasis} + plant protection`;
  }

  low = Math.max(10, low);
  high = Math.max(low, high);

  return {
    low: Number(low.toFixed(2)),
    high: Number(high.toFixed(2)),
    pricingBasis
  };
}

async function sendGuruEstimateCreatedEmails(input: {
  estimate: any;
  low: number;
  high: number;
}) {
  const adminEmail = process.env.NMD_ADMIN_EMAIL || "nmdpowash@gmail.com";
  const estimate = input.estimate;

  await sendEmail({
    to: adminEmail,
    subject: `New Guru estimate needs review: ${estimate.client_name || "Client"}`,
    html: buildNmdEmailTemplate({
      title: "New Guru Estimate",
      message: `
        <p>A new Guru estimate was submitted and needs admin review.</p>
        <p><strong>Client:</strong> ${estimate.client_name || "—"}</p>
        <p><strong>Phone:</strong> ${estimate.phone || "—"}</p>
        <p><strong>Email:</strong> ${estimate.email || "—"}</p>
        <p><strong>Address:</strong> ${estimate.address || "—"}</p>
        <p><strong>Service:</strong> ${estimate.service_type || "—"}</p>
        <p><strong>Property Area:</strong> ${estimate.property_area || "—"}</p>
        <p><strong>Surface:</strong> ${estimate.surface_type || "—"}</p>
        <p><strong>Condition:</strong> ${estimate.condition_level || "—"}</p>
        <p><strong>Size:</strong> ${estimate.square_footage || "—"}</p>
        <p><strong>Preferred Schedule:</strong> ${estimate.preferred_schedule || "—"}</p>
        <p><strong>Special Concerns:</strong> ${estimate.special_concerns || "—"}</p>
        <p><strong>Photo Uploaded:</strong> ${estimate.photo_data_url ? "Yes" : "No"}</p>
        <p><strong>Photo Note:</strong> ${estimate.photo_note || "—"}</p>
        <p><strong>Preliminary Range:</strong> $${input.low.toFixed(2)} - $${input.high.toFixed(2)}</p>
        <p>This is preliminary only. Review it inside the NMD admin portal before sending an official quote.</p>
      `
    }),
    text: `New Guru estimate needs review for ${estimate.client_name || "Client"}. Preliminary range: $${input.low.toFixed(2)} - $${input.high.toFixed(2)}.`
  });

  if (estimate.email) {
    await sendEmail({
      to: estimate.email,
      subject: "NMD received your Guru estimate request",
      html: buildNmdEmailTemplate({
        title: "Estimate Request Received",
        message: `
          <p>Hi ${estimate.client_name || "there"},</p>
          <p>Your Guru estimate request has been received by NMD Pressure Washing Services.</p>
          <p><strong>Service:</strong> ${estimate.service_type || "—"}</p>
          <p><strong>Address:</strong> ${estimate.address || "—"}</p>
          <p><strong>Preliminary Range:</strong> $${input.low.toFixed(2)} - $${input.high.toFixed(2)}</p>
          <p>This is not a final quote. NMD will review your request, photos if provided, surface condition, access, and service details before confirming official pricing.</p>
          <p>You can log into your client portal to check your estimate status.</p>
        `
      }),
      text: `NMD received your Guru estimate request. Preliminary range: $${input.low.toFixed(2)} - $${input.high.toFixed(2)}. This is not a final quote.`
    });
  }
}

async function sendGuruEstimateStatusEmail(input: {
  estimate: any;
  status: "reviewed" | "converted_to_quote" | "declined" | "archived";
  quote?: any;
}) {
  const estimate = input.estimate;
  const clientEmail = estimate.email;

  if (!clientEmail) return;

  let subject = "NMD Guru estimate update";
  let title = "Estimate Update";
  let message = "";

  if (input.status === "reviewed") {
    subject = "NMD reviewed your Guru estimate";
    title = "Estimate Reviewed";
    message = `
      <p>Hi ${estimate.client_name || "there"},</p>
      <p>NMD has reviewed your Guru estimate request.</p>
      <p><strong>Service:</strong> ${estimate.service_type || "—"}</p>
      <p><strong>Address:</strong> ${estimate.address || "—"}</p>
      <p>This is still not a final quote unless NMD sends you an official quote. We may follow up if more information, photos, or verification is needed.</p>
    `;
  }

  if (input.status === "converted_to_quote") {
    subject = "NMD is preparing your official quote";
    title = "Estimate Moved To Quote Prep";
    message = `
      <p>Hi ${estimate.client_name || "there"},</p>
      <p>Your Guru estimate has been moved into quote preparation.</p>
      <p><strong>Service:</strong> ${estimate.service_type || "—"}</p>
      <p><strong>Address:</strong> ${estimate.address || "—"}</p>
      ${
        input.quote
          ? `<p><strong>Draft Quote:</strong> #${input.quote.quote_number}</p>`
          : ""
      }
      <p>This still requires final admin review before it becomes an official quote sent to you.</p>
    `;
  }

  if (input.status === "declined") {
    subject = "NMD Guru estimate update";
    title = "Estimate Request Update";
    message = `
      <p>Hi ${estimate.client_name || "there"},</p>
      <p>NMD reviewed your Guru estimate request and could not approve it as submitted.</p>
      <p><strong>Service:</strong> ${estimate.service_type || "—"}</p>
      <p><strong>Address:</strong> ${estimate.address || "—"}</p>
      <p>You can contact NMD or submit a new request with updated details/photos if needed.</p>
    `;
  }

  if (input.status === "archived") {
    subject = "NMD Guru estimate archived";
    title = "Estimate Archived";
    message = `
      <p>Hi ${estimate.client_name || "there"},</p>
      <p>Your Guru estimate request has been archived.</p>
      <p><strong>Service:</strong> ${estimate.service_type || "—"}</p>
      <p><strong>Address:</strong> ${estimate.address || "—"}</p>
      <p>If this was unexpected, please contact NMD or submit a new request.</p>
    `;
  }

  await sendEmail({
    to: clientEmail,
    subject,
    html: buildNmdEmailTemplate({
      title,
      message
    }),
    text: `${title}: ${estimate.service_type || "NMD service"} at ${estimate.address || "your property"}.`
  });
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
      specialConcerns,
      photoDataUrl,
      photoNote
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
      photoDataUrl?: string | null;
      photoNote?: string;
    };

    if (!clientName || !phone || !email || !address || !serviceType) {
      return res.status(400).json({
        error: "Name, phone, email, address, and service type are required"
      });
    }

    if (photoDataUrl && photoDataUrl.length > 2_500_000) {
      return res.status(400).json({
        error: "Estimate photo is too large. Please upload a smaller image."
      });
    }

    const range = estimateRange({
      serviceType,
      propertyArea,
      surfaceType,
      conditionLevel,
      squareFootage,
      specialConcerns
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
        preliminary_estimate_high,
        photo_data_url,
        photo_note
      )
      VALUES (
        $1,$2,'guru','needs_review',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
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
        `Preliminary Guru estimate only. Final pricing requires admin review, photos when available, and/or in-person verification. Pricing basis: ${range.pricingBasis}.`,
        range.low,
        range.high,
        photoDataUrl || null,
        photoNote?.trim() || ""
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
        `Submitted Guru estimate intake for ${serviceType} at ${address}${photoDataUrl ? " with a photo." : "."}`,
        `Thanks. I submitted your preliminary estimate request for admin review. Early range: $${range.low.toFixed(
          2
        )} - $${range.high.toFixed(
          2
        )}. This is not a final quote. NMD will review the details${photoDataUrl ? " and photo" : ""} before confirming official pricing.`
      ]
    );

    await client.query("COMMIT");

    const estimate = estimateResult.rows[0];

    sendGuruEstimateCreatedEmails({
      estimate,
      low: range.low,
      high: range.high
    }).catch((emailError) => {
      console.error("guru estimate email notification error", emailError);
    });

    return res.status(201).json({
      estimate: mapGuruEstimate(estimate)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("guru estimate intake error", error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

router.get("/my-estimates", requireAuth, requireRole("client"), async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        ge.*,
        q.quote_number,
        q.total AS quote_total,
        q.status AS quote_status
      FROM guru_estimates ge
      LEFT JOIN quotes q ON q.id = ge.quote_id
      WHERE ge.user_id = $1
         OR LOWER(ge.email) = LOWER($2)
      ORDER BY ge.created_at DESC
      `,
      [req.user!.id, req.user!.email]
    );

    return res.json({
      estimates: result.rows.map(mapGuruEstimate)
    });
  } catch (error) {
    console.error("guru my estimates list error", error);
    return res.status(500).json({ error: "Server error" });
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
        SELECT
          ge.*,
          q.quote_number,
          q.total AS quote_total,
          q.status AS quote_status
        FROM guru_estimates ge
        LEFT JOIN quotes q ON q.id = ge.quote_id
        ORDER BY ge.created_at DESC
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

      const currentResult = await pool.query(
        `
        SELECT *
        FROM guru_estimates
        WHERE id = $1
        LIMIT 1
        `,
        [estimateId]
      );

      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          error: "Guru estimate not found"
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

      const estimate = result.rows[0];

      if (estimate.user_id) {
        await pool.query(
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
            status === "reviewed"
              ? "NMD has reviewed your Guru estimate request. Official pricing still requires final quote approval."
              : status === "declined"
                ? "NMD reviewed your Guru estimate request and could not approve it as submitted."
                : status === "archived"
                  ? "Your Guru estimate request has been archived."
                  : "Your Guru estimate status has been updated."
          ]
        );
      }

      sendGuruEstimateStatusEmail({
        estimate,
        status
      }).catch((emailError) => {
        console.error("guru estimate status email error", emailError);
      });

      return res.json({
        estimate: mapGuruEstimate(estimate)
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
        estimate.photo_note ? `Photo note: ${estimate.photo_note}` : "",
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

      const quote = quoteResult.rows[0];

      const updatedEstimateResult = await client.query(
        `
        UPDATE guru_estimates
        SET
          status = 'converted_to_quote',
          quote_id = $2,
          reviewed_at = NOW(),
          reviewed_by = $3
        WHERE id = $1
        RETURNING *
        `,
        [estimateId, quote.id, req.user!.id]
      );

      const updatedEstimate = updatedEstimateResult.rows[0];

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
            `Your Guru estimate has been reviewed and connected to draft Quote #${quote.quote_number}. This is still not a final sent quote until NMD sends it officially.`
          ]
        );
      }

      await client.query("COMMIT");

      sendGuruEstimateStatusEmail({
        estimate: updatedEstimate,
        status: "converted_to_quote",
        quote
      }).catch((emailError) => {
        console.error("guru estimate converted email error", emailError);
      });

      return res.status(201).json({
        estimate: mapGuruEstimate({
          ...updatedEstimate,
          quote_number: quote.quote_number,
          quote_total: quote.total,
          quote_status: quote.status
        }),
        quote: mapQuote(quote)
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
