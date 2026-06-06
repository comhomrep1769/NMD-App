import express from "express";
import { Pool } from "pg";
import { requireAuth } from "../middleware/authGuard.js";
const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false
        }
        : undefined
});
function getUser(req) {
    if (!req.authUser) {
        throw new Error("Missing authenticated user.");
    }
    return req.authUser;
}
function normalizeRole(role) {
    if (role === "superadmin")
        return "superadmin";
    if (role === "admin")
        return "admin";
    if (role === "employee")
        return "employee";
    return "client";
}
function getRoleContext(role) {
    if (role === "superadmin" || role === "admin")
        return "admin";
    if (role === "employee")
        return "employee";
    return "client";
}
function isAdminRole(role) {
    return role === "superadmin" || role === "admin";
}
function mapMessage(row) {
    return {
        id: row.id,
        userId: row.user_id,
        roleContext: row.role_context,
        sender: row.sender,
        body: row.body,
        createdAt: row.created_at
    };
}
function mapEstimate(row) {
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
        quoteTotal: row.quote_total === null || row.quote_total === undefined
            ? null
            : Number(row.quote_total),
        quoteStatus: row.quote_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        reviewedAt: row.reviewed_at,
        convertedAt: row.converted_at
    };
}
function mapTreatmentSearchResult(row) {
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
async function buildGuruReply(input) {
    const lower = input.body.toLowerCase();
    // PRICING RATES
    const rates = {
        mobile_home: { low: 0.62, high: 0.77, unit: "sqft" },
        tile_roof: { low: 0.51, high: 0.63, unit: "sqft" },
        "2_story": { low: 0.48, high: 0.59, unit: "sqft" },
        "two story": { low: 0.48, high: 0.59, unit: "sqft" },
        deck: { low: 0.46, high: 0.57, unit: "sqft" },
        "1_story": { low: 0.45, high: 0.56, unit: "sqft" },
        "one story": { low: 0.45, high: 0.56, unit: "sqft" },
        house: { low: 0.45, high: 0.56, unit: "sqft" },
        home: { low: 0.45, high: 0.56, unit: "sqft" },
        fence: { low: 0.43, high: 0.53, unit: "sqft" },
        driveway: { low: 0.42, high: 0.52, unit: "sqft" },
        concrete: { low: 0.42, high: 0.52, unit: "sqft" },
        brick: { low: 0.40, high: 0.50, unit: "sqft" },
        "pool deck": { low: 0.40, high: 0.50, unit: "sqft" },
        patio: { low: 0.39, high: 0.49, unit: "sqft" },
        roof: { low: 0.39, high: 0.49, unit: "sqft" },
        gutter: { low: 1.10, high: 1.35, unit: "linear ft" },
        gutters: { low: 1.10, high: 1.35, unit: "linear ft" },
        moss: { low: 0.72, high: 1.39, unit: "sqft" },
        soffit: { low: 1.12, high: 1.38, unit: "sqft" },
        shutter: { low: 26.25, high: 32.79, unit: "per shutter" },
        shutters: { low: 26.25, high: 32.79, unit: "per shutter" },
    };
    // Default sqft by surface type
    const defaultSqft = {
        house: 1500, home: 1500,
        "1_story": 1500, "one story": 1500,
        "2_story": 2400, "two story": 2400,
        driveway: 500, concrete: 500,
        deck: 300, patio: 300,
        fence: 400,
        roof: 2000, tile_roof: 2000,
        mobile_home: 1200,
    };
    // Extract sqft from message
    const sqftMatch = lower.match(/(\d[\d,]*)\s*(sqft|sq\.?\s*ft|square\s*feet|sf)\b/);
    const mentionedSqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, "")) : null;
    // Detect intent
    const isEstimateRequest = lower.includes("how much") ||
        lower.includes("price") ||
        lower.includes("cost") ||
        lower.includes("estimate") ||
        lower.includes("quote") ||
        lower.includes("charge") ||
        lower.includes("what would") ||
        lower.includes("how much would") ||
        lower.includes("pricing");
    const isRustQuestion = lower.includes("rust") ||
        lower.includes("orange stain") ||
        lower.includes("fertilizer stain") ||
        lower.includes("irrigation stain");
    const isChemicalQuestion = lower.includes("chemical") ||
        lower.includes("bleach") ||
        lower.includes("soft wash") ||
        lower.includes("sodium") ||
        lower.includes("mix ratio") ||
        lower.includes("dilut");
    const isTreatmentQuestion = lower.includes("treatment") ||
        lower.includes("how to clean") ||
        lower.includes("how do you clean") ||
        lower.includes("mold") ||
        lower.includes("mildew") ||
        lower.includes("algae") ||
        lower.includes("oxidation") ||
        lower.includes("stain");
    const isSafetyQuestion = lower.includes("safe") ||
        lower.includes("ppe") ||
        lower.includes("protect") ||
        lower.includes("danger") ||
        lower.includes("hazard");
    // ESTIMATE REQUESTS
    if (isEstimateRequest) {
        let matchedSurface = null;
        let matchedRate = null;
        for (const [keyword, rate] of Object.entries(rates)) {
            if (lower.includes(keyword)) {
                matchedSurface = keyword;
                matchedRate = rate;
                break;
            }
        }
        if (matchedSurface === "shutter" || matchedSurface === "shutters") {
            const countMatch = lower.match(/(\d+)\s*shutter/);
            const count = countMatch ? parseInt(countMatch[1]) : null;
            if (count) {
                const low = (count * 26.25).toFixed(0);
                const high = (count * 32.79).toFixed(0);
                return `For ${count} shutters, the estimated range is **$${low} - $${high}** ($26.25-$32.79 per shutter).\n\nThis is a soft-clean service — no pressure washing, just a brush and mild cleaner.\n\nSubmit a service request and we'll confirm the exact price after seeing the job.`;
            }
            return `Shutter cleaning is priced at **$26.25 - $32.79 per shutter**.\n\nHow many shutters do you have? I can give you a total estimate.`;
        }
        if (matchedSurface === "gutter" || matchedSurface === "gutters") {
            const linearMatch = lower.match(/(\d+)\s*(linear|lin|lf|ft|feet)/);
            const linearFt = linearMatch ? parseInt(linearMatch[1]) : null;
            if (linearFt) {
                const low = (linearFt * 1.10).toFixed(0);
                const high = (linearFt * 1.35).toFixed(0);
                return `For ${linearFt} linear feet of gutters, the estimated range is **$${low} - $${high}** ($1.10-$1.35/linear ft).\n\nSubmit a service request and we'll confirm the price.`;
            }
            return `Gutter cleaning is priced at **$1.10 - $1.35 per linear foot**.\n\nHow many linear feet of gutters do you have? A typical home is 100-200 linear feet.`;
        }
        if (matchedRate && matchedRate.unit === "sqft") {
            const sqft = mentionedSqft || defaultSqft[matchedSurface] || 1500;
            const low = Math.round(sqft * matchedRate.low);
            const high = Math.round(sqft * matchedRate.high);
            const usedDefault = !mentionedSqft;
            let reply = `Here's an estimate for **${matchedSurface}** cleaning:\n\n`;
            reply += `- Area: ~${sqft.toLocaleString()} sqft${usedDefault ? " (estimated)" : ""}\n`;
            reply += `- Rate: $${matchedRate.low.toFixed(2)} - $${matchedRate.high.toFixed(2)}/sqft\n`;
            reply += `- **Estimate: $${low.toLocaleString()} - $${high.toLocaleString()}**\n\n`;
            if (usedDefault) {
                reply += `If you know your exact square footage, I can give a tighter range.\n\n`;
            }
            reply += `Submit a service request above and we'll send you a firm quote within 24 hours.`;
            return reply;
        }
        return `I can give you a price estimate! To calculate it I need:\n\n1. **Surface type** — house, driveway, roof, deck, fence, patio, concrete, etc.\n2. **Approximate size** — square footage if you know it (optional)\n\nWhat surface are you looking to have cleaned?`;
    }
    // RUST / ORANGE STAINS
    if (isRustQuestion) {
        return `Rust and orange staining from irrigation or fertilizer is a specialty service we treat with **F9 BARC** — the industry's top rust remover.\n\n**Pricing:**\n- Single spot treatment: $50 - $100\n- Walkway/entry area: $125 - $300\n- Heavy irrigation staining: $300 - $800+\n- Minimum charge: $125\n\nWe power wash the surface first, then apply F9 BARC which reverses 80-100% of orange staining.\n\nSubmit a service request with photos if you can — it helps us give you an accurate quote.`;
    }
    // CHEMICAL / SOFT WASH QUESTIONS
    if (isChemicalQuestion) {
        const dbResult = await pool.query(`SELECT category, title, content FROM guru_training
       WHERE category = 'chemical' AND (LOWER(title) ILIKE $1 OR LOWER(content) ILIKE $1)
       ORDER BY title LIMIT 3`, [`%${lower.split(" ").slice(0, 4).join("%")}%`]);
        if (dbResult.rows.length > 0) {
            return dbResult.rows.map(r => `**${r.title}**\n${r.content}`).join("\n\n");
        }
        return `We use professional-grade chemicals for all jobs:\n\n- **House/siding washing**: Sodium hypochlorite (SH) 1-2% + Elemonator surfactant at soft wash pressure (100-500 PSI)\n- **Roof cleaning**: SH 4-6% — soft wash only, never high pressure on shingles\n- **Rust removal**: F9 BARC (the industry standard)\n- **Wood restoration**: Sodium percarbonate cleaner + oxalic acid brightener\n- **Grease/oil**: Purple Power or Dragon Juice degreaser\n\nWhat surface or problem are you dealing with? I can give you the specific treatment.`;
    }
    // TREATMENT / HOW TO CLEAN QUESTIONS
    if (isTreatmentQuestion) {
        const dbResult = await pool.query(`SELECT category, title, content FROM guru_training
       WHERE category = 'decision_matrix' AND (LOWER(title) ILIKE $1 OR LOWER(content) ILIKE $1)
       ORDER BY title LIMIT 3`, [`%${lower.split(" ").slice(0, 4).join("%")}%`]);
        if (dbResult.rows.length > 0) {
            return dbResult.rows.map(r => `**${r.title.replace("DECISION | ", "")}**\n${r.content}`).join("\n\n");
        }
        return `For treatment guidance, describe the surface and problem (e.g. "algae on vinyl siding" or "mold on concrete driveway") and I'll tell you the right approach and what it costs.`;
    }
    // SAFETY QUESTIONS
    if (isSafetyQuestion) {
        return `**Safety requirements for our jobs:**\n\n- Gloves and eye protection on every job\n- Respirator when handling SH, acids, or sodium hydroxide\n- Long sleeves when working with bleach or acids\n- Never mix SH with acids (produces toxic chlorine gas)\n- Never spray electrical fixtures directly\n- Never walk unsafe roofs\n- Soft wash only on shingles, stucco, painted surfaces, and tile roofs\n\nAnything specific you're asking about?`;
    }
    // GREETING
    if (lower.length < 20 || lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
        return `Hi! I'm Guru, NMD's assistant. I can help you with:\n\n- **Price estimates** — just tell me what surface and size\n- **Treatment questions** — what method/chemical for your problem\n- **Service info** — what's included, how it works\n\nWhat can I help you with?`;
    }
    // FALLBACK: DB SEARCH
    const words = lower.split(/\s+/).filter(w => w.length > 3).slice(0, 4);
    if (words.length > 0) {
        const searchTerm = `%${words.join("%")}%`;
        const dbResult = await pool.query(`SELECT category, title, content FROM guru_training
       WHERE LOWER(title) ILIKE $1 OR LOWER(content) ILIKE $1
       ORDER BY category LIMIT 3`, [searchTerm]);
        if (dbResult.rows.length > 0) {
            return dbResult.rows.map(r => `**${r.title}**\n${r.content}`).join("\n\n");
        }
    }
    // FINAL FALLBACK
    return `I can help with price estimates, treatment questions, and service info. Try asking something like:\n\n- "How much to wash a 1-story house?"\n- "What's the cost to clean a 500 sqft driveway?"\n- "How do you treat rust stains?"\n- "What's soft washing?"`;
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
router.get("/messages", requireAuth, async (req, res) => {
    try {
        await ensureGuruTables();
        const user = getUser(req);
        const result = await pool.query(`
        SELECT *
        FROM guru_messages
        WHERE user_id = $1
        ORDER BY created_at ASC
        LIMIT 100;
      `, [user.id]);
        return res.json({
            messages: result.rows.map(mapMessage)
        });
    }
    catch (err) {
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Could not load Guru messages."
        });
    }
});
router.post("/messages", requireAuth, async (req, res) => {
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
        const reply = await buildGuruReply({
            role: userRole,
            body
        });
        const userMessage = await pool.query(`
        INSERT INTO guru_messages (user_id, role_context, sender, body)
        VALUES ($1, $2, 'user', $3)
        RETURNING *;
      `, [user.id, roleContext, body]);
        const guruMessage = await pool.query(`
        INSERT INTO guru_messages (user_id, role_context, sender, body)
        VALUES ($1, $2, 'guru', $3)
        RETURNING *;
      `, [user.id, roleContext, reply]);
        return res.status(201).json({
            userMessage: mapMessage(userMessage.rows[0]),
            guruMessage: mapMessage(guruMessage.rows[0])
        });
    }
    catch (err) {
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Could not save Guru message."
        });
    }
});
router.delete("/messages", requireAuth, async (req, res) => {
    try {
        await ensureGuruTables();
        const user = getUser(req);
        await pool.query(`
        DELETE FROM guru_messages
        WHERE user_id = $1;
      `, [user.id]);
        return res.json({
            message: "Guru chat history cleared."
        });
    }
    catch (err) {
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Could not clear Guru messages."
        });
    }
});
router.get("/treatment-search", requireAuth, async (req, res) => {
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
        const result = await pool.query(`
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
      `, [search, riskLevel, recordType, limit]);
        return res.json({
            results: result.rows.map(mapTreatmentSearchResult)
        });
    }
    catch (err) {
        console.error("Guru treatment search error:", err);
        return res.status(500).json({
            message: err instanceof Error
                ? err.message
                : "Failed to search Guru treatment database."
        });
    }
});
router.post("/estimate-intake", requireAuth, async (req, res) => {
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
        const conditionMultiplier = conditionLevel.includes("severe") || conditionLevel.includes("heavy")
            ? 1.5
            : conditionLevel.includes("moderate")
                ? 1.25
                : 1;
        const preliminaryLow = Math.max(125, baseLow * conditionMultiplier);
        const preliminaryHigh = Math.max(preliminaryLow + 75, baseHigh * conditionMultiplier);
        const result = await pool.query(`
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
      `, [
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
        ]);
        return res.status(201).json({
            estimate: mapEstimate(result.rows[0])
        });
    }
    catch (err) {
        console.error("Guru estimate intake error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Could not submit Guru estimate."
        });
    }
});
router.get("/estimates", requireAuth, async (req, res) => {
    try {
        await ensureGuruTables();
        const user = getUser(req);
        const userRole = normalizeRole(user.role);
        if (!isAdminRole(userRole)) {
            return res.status(403).json({
                message: "Only Admin or Super Admin can view all Guru estimates."
            });
        }
        const result = await pool.query(`
        SELECT *
        FROM guru_estimates
        ORDER BY created_at DESC;
      `);
        return res.json({
            estimates: result.rows.map(mapEstimate)
        });
    }
    catch (err) {
        console.error("Get Guru estimates error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Could not load Guru estimates."
        });
    }
});
router.get("/my-estimates", requireAuth, async (req, res) => {
    try {
        await ensureGuruTables();
        const user = getUser(req);
        const result = await pool.query(`
        SELECT *
        FROM guru_estimates
        WHERE client_user_id = $1
        ORDER BY created_at DESC;
      `, [user.id]);
        return res.json({
            estimates: result.rows.map(mapEstimate)
        });
    }
    catch (err) {
        console.error("Get my Guru estimates error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Could not load your Guru estimates."
        });
    }
});
export default router;
