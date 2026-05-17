import express from "express";
import { Pool } from "pg";
import { requireAuth, type AuthenticatedRequest } from "../middleware/authGuard.js";

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false
        }
      : undefined
});

type UserRole = "superadmin" | "admin" | "employee" | "client";

type GuruMessageRow = {
  id: string;
  user_id: string;
  role_context: "admin" | "employee" | "client";
  sender: "guru" | "user";
  body: string;
  created_at: string;
};

type GuruEstimateRow = {
  id: string;
  client_user_id: string | null;
  client_name: string;
  phone: string;
  email: string;
  address: string;
  service_type: string;
  property_area: string;
  surface_type: string;
  condition_level: string;
  square_footage: string;
  preferred_schedule: string;
  special_concerns: string;
  photo_data_url: string | null;
  photo_note: string | null;
  preliminary_estimate_low: string | number;
  preliminary_estimate_high: string | number;
  preliminary_notes: string | null;
  status: string;
  quote_id: string | null;
  quote_number: number | null;
  quote_total: string | number | null;
  quote_status: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  converted_at: string | null;
};

type TreatmentSearchRow = {
  record_type: "treatment" | "case" | "plan";
  id: string;
  title: string;
  category: string | null;
  surface_type: string | null;
  problem_type: string | null;
  chemical: string | null;
  dilution_ratio: string | null;
  risk_level: string | null;
  instructions: string | null;
  safety_notes: string | null;
  pricing_note: string | null;
  customer_expectation: string | null;
  source_name: string | null;
  created_at: string;
};

function getUser(req: AuthenticatedRequest) {
  if (!req.authUser) {
    throw new Error("Missing authenticated user.");
  }

  return req.authUser;
}

function normalizeRole(role: unknown): UserRole {
  if (role === "superadmin") return "superadmin";
  if (role === "admin") return "admin";
  if (role === "employee") return "employee";
  return "client";
}

function getRoleContext(role: UserRole): "admin" | "employee" | "client" {
  if (role === "superadmin" || role === "admin") return "admin";
  if (role === "employee") return "employee";
  return "client";
}

function isAdminRole(role: UserRole) {
  return role === "superadmin" || role === "admin";
}

function mapMessage(row: GuruMessageRow) {
  return {
    id: row.id,
    userId: row.user_id,
    roleContext: row.role_context,
    sender: row.sender,
    body: row.body,
    createdAt: row.created_at
  };
}

function mapEstimate(row: GuruEstimateRow) {
  return {
    id: row.id,
    clientUserId: row.client_user_id,
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
    photoDataUrl: row.photo_data_url,
    photoNote: row.photo_note,
    preliminaryEstimateLow: Number(row.preliminary_estimate_low || 0),
    preliminaryEstimateHigh: Number(row.preliminary_estimate_high || 0),
    preliminaryNotes: row.preliminary_notes,
    status: row.status,
    quoteId: row.quote_id,
    quoteNumber: row.quote_number,
    quoteTotal:
      row.quote_total === null || row.quote_total === undefined
        ? null
        : Number(row.quote_total),
    quoteStatus: row.quote_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at,
    convertedAt: row.converted_at
  };
}

function mapTreatmentSearchResult(row: TreatmentSearchRow) {
  return {
    recordType: row.record_type,
    id: row.id,
    title: row.title,
    category: row.category || "",
    surfaceType: row.surface_type || "",
    problemType: row.problem_type || "",
    chemical: row.chemical || "",
    dilutionRatio: row.dilution_ratio || "",
    riskLevel: row.risk_level || "Standard",
    instructions: row.instructions || "",
    safetyNotes: row.safety_notes || "",
    pricingNote: row.pricing_note || "",
    customerExpectation: row.customer_expectation || "",
    sourceName: row.source_name || "",
    createdAt: row.created_at
  };
}

