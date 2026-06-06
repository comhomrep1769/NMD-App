import express from "express";
import { Pool } from "pg";
import { requireAdmin, requireAuth } from "../middleware/authGuard.js";
const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false
        }
        : undefined
});
const MAX_UPLOAD_ITEMS = 2000;
function textValue(value) {
    return String(value || "").trim();
}
function parseSurfaceTypes(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value || "")
        .split(/[;,|]/)
        .map((item) => item.trim())
        .filter(Boolean);
}
function normalizeRiskLevel(value) {
    const raw = textValue(value).toLowerCase();
    if (raw === "high review" || raw === "high")
        return "High Review";
    if (raw === "moderate" || raw === "medium")
        return "Moderate";
    return "Standard";
}
function mapTreatment(row) {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        surfaceTypes: row.surface_types || [],
        chemical: row.chemical,
        dilutionRatio: row.dilution_ratio,
        useCase: row.use_case,
        safetyNotes: row.safety_notes,
        instructions: row.instructions,
        purchaseLink: row.purchase_link,
        costReference: row.cost_reference,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
function mapTreatmentCase(row) {
    return {
        id: row.id,
        treatmentId: row.treatment_id,
        treatmentName: row.treatment_name || null,
        treatmentCategory: row.treatment_category || null,
        title: row.title,
        surfaceType: row.surface_type,
        conditionLevel: row.condition_level,
        problemType: row.problem_type,
        recommendedMix: row.recommended_mix,
        dwellTime: row.dwell_time,
        toolsNeeded: row.tools_needed,
        stepByStep: row.step_by_step,
        safetyChecklist: row.safety_checklist,
        pricingNote: row.pricing_note,
        customerExpectation: row.customer_expectation,
        riskLevel: row.risk_level,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
function mapTreatmentPlan(row) {
    return {
        id: row.id,
        jobName: row.job_name,
        clientName: row.client_name || "",
        serviceAddress: row.service_address || "",
        surfaceType: row.surface_type || "",
        conditionLevel: row.condition_level || "",
        selectedTreatmentIds: row.selected_treatment_ids || [],
        selectedCaseIds: row.selected_case_ids || [],
        notes: row.notes || "",
        planText: row.plan_text || "",
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
function normalizeUploadItem(item) {
    const name = textValue(item.name);
    const category = textValue(item.category) || "General";
    const surfaceTypes = parseSurfaceTypes(item.surfaceTypes || item.surface_types);
    return {
        name,
        category,
        surfaceTypes,
        chemical: textValue(item.chemical) || null,
        dilutionRatio: textValue(item.dilutionRatio || item.dilution_ratio) || null,
        useCase: textValue(item.useCase || item.use_case) || null,
        safetyNotes: textValue(item.safetyNotes || item.safety_notes) || null,
        instructions: textValue(item.instructions) || null,
        purchaseLink: textValue(item.purchaseLink || item.purchase_link) || null,
        costReference: textValue(item.costReference || item.cost_reference) || null
    };
}
function normalizeCaseUploadItem(item) {
    return {
        treatmentId: textValue(item.treatmentId || item.treatment_id) || null,
        treatmentName: textValue(item.treatmentName || item.treatment_name) || null,
        title: textValue(item.title),
        surfaceType: textValue(item.surfaceType || item.surface_type) || null,
        conditionLevel: textValue(item.conditionLevel || item.condition_level) || null,
        problemType: textValue(item.problemType || item.problem_type) || null,
        recommendedMix: textValue(item.recommendedMix || item.recommended_mix) || null,
        dwellTime: textValue(item.dwellTime || item.dwell_time) || null,
        toolsNeeded: textValue(item.toolsNeeded || item.tools_needed) || null,
        stepByStep: textValue(item.stepByStep || item.step_by_step) || null,
        safetyChecklist: textValue(item.safetyChecklist || item.safety_checklist) || null,
        pricingNote: textValue(item.pricingNote || item.pricing_note) || null,
        customerExpectation: textValue(item.customerExpectation || item.customer_expectation) || null,
        riskLevel: normalizeRiskLevel(item.riskLevel || item.risk_level)
    };
}
async function ensureTreatmentsTable() {
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
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS name TEXT;
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS surface_types TEXT[] NOT NULL DEFAULT '{}';
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS chemical TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS dilution_ratio TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS use_case TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS safety_notes TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS instructions TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS purchase_link TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS cost_reference TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
    await pool.query(`
    ALTER TABLE treatments
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
    await pool.query(`
    UPDATE treatments
    SET category = 'General'
    WHERE category IS NULL OR TRIM(category) = '';
  `);
    await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS treatments_name_category_unique_idx
    ON treatments ((LOWER(name)), (LOWER(category)));
  `);
    await pool.query(`
    CREATE INDEX IF NOT EXISTS treatments_category_idx
    ON treatments (LOWER(category));
  `);
    await pool.query(`
    CREATE INDEX IF NOT EXISTS treatments_name_idx
    ON treatments (LOWER(name));
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
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS treatment_id UUID NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS title TEXT;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Treatment';
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS stain_type TEXT DEFAULT 'General';
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'General';
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS surface_type TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS condition_level TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS problem_type TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS recommended_mix TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS dwell_time TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS tools_needed TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS step_by_step TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS safety_checklist TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS pricing_note TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS customer_expectation TEXT NULL;
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'Standard';
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
    await pool.query(`
    ALTER TABLE treatment_cases
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
    await pool.query(`
    UPDATE treatment_cases
    SET category = 'Treatment'
    WHERE category IS NULL OR TRIM(category) = '';
  `);
    await pool.query(`
    UPDATE treatment_cases
    SET stain_type = 'General'
    WHERE stain_type IS NULL OR TRIM(stain_type) = '';
  `);
    await pool.query(`
    UPDATE treatment_cases
    SET severity = 'General'
    WHERE severity IS NULL OR TRIM(severity) = '';
  `);
    await pool.query(`
    UPDATE treatment_cases
    SET risk_level = 'Standard'
    WHERE risk_level IS NULL OR TRIM(risk_level) = '';
  `);
    await pool.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'treatment_cases'
          AND table_schema = 'public'
          AND is_nullable = 'NO'
          AND column_name NOT IN ('id', 'title')
      LOOP
        EXECUTE format(
          'ALTER TABLE treatment_cases ALTER COLUMN %I DROP NOT NULL',
          r.column_name
        );
      END LOOP;
    END $$;
  `);
    await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'treatment_cases_treatment_id_fkey'
          AND table_name = 'treatment_cases'
      ) THEN
        ALTER TABLE treatment_cases
        ADD CONSTRAINT treatment_cases_treatment_id_fkey
        FOREIGN KEY (treatment_id)
        REFERENCES treatments(id)
        ON DELETE SET NULL;
      END IF;
    END $$;
  `);
    await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS treatment_cases_title_unique_idx
    ON treatment_cases ((LOWER(title)));
  `);
    await pool.query(`
    CREATE INDEX IF NOT EXISTS treatment_cases_treatment_id_idx
    ON treatment_cases (treatment_id);
  `);
    await pool.query(`
    CREATE INDEX IF NOT EXISTS treatment_cases_risk_level_idx
    ON treatment_cases (LOWER(risk_level));
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
    await pool.query(`
    CREATE INDEX IF NOT EXISTS treatment_plans_job_name_idx
    ON treatment_plans (LOWER(job_name));
  `);
    await pool.query(`
    CREATE INDEX IF NOT EXISTS treatment_plans_created_at_idx
    ON treatment_plans (created_at DESC);
  `);
}
async function getTreatmentIdByName(name) {
    if (!name)
        return null;
    const result = await pool.query(`
      SELECT id
      FROM treatments
      WHERE LOWER(name) = LOWER($1)
      ORDER BY created_at ASC
      LIMIT 1;
    `, [name]);
    return result.rows[0]?.id || null;
}
async function getJoinedCaseById(id) {
    const result = await pool.query(`
      SELECT
        tc.*,
        t.name AS treatment_name,
        t.category AS treatment_category
      FROM treatment_cases tc
      LEFT JOIN treatments t ON t.id = tc.treatment_id
      WHERE tc.id = $1
      LIMIT 1;
    `, [id]);
    return result.rows[0] || null;
}
async function upsertTreatment(item) {
    const existing = await pool.query(`
      SELECT *
      FROM treatments
      WHERE LOWER(name) = LOWER($1)
        AND LOWER(category) = LOWER($2)
      LIMIT 1;
    `, [item.name, item.category]);
    if (existing.rows[0]) {
        const result = await pool.query(`
        UPDATE treatments
        SET
          name = $2,
          category = $3,
          surface_types = $4,
          chemical = $5,
          dilution_ratio = $6,
          use_case = $7,
          safety_notes = $8,
          instructions = $9,
          purchase_link = $10,
          cost_reference = $11,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `, [
            existing.rows[0].id,
            item.name,
            item.category,
            item.surfaceTypes,
            item.chemical,
            item.dilutionRatio,
            item.useCase,
            item.safetyNotes,
            item.instructions,
            item.purchaseLink,
            item.costReference
        ]);
        return result.rows[0];
    }
    const result = await pool.query(`
      INSERT INTO treatments (
        name,
        category,
        surface_types,
        chemical,
        dilution_ratio,
        use_case,
        safety_notes,
        instructions,
        purchase_link,
        cost_reference,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      RETURNING *;
    `, [
        item.name,
        item.category,
        item.surfaceTypes,
        item.chemical,
        item.dilutionRatio,
        item.useCase,
        item.safetyNotes,
        item.instructions,
        item.purchaseLink,
        item.costReference
    ]);
    return result.rows[0];
}
async function upsertTreatmentCase(item) {
    const treatmentId = item.treatmentId || (await getTreatmentIdByName(item.treatmentName || ""));
    const existing = await pool.query(`
      SELECT *
      FROM treatment_cases
      WHERE LOWER(title) = LOWER($1)
      LIMIT 1;
    `, [item.title]);
    if (existing.rows[0]) {
        const result = await pool.query(`
        UPDATE treatment_cases
        SET
          treatment_id = $2,
          title = $3,
          surface_type = $4,
          condition_level = $5,
          problem_type = $6,
          recommended_mix = $7,
          dwell_time = $8,
          tools_needed = $9,
          step_by_step = $10,
          safety_checklist = $11,
          pricing_note = $12,
          customer_expectation = $13,
          risk_level = $14,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `, [
            existing.rows[0].id,
            treatmentId,
            item.title,
            item.surfaceType,
            item.conditionLevel,
            item.problemType,
            item.recommendedMix,
            item.dwellTime,
            item.toolsNeeded,
            item.stepByStep,
            item.safetyChecklist,
            item.pricingNote,
            item.customerExpectation,
            item.riskLevel
        ]);
        return result.rows[0];
    }
    const result = await pool.query(`
      INSERT INTO treatment_cases (
        treatment_id,
        title,
        surface_type,
        condition_level,
        problem_type,
        recommended_mix,
        dwell_time,
        tools_needed,
        step_by_step,
        safety_checklist,
        pricing_note,
        customer_expectation,
        risk_level,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
      RETURNING *;
    `, [
        treatmentId,
        item.title,
        item.surfaceType,
        item.conditionLevel,
        item.problemType,
        item.recommendedMix,
        item.dwellTime,
        item.toolsNeeded,
        item.stepByStep,
        item.safetyChecklist,
        item.pricingNote,
        item.customerExpectation,
        item.riskLevel
    ]);
    return result.rows[0];
}
async function seedDefaultTreatments() {
    await ensureTreatmentsTable();
    const defaultTreatments = [
        {
            name: "Standard House Wash",
            category: "Soft Washing",
            surfaceTypes: ["Vinyl siding", "Painted siding", "Exterior walls"],
            chemical: "SH mix with surfactant",
            dilutionRatio: "Typically 0.5%–1.5% on surface depending on organic growth",
            useCase: "General exterior house washing for algae, mildew, light organic growth, and routine maintenance.",
            safetyNotes: "Pre-wet plants, protect outlets, avoid forcing water behind siding, rinse plants/windows thoroughly, and watch for oxidation.",
            instructions: "Apply low-pressure soft wash mix in controlled sections, allow dwell time without drying, rinse thoroughly, and inspect oxidation-sensitive areas.",
            purchaseLink: "",
            costReference: "Use NMD Job Pricing for house washing minimums, square footage, condition, height, access, and add-ons."
        },
        {
            name: "Roof Cleaning Soft Wash",
            category: "Roof Cleaning",
            surfaceTypes: ["Asphalt shingles", "Tile roof", "Metal roof"],
            chemical: "SH roof mix",
            dilutionRatio: "Often 3%–6% on surface depending on staining and roof material",
            useCase: "Organic roof stains, algae, black streaks, moss, and roof discoloration where pressure should not be used.",
            safetyNotes: "Use fall protection, protect plants, control runoff, avoid high pressure, watch overspray, and verify roof access/pitch.",
            instructions: "Apply roof-safe soft wash mix, let dwell, reapply where needed, rinse only when appropriate for the roof/job scope, and protect landscaping before/during/after.",
            purchaseLink: "",
            costReference: "Price separately from house wash. Account for roof pitch, size, access, moss load, plant protection, and chemical cost."
        },
        {
            name: "Concrete Surface Cleaning",
            category: "Flatwork",
            surfaceTypes: ["Concrete", "Driveways", "Sidewalks", "Patios"],
            chemical: "SH post-treatment or degreaser where needed",
            dilutionRatio: "Post-treat commonly 1%–3% depending on organic staining",
            useCase: "Driveway, sidewalk, patio, and flatwork cleaning for organic growth and general dirt.",
            safetyNotes: "Avoid damaging new concrete, verify surface cleaner pace, prevent stripes, watch drainage/runoff, and test questionable surfaces.",
            instructions: "Pre-treat if needed, surface clean at proper pace, rinse thoroughly, post-treat organic staining, and avoid excessive pressure on weak/new concrete.",
            purchaseLink: "",
            costReference: "Price by square foot with minimum service charge. Increase for heavy staining, poor drainage, oil, rust, or restoration work."
        },
        {
            name: "Rust Stain Removal",
            category: "Specialty Restoration",
            surfaceTypes: ["Concrete", "Pavers", "Stucco", "Stone", "Exterior walls"],
            chemical: "F9 BARC, oxalic acid, or compatible rust remover",
            dilutionRatio: "Oxalic often 6–8 oz per gallon depending on use case; follow product label",
            useCase: "Rust stains from irrigation, metal furniture, battery stains, fertilizer stains, or orange staining.",
            safetyNotes: "Test spot first, protect surrounding surfaces, wear PPE, avoid glass/metal damage, and do not promise full removal without testing.",
            instructions: "Identify stain source, test small area, apply rust remover carefully, dwell as directed, agitate if safe, rinse thoroughly, and repeat if needed.",
            purchaseLink: "",
            costReference: "Price as specialty restoration. Small spots $50–$100, entry pads $125–$300, heavy irrigation stains $300–$800+."
        },
        {
            name: "Oxidation-Sensitive Siding Wash",
            category: "Risk / Liability",
            surfaceTypes: ["Oxidized siding", "Painted siding", "Aluminum siding", "Older vinyl"],
            chemical: "Mild soft wash mix or non-SH alternative when required",
            dilutionRatio: "Test spot required. Keep mix mild and avoid aggressive brushing.",
            useCase: "Exterior cleaning where chalking, fading, oxidation, or weak paint may be present.",
            safetyNotes: "Document pre-existing oxidation, perform test spot, explain that washing may reveal uneven oxidation, and avoid aggressive pressure.",
            instructions: "Inspect surface, document chalking, test hidden area, use low pressure, avoid scrubbing oxidized panels unless approved, rinse carefully.",
            purchaseLink: "",
            costReference: "May require waiver or specialty oxidation restoration pricing if customer expects correction beyond cleaning."
        },
        {
            name: "Wood Fence Cleaning",
            category: "Wood Restoration",
            surfaceTypes: ["Wood fences", "Decks", "Wood siding"],
            chemical: "Sodium percarbonate, sodium hydroxide where appropriate, oxalic acid brightener",
            dilutionRatio: "Depends on wood condition and product label. Brightener often follows alkaline cleaning.",
            useCase: "Cleaning organic growth, gray wood, tannin stains, and preparing wood for sealing or staining.",
            safetyNotes: "Avoid high pressure, test first, protect plants, explain fuzzing/color variation, and use brightener only when appropriate.",
            instructions: "Pre-wet, apply wood-safe cleaner, dwell, gently rinse with low pressure, brighten if needed, and allow proper dry time before sealing.",
            purchaseLink: "",
            costReference: "Price higher than basic washing. Account for prep, chemical cost, dwell time, brightening, and restoration risk."
        }
    ];
    for (const item of defaultTreatments) {
        await upsertTreatment(item);
    }
    const defaultCases = [
        {
            treatmentName: "Rust Stain Removal",
            treatmentId: null,
            title: "Heavy Irrigation Rust On Concrete",
            surfaceType: "Concrete / driveway / sidewalk",
            conditionLevel: "Heavy",
            problemType: "Orange irrigation rust staining",
            recommendedMix: "F9 BARC or compatible rust remover per label. Oxalic acid may be used only where appropriate.",
            dwellTime: "Follow product label; do not allow product to dry.",
            toolsNeeded: "Pump sprayer, PPE, water source, brush for agitation if safe, test area supplies.",
            stepByStep: "1. Inspect stain source. 2. Test a small area. 3. Protect adjacent surfaces/plants. 4. Apply rust remover evenly. 5. Allow controlled dwell. 6. Agitate only if safe. 7. Rinse thoroughly. 8. Repeat only if surface tolerates it.",
            safetyChecklist: "Wear PPE, avoid glass/metal overspray, control runoff, protect plants, document pre-existing surface damage, and do not guarantee 100% removal before testing.",
            pricingNote: "Treat as specialty restoration. Heavy irrigation rust can be $300–$800+ depending on size, severity, chemical use, and repeat applications.",
            customerExpectation: "Explain that rust may need multiple applications and final results depend on stain depth, surface age, and previous chemical exposure.",
            riskLevel: "High Review"
        },
        {
            treatmentName: "Roof Cleaning Soft Wash",
            treatmentId: null,
            title: "Black Streaks On Asphalt Shingle Roof",
            surfaceType: "Asphalt shingles",
            conditionLevel: "Moderate to heavy organic staining",
            problemType: "Black roof streaks, algae, organic roof discoloration",
            recommendedMix: "Roof-safe SH mix based on severity. Avoid pressure washing shingles.",
            dwellTime: "Controlled dwell without allowing mix to dry. Reapply as needed.",
            toolsNeeded: "Soft wash system, PPE, plant protection, water source, ladder/fall safety equipment.",
            stepByStep: "1. Inspect roof pitch/access. 2. Protect plants and runoff areas. 3. Apply roof mix evenly. 4. Let dwell. 5. Reapply stubborn areas. 6. Rinse only if appropriate for scope/material. 7. Final plant rinse.",
            safetyChecklist: "Fall protection, ladder safety, runoff control, overspray control, plant protection, and no high pressure.",
            pricingNote: "Price by roof size, pitch, access, moss load, chemical cost, and plant protection requirements.",
            customerExpectation: "Some stains may lighten after treatment and continue improving after rain/weathering.",
            riskLevel: "High Review"
        }
    ];
    for (const item of defaultCases) {
        await upsertTreatmentCase(item);
    }
}
router.get("/", requireAuth, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const search = String(req.query.search || "").trim();
        const category = String(req.query.category || "").trim();
        const params = [];
        const where = [];
        if (search) {
            params.push(`%${search.toLowerCase()}%`);
            where.push(`
        (
          LOWER(name) LIKE $${params.length}
          OR LOWER(category) LIKE $${params.length}
          OR LOWER(COALESCE(chemical, '')) LIKE $${params.length}
          OR LOWER(COALESCE(dilution_ratio, '')) LIKE $${params.length}
          OR LOWER(COALESCE(use_case, '')) LIKE $${params.length}
          OR LOWER(COALESCE(safety_notes, '')) LIKE $${params.length}
          OR LOWER(COALESCE(instructions, '')) LIKE $${params.length}
          OR LOWER(COALESCE(cost_reference, '')) LIKE $${params.length}
        )
      `);
        }
        if (category && category !== "all") {
            params.push(category.toLowerCase());
            where.push(`LOWER(category) = $${params.length}`);
        }
        const result = await pool.query(`
        SELECT *
        FROM treatments
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY category ASC, name ASC;
      `, params);
        return res.json({
            treatments: result.rows.map(mapTreatment)
        });
    }
    catch (err) {
        console.error("Get treatments error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to load treatments."
        });
    }
});
router.get("/cases", requireAuth, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const search = String(req.query.search || "").trim();
        const treatmentId = String(req.query.treatmentId || "").trim();
        const riskLevel = String(req.query.riskLevel || "").trim();
        const params = [];
        const where = [];
        if (search) {
            params.push(`%${search.toLowerCase()}%`);
            where.push(`
        (
          LOWER(tc.title) LIKE $${params.length}
          OR LOWER(COALESCE(tc.surface_type, '')) LIKE $${params.length}
          OR LOWER(COALESCE(tc.condition_level, '')) LIKE $${params.length}
          OR LOWER(COALESCE(tc.problem_type, '')) LIKE $${params.length}
          OR LOWER(COALESCE(tc.recommended_mix, '')) LIKE $${params.length}
          OR LOWER(COALESCE(tc.step_by_step, '')) LIKE $${params.length}
          OR LOWER(COALESCE(tc.safety_checklist, '')) LIKE $${params.length}
          OR LOWER(COALESCE(tc.pricing_note, '')) LIKE $${params.length}
          OR LOWER(COALESCE(tc.customer_expectation, '')) LIKE $${params.length}
          OR LOWER(COALESCE(t.name, '')) LIKE $${params.length}
        )
      `);
        }
        if (treatmentId && treatmentId !== "all") {
            params.push(treatmentId);
            where.push(`tc.treatment_id = $${params.length}`);
        }
        if (riskLevel && riskLevel !== "all") {
            params.push(riskLevel.toLowerCase());
            where.push(`LOWER(tc.risk_level) = $${params.length}`);
        }
        const result = await pool.query(`
        SELECT
          tc.*,
          t.name AS treatment_name,
          t.category AS treatment_category
        FROM treatment_cases tc
        LEFT JOIN treatments t ON t.id = tc.treatment_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY
          CASE
            WHEN LOWER(tc.risk_level) = 'high review' THEN 1
            WHEN LOWER(tc.risk_level) = 'moderate' THEN 2
            ELSE 3
          END,
          tc.title ASC;
      `, params);
        return res.json({
            cases: result.rows.map(mapTreatmentCase)
        });
    }
    catch (err) {
        console.error("Get treatment workflows error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to load treatments."
        });
    }
});
router.get("/plans", requireAuth, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const search = String(req.query.search || "").trim();
        const params = [];
        const where = [];
        if (search) {
            params.push(`%${search.toLowerCase()}%`);
            where.push(`
        (
          LOWER(job_name) LIKE $${params.length}
          OR LOWER(COALESCE(client_name, '')) LIKE $${params.length}
          OR LOWER(COALESCE(service_address, '')) LIKE $${params.length}
          OR LOWER(COALESCE(surface_type, '')) LIKE $${params.length}
          OR LOWER(COALESCE(condition_level, '')) LIKE $${params.length}
          OR LOWER(COALESCE(notes, '')) LIKE $${params.length}
          OR LOWER(COALESCE(plan_text, '')) LIKE $${params.length}
        )
      `);
        }
        const result = await pool.query(`
        SELECT *
        FROM treatment_plans
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY created_at DESC;
      `, params);
        return res.json({
            plans: result.rows.map(mapTreatmentPlan)
        });
    }
    catch (err) {
        console.error("Get treatment plans error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to load treatment plans."
        });
    }
});
router.post("/seed", requireAdmin, async (_req, res) => {
    try {
        await seedDefaultTreatments();
        const treatmentsResult = await pool.query(`
        SELECT *
        FROM treatments
        ORDER BY category ASC, name ASC;
      `);
        const casesResult = await pool.query(`
        SELECT
          tc.*,
          t.name AS treatment_name,
          t.category AS treatment_category
        FROM treatment_cases tc
        LEFT JOIN treatments t ON t.id = tc.treatment_id
        ORDER BY
          CASE
            WHEN LOWER(tc.risk_level) = 'high review' THEN 1
            WHEN LOWER(tc.risk_level) = 'moderate' THEN 2
            ELSE 3
          END,
          tc.title ASC;
      `);
        return res.json({
            message: "Treatment database seeded successfully.",
            treatments: treatmentsResult.rows.map(mapTreatment),
            cases: casesResult.rows.map(mapTreatmentCase)
        });
    }
    catch (err) {
        console.error("Seed treatments error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to seed treatments."
        });
    }
});
router.post("/upload", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const mode = String(req.body?.mode || "upsert").trim();
        const items = Array.isArray(req.body?.treatments) ? req.body.treatments : [];
        if (items.length === 0) {
            return res.status(400).json({
                message: "No treatments were provided for upload."
            });
        }
        if (items.length > MAX_UPLOAD_ITEMS) {
            return res.status(400).json({
                message: `Upload limit is ${MAX_UPLOAD_ITEMS.toLocaleString()} treatments at a time.`
            });
        }
        const imported = [];
        const skipped = [];
        for (let index = 0; index < items.length; index += 1) {
            const normalized = normalizeUploadItem(items[index]);
            if (!normalized.name) {
                skipped.push({ index, reason: "Missing treatment name." });
                continue;
            }
            if (mode === "create-only") {
                const exists = await pool.query(`
            SELECT id
            FROM treatments
            WHERE LOWER(name) = LOWER($1)
              AND LOWER(category) = LOWER($2)
            LIMIT 1;
          `, [normalized.name, normalized.category]);
                if (exists.rows.length > 0) {
                    skipped.push({ index, reason: `Duplicate skipped: ${normalized.name}` });
                    continue;
                }
            }
            const saved = await upsertTreatment(normalized);
            imported.push(saved);
        }
        const result = await pool.query(`
        SELECT *
        FROM treatments
        ORDER BY category ASC, name ASC;
      `);
        return res.json({
            message: `Treatment upload complete. Imported ${imported.length}. Skipped ${skipped.length}.`,
            importedCount: imported.length,
            skippedCount: skipped.length,
            skipped,
            treatments: result.rows.map(mapTreatment)
        });
    }
    catch (err) {
        console.error("Upload treatments error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to upload treatments."
        });
    }
});
router.post("/cases/upload", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const mode = String(req.body?.mode || "upsert").trim();
        const items = Array.isArray(req.body?.cases) ? req.body.cases : [];
        if (items.length === 0) {
            return res.status(400).json({
                message: "No detailed treatments were provided for upload."
            });
        }
        if (items.length > MAX_UPLOAD_ITEMS) {
            return res.status(400).json({
                message: `Upload limit is ${MAX_UPLOAD_ITEMS.toLocaleString()} treatments at a time.`
            });
        }
        const imported = [];
        const skipped = [];
        for (let index = 0; index < items.length; index += 1) {
            const normalized = normalizeCaseUploadItem(items[index]);
            if (!normalized.title) {
                skipped.push({ index, reason: "Missing treatment title." });
                continue;
            }
            if (mode === "create-only") {
                const exists = await pool.query(`
            SELECT id
            FROM treatment_cases
            WHERE LOWER(title) = LOWER($1)
            LIMIT 1;
          `, [normalized.title]);
                if (exists.rows.length > 0) {
                    skipped.push({ index, reason: `Duplicate skipped: ${normalized.title}` });
                    continue;
                }
            }
            const saved = await upsertTreatmentCase(normalized);
            imported.push(saved);
        }
        const result = await pool.query(`
        SELECT
          tc.*,
          t.name AS treatment_name,
          t.category AS treatment_category
        FROM treatment_cases tc
        LEFT JOIN treatments t ON t.id = tc.treatment_id
        ORDER BY
          CASE
            WHEN LOWER(tc.risk_level) = 'high review' THEN 1
            WHEN LOWER(tc.risk_level) = 'moderate' THEN 2
            ELSE 3
          END,
          tc.title ASC;
      `);
        return res.json({
            message: `Treatment upload complete. Imported ${imported.length}. Skipped ${skipped.length}.`,
            importedCount: imported.length,
            skippedCount: skipped.length,
            skipped,
            cases: result.rows.map(mapTreatmentCase)
        });
    }
    catch (err) {
        console.error("Upload detailed treatments error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to upload treatments."
        });
    }
});
router.post("/cases", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const normalized = normalizeCaseUploadItem(req.body || {});
        if (!normalized.title) {
            return res.status(400).json({
                message: "Treatment title is required."
            });
        }
        const saved = await upsertTreatmentCase(normalized);
        const joined = await getJoinedCaseById(saved.id);
        return res.status(201).json({
            case: joined ? mapTreatmentCase(joined) : mapTreatmentCase(saved)
        });
    }
    catch (err) {
        console.error("Create treatment workflow error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to create treatment."
        });
    }
});
router.patch("/cases/:id", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const id = String(req.params.id || "").trim();
        const normalized = normalizeCaseUploadItem(req.body || {});
        if (!id) {
            return res.status(400).json({
                message: "Treatment ID is required."
            });
        }
        if (!normalized.title) {
            return res.status(400).json({
                message: "Treatment title is required."
            });
        }
        const treatmentId = normalized.treatmentId || (await getTreatmentIdByName(normalized.treatmentName || ""));
        const result = await pool.query(`
        UPDATE treatment_cases
        SET
          treatment_id = $2,
          title = $3,
          surface_type = $4,
          condition_level = $5,
          problem_type = $6,
          recommended_mix = $7,
          dwell_time = $8,
          tools_needed = $9,
          step_by_step = $10,
          safety_checklist = $11,
          pricing_note = $12,
          customer_expectation = $13,
          risk_level = $14,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `, [
            id,
            treatmentId,
            normalized.title,
            normalized.surfaceType,
            normalized.conditionLevel,
            normalized.problemType,
            normalized.recommendedMix,
            normalized.dwellTime,
            normalized.toolsNeeded,
            normalized.stepByStep,
            normalized.safetyChecklist,
            normalized.pricingNote,
            normalized.customerExpectation,
            normalized.riskLevel
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Treatment not found."
            });
        }
        const joined = await getJoinedCaseById(id);
        return res.json({
            case: joined ? mapTreatmentCase(joined) : mapTreatmentCase(result.rows[0])
        });
    }
    catch (err) {
        console.error("Update treatment workflow error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to update treatment."
        });
    }
});
router.delete("/cases/:id", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const id = String(req.params.id || "").trim();
        if (!id) {
            return res.status(400).json({
                message: "Treatment ID is required."
            });
        }
        const result = await pool.query(`
        DELETE FROM treatment_cases
        WHERE id = $1
        RETURNING id;
      `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Treatment not found."
            });
        }
        return res.json({
            message: "Treatment deleted."
        });
    }
    catch (err) {
        console.error("Delete treatment workflow error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to delete treatment."
        });
    }
});
router.post("/plans", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const jobName = String(req.body?.jobName || "").trim();
        if (!jobName) {
            return res.status(400).json({
                message: "Job name is required."
            });
        }
        const selectedTreatmentIds = Array.isArray(req.body?.selectedTreatmentIds)
            ? req.body.selectedTreatmentIds.map((id) => String(id)).filter(Boolean)
            : [];
        const selectedCaseIds = Array.isArray(req.body?.selectedCaseIds)
            ? req.body.selectedCaseIds.map((id) => String(id)).filter(Boolean)
            : [];
        const result = await pool.query(`
        INSERT INTO treatment_plans (
          job_name,
          client_name,
          service_address,
          surface_type,
          condition_level,
          selected_treatment_ids,
          selected_case_ids,
          notes,
          plan_text,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6::uuid[],$7::uuid[],$8,$9,NOW())
        RETURNING *;
      `, [
            jobName,
            String(req.body?.clientName || "").trim() || null,
            String(req.body?.serviceAddress || "").trim() || null,
            String(req.body?.surfaceType || "").trim() || null,
            String(req.body?.conditionLevel || "").trim() || null,
            selectedTreatmentIds,
            selectedCaseIds,
            String(req.body?.notes || "").trim() || null,
            String(req.body?.planText || "").trim() || null
        ]);
        return res.status(201).json({
            plan: mapTreatmentPlan(result.rows[0])
        });
    }
    catch (err) {
        console.error("Create treatment plan error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to create treatment plan."
        });
    }
});
router.delete("/plans/:id", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const id = String(req.params.id || "").trim();
        const result = await pool.query(`
        DELETE FROM treatment_plans
        WHERE id = $1
        RETURNING id;
      `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Treatment plan not found."
            });
        }
        return res.json({
            message: "Treatment plan deleted."
        });
    }
    catch (err) {
        console.error("Delete treatment plan error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to delete treatment plan."
        });
    }
});
router.post("/", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const normalized = normalizeUploadItem(req.body || {});
        if (!normalized.name) {
            return res.status(400).json({
                message: "Treatment name is required."
            });
        }
        const saved = await upsertTreatment(normalized);
        return res.status(201).json({
            treatment: mapTreatment(saved)
        });
    }
    catch (err) {
        console.error("Create treatment error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to create treatment."
        });
    }
});
router.patch("/:id", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const id = String(req.params.id || "").trim();
        const normalized = normalizeUploadItem(req.body || {});
        if (!id) {
            return res.status(400).json({
                message: "Treatment ID is required."
            });
        }
        if (!normalized.name) {
            return res.status(400).json({
                message: "Treatment name is required."
            });
        }
        const result = await pool.query(`
        UPDATE treatments
        SET
          name = $2,
          category = $3,
          surface_types = $4,
          chemical = $5,
          dilution_ratio = $6,
          use_case = $7,
          safety_notes = $8,
          instructions = $9,
          purchase_link = $10,
          cost_reference = $11,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `, [
            id,
            normalized.name,
            normalized.category,
            normalized.surfaceTypes,
            normalized.chemical,
            normalized.dilutionRatio,
            normalized.useCase,
            normalized.safetyNotes,
            normalized.instructions,
            normalized.purchaseLink,
            normalized.costReference
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Treatment not found."
            });
        }
        return res.json({
            treatment: mapTreatment(result.rows[0])
        });
    }
    catch (err) {
        console.error("Update treatment error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to update treatment."
        });
    }
});
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        await ensureTreatmentsTable();
        const id = String(req.params.id || "").trim();
        const result = await pool.query(`
        DELETE FROM treatments
        WHERE id = $1
        RETURNING id;
      `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Treatment not found."
            });
        }
        return res.json({
            message: "Treatment deleted."
        });
    }
    catch (err) {
        console.error("Delete treatment error:", err);
        return res.status(500).json({
            message: err instanceof Error ? err.message : "Failed to delete treatment."
        });
    }
});
export default router;