async function ensureGuruTables() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guru_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      role_context TEXT NOT NULL DEFAULT 'client',
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS guru_messages_user_id_idx
    ON guru_messages (user_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guru_estimates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_user_id UUID NULL,
      client_name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      service_type TEXT NOT NULL DEFAULT '',
      property_area TEXT NOT NULL DEFAULT '',
      surface_type TEXT NOT NULL DEFAULT '',
      condition_level TEXT NOT NULL DEFAULT '',
      square_footage TEXT NOT NULL DEFAULT '',
      preferred_schedule TEXT NOT NULL DEFAULT '',
      special_concerns TEXT NOT NULL DEFAULT '',
      photo_data_url TEXT NULL,
      photo_note TEXT NULL,
      preliminary_estimate_low NUMERIC NOT NULL DEFAULT 0,
      preliminary_estimate_high NUMERIC NOT NULL DEFAULT 0,
      preliminary_notes TEXT NULL,
      status TEXT NOT NULL DEFAULT 'needs_review',
      quote_id UUID NULL,
      quote_number INTEGER NULL,
      quote_total NUMERIC NULL,
      quote_status TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ NULL,
      converted_at TIMESTAMPTZ NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS guru_estimates_status_idx
    ON guru_estimates (status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS guru_estimates_client_user_id_idx
    ON guru_estimates (client_user_id, created_at DESC);
  `);
}

async function ensureTreatmentSearchTables() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS treatments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      surface_types TEXT[] NOT NULL DEFAULT '{}',
      chemical TEXT NULL,
      dilution_ratio TEXT NULL,
      use_case TEXT NULL,
      safety_notes TEXT NULL,
      instructions TEXT NULL,
      purchase_link TEXT NULL,
      cost_reference TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS treatment_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      treatment_id UUID NULL REFERENCES treatments(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      surface_type TEXT NULL,
      condition_level TEXT NULL,
      problem_type TEXT NULL,
      recommended_mix TEXT NULL,
      dwell_time TEXT NULL,
      tools_needed TEXT NULL,
      step_by_step TEXT NULL,
      safety_checklist TEXT NULL,
      pricing_note TEXT NULL,
      customer_expectation TEXT NULL,
      risk_level TEXT NOT NULL DEFAULT 'Standard',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS treatment_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_name TEXT NOT NULL,
      client_name TEXT NULL,
      service_address TEXT NULL,
      surface_type TEXT NULL,
      condition_level TEXT NULL,
      selected_treatment_ids UUID[] NOT NULL DEFAULT '{}',
      selected_case_ids UUID[] NOT NULL DEFAULT '{}',
      notes TEXT NULL,
      plan_text TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function buildGuruReply(input: {
  role: UserRole;
  body: string;
}) {
  const lower = input.body.toLowerCase();

  if (
    lower.includes("treatment") ||
    lower.includes("chemical") ||
    lower.includes("mix") ||
    lower.includes("roof") ||
    lower.includes("rust") ||
    lower.includes("concrete") ||
    lower.includes("oxidation")
  ) {
    return "I can help with treatment guidance. Open the Treatments page and use Guru Search, Treatment Cases, Field Mode, or the SH Calculator. Employees can view approved guidance only. Admin/Super Admin can seed or upload treatment records.";
  }

  if (lower.includes("estimate") || lower.includes("quote")) {
    if (input.role === "client") {
      return "I can help start a preliminary estimate. Please provide service type, surface, condition, address, photos if available, and preferred schedule. NMD will review before sending an official quote.";
    }

    return "I can help review estimates, treatment risks, and quote workflow. Use Guru Review for submitted estimates and Treatments/Pricing for job-specific guidance.";
  }

  if (input.role === "employee") {
    return "I can help with field workflow, treatments, safety reminders, and service guidance. For high-risk treatment decisions, escalate to Admin or Super Admin.";
  }

  if (input.role === "superadmin") {
    return "Owner mode is active. I can help with operations, estimates, quotes, treatments, pricing, payments, employees, expenses, mileage, recurring services, and business analysis.";
  }

  if (input.role === "admin") {
    return "I can help with admin operations, estimates, quotes, treatments, pricing, payments, schedules, expenses, mileage, and client follow-up.";
  }

  return "I have this noted. For estimates, please provide the service type, surface, condition, address, photos if available, and preferred schedule.";
}

router.get("/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureGuruTables();

    const user = getUser(req);

    const result = await pool.query<GuruMessageRow>(
      `
        SELECT *
        FROM guru_messages
        WHERE user_id = $1
        ORDER BY created_at ASC
        LIMIT 100;
      `,
      [user.id]
    );

    return res.json({
      messages: result.rows.map(mapMessage)
    });
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Could not load Guru messages."
    });
  }
});

router.post("/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureGuruTables();

    const user = getUser(req);
    const userRole = normalizeRole(user.role);
    const body = String(req.body?.body || "").trim();

    if (!body) {
      return res.status(400).json({
        message: "Guru message body is required."
      });
    }

    const roleContext = getRoleContext(userRole);
    const reply = buildGuruReply({
      role: userRole,
      body
    });

    const userMessage = await pool.query<GuruMessageRow>(
      `
        INSERT INTO guru_messages (user_id, role_context, sender, body)
        VALUES ($1, $2, 'user', $3)
        RETURNING *;
      `,
      [user.id, roleContext, body]
    );

    const guruMessage = await pool.query<GuruMessageRow>(
      `
        INSERT INTO guru_messages (user_id, role_context, sender, body)
        VALUES ($1, $2, 'guru', $3)
        RETURNING *;
      `,
      [user.id, roleContext, reply]
    );

    return res.status(201).json({
      userMessage: mapMessage(userMessage.rows[0]),
      guruMessage: mapMessage(guruMessage.rows[0])
    });
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Could not save Guru message."
    });
  }
});

router.delete("/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureGuruTables();

    const user = getUser(req);

    await pool.query(
      `
        DELETE FROM guru_messages
        WHERE user_id = $1;
      `,
      [user.id]
    );

    return res.json({
      message: "Guru chat history cleared."
    });
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Could not clear Guru messages."
    });
  }
});

router.get("/treatment-search", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureTreatmentSearchTables();

    const user = getUser(req);
    const userRole = normalizeRole(user.role);

    if (userRole === "client") {
      return res.status(403).json({
        message: "Treatment database search is for Super Admin, Admin, and Employee users."
      });
    }

    const search = String(req.query.search || "").trim();
    const riskLevel = String(req.query.riskLevel || "all").trim().toLowerCase();
    const recordType = String(req.query.recordType || "all").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit || 75), 1), 100);

    const result = await pool.query<TreatmentSearchRow>(
      `
        WITH combined AS (
          SELECT
            'treatment'::TEXT AS record_type,
            id,
            name AS title,
            category,
            array_to_string(surface_types, ', ') AS surface_type,
            use_case AS problem_type,
            chemical,
            dilution_ratio,
            CASE
              WHEN LOWER(
                name || ' ' ||
                category || ' ' ||
                COALESCE(chemical,'') || ' ' ||
                COALESCE(safety_notes,'') || ' ' ||
                COALESCE(instructions,'') || ' ' ||
                COALESCE(use_case,'')
              ) LIKE '%roof%'
              OR LOWER(
                name || ' ' ||
                category || ' ' ||
                COALESCE(chemical,'') || ' ' ||
                COALESCE(safety_notes,'') || ' ' ||
                COALESCE(instructions,'') || ' ' ||
                COALESCE(use_case,'')
              ) LIKE '%rust%'
              OR LOWER(
                name || ' ' ||
                category || ' ' ||
                COALESCE(chemical,'') || ' ' ||
                COALESCE(safety_notes,'') || ' ' ||
                COALESCE(instructions,'') || ' ' ||
                COALESCE(use_case,'')
              ) LIKE '%oxidation%'
              OR LOWER(
                name || ' ' ||
                category || ' ' ||
                COALESCE(chemical,'') || ' ' ||
                COALESCE(safety_notes,'') || ' ' ||
                COALESCE(instructions,'') || ' ' ||
                COALESCE(use_case,'')
              ) LIKE '%painted%'
              OR LOWER(
                name || ' ' ||
                category || ' ' ||
                COALESCE(chemical,'') || ' ' ||
                COALESCE(safety_notes,'') || ' ' ||
                COALESCE(instructions,'') || ' ' ||
                COALESCE(use_case,'')
              ) LIKE '%new concrete%'
              THEN 'High Review'
              WHEN LOWER(
                name || ' ' ||
                category || ' ' ||
                COALESCE(chemical,'') || ' ' ||
                COALESCE(safety_notes,'') || ' ' ||
                COALESCE(instructions,'') || ' ' ||
                COALESCE(use_case,'')
              ) LIKE '%wood%'
              OR LOWER(
                name || ' ' ||
                category || ' ' ||
                COALESCE(chemical,'') || ' ' ||
                COALESCE(safety_notes,'') || ' ' ||
                COALESCE(instructions,'') || ' ' ||
                COALESCE(use_case,'')
              ) LIKE '%paver%'
              OR LOWER(
                name || ' ' ||
                category || ' ' ||
                COALESCE(chemical,'') || ' ' ||
                COALESCE(safety_notes,'') || ' ' ||
                COALESCE(instructions,'') || ' ' ||
                COALESCE(use_case,'')
              ) LIKE '%plant%'
              THEN 'Moderate'
              ELSE 'Standard'
            END AS risk_level,
            instructions,
            safety_notes,
            cost_reference AS pricing_note,
            NULL::TEXT AS customer_expectation,
            name AS source_name,
            created_at
          FROM treatments

          UNION ALL

          SELECT
            'case'::TEXT AS record_type,
            tc.id,
            tc.title,
            COALESCE(t.category, 'Treatment Case') AS category,
            tc.surface_type,
            tc.problem_type,
            tc.recommended_mix AS chemical,
            tc.dwell_time AS dilution_ratio,
            COALESCE(tc.risk_level, 'Standard') AS risk_level,
            tc.step_by_step AS instructions,
            tc.safety_checklist AS safety_notes,
            tc.pricing_note,
            tc.customer_expectation,
            COALESCE(t.name, 'Treatment Case') AS source_name,
            tc.created_at
          FROM treatment_cases tc
          LEFT JOIN treatments t ON t.id = tc.treatment_id

          UNION ALL

          SELECT
            'plan'::TEXT AS record_type,
            id,
            job_name AS title,
            'Saved Plan'::TEXT AS category,
            surface_type,
            notes AS problem_type,
            NULL::TEXT AS chemical,
            condition_level AS dilution_ratio,
            'Saved Plan'::TEXT AS risk_level,
            plan_text AS instructions,
            notes AS safety_notes,
            NULL::TEXT AS pricing_note,
            NULL::TEXT AS customer_expectation,
            client_name AS source_name,
            created_at
          FROM treatment_plans
        )
        SELECT *
        FROM combined
        WHERE
          (
            $1 = ''
            OR LOWER(title) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(category, '')) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(surface_type, '')) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(problem_type, '')) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(chemical, '')) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(dilution_ratio, '')) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(instructions, '')) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(safety_notes, '')) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(pricing_note, '')) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(customer_expectation, '')) LIKE LOWER('%' || $1 || '%')
            OR LOWER(COALESCE(source_name, '')) LIKE LOWER('%' || $1 || '%')
          )
          AND (
            $2 = 'all'
            OR LOWER(COALESCE(risk_level, 'standard')) = $2
          )
          AND (
            $3 = 'all'
            OR LOWER(record_type) = $3
          )
        ORDER BY
          CASE
            WHEN LOWER(COALESCE(risk_level, 'standard')) = 'high review' THEN 1
            WHEN LOWER(COALESCE(risk_level, 'standard')) = 'moderate' THEN 2
            WHEN LOWER(COALESCE(risk_level, 'standard')) = 'saved plan' THEN 3
            ELSE 4
          END,
          record_type ASC,
          title ASC
        LIMIT $4;
      `,
      [search, riskLevel, recordType, limit]
    );

    return res.json({
      results: result.rows.map(mapTreatmentSearchResult)
    });
  } catch (err) {
    console.error("Guru treatment search error:", err);

    return res.status(500).json({
      message:
        err instanceof Error
          ? err.message
          : "Failed to search Guru treatment database."
    });
  }
});

router.post("/estimate-intake", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureGuruTables();

    const user = getUser(req);
    const userRole = normalizeRole(user.role);

    if (userRole !== "client") {
      return res.status(403).json({
        message: "Only client accounts can submit Guru estimates."
      });
    }

    const serviceType = String(req.body?.serviceType || "").trim();
    const address = String(req.body?.address || "").trim();

    if (!serviceType || !address) {
      return res.status(400).json({
        message: "Service type and address are required."
      });
    }

    const squareFootageText = String(req.body?.squareFootage || "").replace(/[^\d.]/g, "");
    const squareFootage = Number(squareFootageText || 0);
    const conditionLevel = String(req.body?.conditionLevel || "").toLowerCase();

    const baseLow = squareFootage > 0 ? squareFootage * 0.18 : 150;
    const baseHigh = squareFootage > 0 ? squareFootage * 0.35 : 350;

    const conditionMultiplier =
      conditionLevel.includes("severe") || conditionLevel.includes("heavy")
        ? 1.5
        : conditionLevel.includes("moderate")
          ? 1.25
          : 1;

    const preliminaryLow = Math.max(125, baseLow * conditionMultiplier);
    const preliminaryHigh = Math.max(preliminaryLow + 75, baseHigh * conditionMultiplier);

    const result = await pool.query<GuruEstimateRow>(
      `
        INSERT INTO guru_estimates (
          client_user_id,
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
          photo_data_url,
          photo_note,
          preliminary_estimate_low,
          preliminary_estimate_high,
          preliminary_notes,
          status,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'needs_review',NOW())
        RETURNING *;
      `,
      [
        user.id,
        String(req.body?.clientName || user.email || "").trim(),
        String(req.body?.phone || "").trim(),
        String(req.body?.email || user.email || "").trim(),
        address,
        serviceType,
        String(req.body?.propertyArea || "").trim(),
        String(req.body?.surfaceType || "").trim(),
        String(req.body?.conditionLevel || "").trim(),
        String(req.body?.squareFootage || "").trim(),
        String(req.body?.preferredSchedule || "").trim(),
        String(req.body?.specialConcerns || "").trim(),
        String(req.body?.photoDataUrl || "").trim() || null,
        String(req.body?.photoNote || "").trim() || null,
        preliminaryLow,
        preliminaryHigh,
        "Preliminary Guru estimate only. Admin review required before official quote."
      ]
    );

    return res.status(201).json({
      estimate: mapEstimate(result.rows[0])
    });
  } catch (err) {
    console.error("Guru estimate intake error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Could not submit Guru estimate."
    });
  }
});

router.get("/estimates", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureGuruTables();

    const user = getUser(req);
    const userRole = normalizeRole(user.role);

    if (!isAdminRole(userRole)) {
      return res.status(403).json({
        message: "Only Admin or Super Admin can view all Guru estimates."
      });
    }

    const result = await pool.query<GuruEstimateRow>(
      `
        SELECT *
        FROM guru_estimates
        ORDER BY created_at DESC;
      `
    );

    return res.json({
      estimates: result.rows.map(mapEstimate)
    });
  } catch (err) {
    console.error("Get Guru estimates error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Could not load Guru estimates."
    });
  }
});

router.get("/my-estimates", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureGuruTables();

    const user = getUser(req);

    const result = await pool.query<GuruEstimateRow>(
      `
        SELECT *
        FROM guru_estimates
        WHERE client_user_id = $1
        ORDER BY created_at DESC;
      `,
      [user.id]
    );

    return res.json({
      estimates: result.rows.map(mapEstimate)
    });
  } catch (err) {
    console.error("Get my Guru estimates error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Could not load your Guru estimates."
    });
  }
});

export default router;
