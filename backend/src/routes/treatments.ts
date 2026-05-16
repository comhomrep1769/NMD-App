import express from "express";
import { Pool } from "pg";

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

type TreatmentRow = {
  id: string;
  name: string;
  category: string;
  surface_types: string[];
  chemical: string | null;
  dilution_ratio: string | null;
  use_case: string | null;
  safety_notes: string | null;
  instructions: string | null;
  purchase_link: string | null;
  cost_reference: string | null;
  created_at: string;
  updated_at: string;
};

type TreatmentCaseRow = {
  id: string;
  treatment_id: string | null;
  title: string;
  surface_type: string | null;
  condition_level: string | null;
  problem_type: string | null;
  recommended_mix: string | null;
  dwell_time: string | null;
  tools_needed: string | null;
  step_by_step: string | null;
  safety_checklist: string | null;
  pricing_note: string | null;
  customer_expectation: string | null;
  risk_level: string;
  created_at: string;
  updated_at: string;
  treatment_name?: string | null;
  treatment_category?: string | null;
};

type TreatmentPlanRow = {
  id: string;
  job_name: string;
  client_name: string | null;
  service_address: string | null;
  surface_type: string | null;
  condition_level: string | null;
  selected_treatment_ids: string[];
  selected_case_ids: string[];
  notes: string | null;
  plan_text: string | null;
  created_at: string;
  updated_at: string;
};

type TreatmentUploadItem = {
  name?: string;
  category?: string;
  surfaceTypes?: string[] | string;
  surface_types?: string[] | string;
  chemical?: string;
  dilutionRatio?: string;
  dilution_ratio?: string;
  useCase?: string;
  use_case?: string;
  safetyNotes?: string;
  safety_notes?: string;
  instructions?: string;
  purchaseLink?: string;
  purchase_link?: string;
  costReference?: string;
  cost_reference?: string;
};

function mapTreatment(row: TreatmentRow) {
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

function mapTreatmentCase(row: TreatmentCaseRow) {
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

function mapTreatmentPlan(row: TreatmentPlanRow) {
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

function textValue(value: unknown) {
  return String(value || "").trim();
}

function parseSurfaceTypes(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeUploadItem(item: TreatmentUploadItem) {
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
    CREATE UNIQUE INDEX IF NOT EXISTS treatments_name_category_unique_idx
    ON treatments (LOWER(name), LOWER(category));
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

async function upsertTreatment(item: ReturnType<typeof normalizeUploadItem>) {
  const result = await pool.query<TreatmentRow>(
    `
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
      ON CONFLICT (LOWER(name), LOWER(category))
      DO UPDATE SET
        surface_types = EXCLUDED.surface_types,
        chemical = EXCLUDED.chemical,
        dilution_ratio = EXCLUDED.dilution_ratio,
        use_case = EXCLUDED.use_case,
        safety_notes = EXCLUDED.safety_notes,
        instructions = EXCLUDED.instructions,
        purchase_link = EXCLUDED.purchase_link,
        cost_reference = EXCLUDED.cost_reference,
        updated_at = NOW()
      RETURNING *;
    `,
    [
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
    ]
  );

  return result.rows[0];
}

async function upsertDefaultTreatment(item: {
  name: string;
  category: string;
  surfaceTypes: string[];
  chemical: string;
  dilutionRatio: string;
  useCase: string;
  safetyNotes: string;
  instructions: string;
  purchaseLink: string;
  costReference: string;
}) {
  await upsertTreatment({
    name: item.name,
    category: item.category,
    surfaceTypes: item.surfaceTypes,
    chemical: item.chemical,
    dilutionRatio: item.dilutionRatio,
    useCase: item.useCase,
    safetyNotes: item.safetyNotes,
    instructions: item.instructions,
    purchaseLink: item.purchaseLink,
    costReference: item.costReference
  });
}

async function getTreatmentIdByName(name: string) {
  const result = await pool.query<{ id: string }>(
    `
      SELECT id
      FROM treatments
      WHERE LOWER(name) = LOWER($1)
      ORDER BY created_at ASC
      LIMIT 1;
    `,
    [name]
  );

  return result.rows[0]?.id || null;
}

async function upsertDefaultTreatmentCase(item: {
  treatmentName?: string;
  title: string;
  surfaceType: string;
  conditionLevel: string;
  problemType: string;
  recommendedMix: string;
  dwellTime: string;
  toolsNeeded: string;
  stepByStep: string;
  safetyChecklist: string;
  pricingNote: string;
  customerExpectation: string;
  riskLevel: string;
}) {
  const treatmentId = item.treatmentName ? await getTreatmentIdByName(item.treatmentName) : null;

  await pool.query(
    `
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
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()
      WHERE NOT EXISTS (
        SELECT 1
        FROM treatment_cases
        WHERE LOWER(title) = LOWER($2)
      );
    `,
    [
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
    ]
  );
}

async function seedDefaultTreatments() {
  await ensureTreatmentsTable();

  const defaults = [
    {
      name: "Standard House Wash",
      category: "Soft Washing",
      surfaceTypes: ["Vinyl siding", "Painted siding", "Exterior walls"],
      chemical: "SH mix with surfactant",
      dilutionRatio: "Typically 0.5%–1.5% on surface depending on organic growth",
      useCase:
        "General exterior house washing for algae, mildew, light organic growth, and routine maintenance.",
      safetyNotes:
        "Pre-wet plants, protect outlets, avoid forcing water behind siding, rinse plants/windows thoroughly, and watch for oxidation.",
      instructions:
        "Apply low-pressure soft wash mix in controlled sections, allow dwell time without drying, rinse thoroughly, and inspect oxidation-sensitive areas.",
      purchaseLink: "",
      costReference:
        "Use NMD Job Pricing for house washing minimums, square footage, condition, height, access, and add-ons."
    },
    {
      name: "Roof Cleaning Soft Wash",
      category: "Roof Cleaning",
      surfaceTypes: ["Asphalt shingles", "Tile roof", "Metal roof"],
      chemical: "SH roof mix",
      dilutionRatio: "Often 3%–6% on surface depending on staining and roof material",
      useCase:
        "Organic roof stains, algae, black streaks, moss, and roof discoloration where pressure should not be used.",
      safetyNotes:
        "Use fall protection, protect plants, control runoff, avoid high pressure, watch overspray, and verify roof access/pitch.",
      instructions:
        "Apply roof-safe soft wash mix, let dwell, reapply where needed, rinse only when appropriate for the roof/job scope, and protect landscaping before/during/after.",
      purchaseLink: "",
      costReference:
        "Price separately from house wash. Account for roof pitch, size, access, moss load, plant protection, and chemical cost."
    },
    {
      name: "Concrete Surface Cleaning",
      category: "Flatwork",
      surfaceTypes: ["Concrete", "Driveways", "Sidewalks", "Patios"],
      chemical: "Pre/post treatment with SH or degreaser when needed",
      dilutionRatio: "Post-treat commonly 1%–3% depending on organic staining",
      useCase:
        "Driveway, sidewalk, patio, and flatwork cleaning for organic growth and general dirt.",
      safetyNotes:
        "Avoid damaging new concrete, verify GPM/surface cleaner size, prevent stripes, watch drainage/runoff, and test questionable surfaces.",
      instructions:
        "Pre-treat if needed, surface clean at proper pace, rinse thoroughly, post-treat organic staining, and avoid excessive pressure on weak/new concrete.",
      purchaseLink: "",
      costReference:
        "Price by square foot with minimum service charge. Increase for heavy staining, poor drainage, oil, rust, or restoration work."
    },
    {
      name: "Rust Stain Removal",
      category: "Specialty Restoration",
      surfaceTypes: ["Concrete", "Pavers", "Stucco", "Stone", "Exterior walls"],
      chemical: "F9 BARC, oxalic acid, or compatible rust remover",
      dilutionRatio: "Oxalic often 6–8 oz per gallon depending on use case; follow product label",
      useCase:
        "Rust stains from irrigation, metal furniture, battery stains, fertilizer stains, or orange staining.",
      safetyNotes:
        "Test spot first, protect surrounding surfaces, wear PPE, avoid glass/metal damage, and do not promise full removal without testing.",
      instructions:
        "Identify stain source, test small area, apply rust remover carefully, dwell as directed, agitate if safe, rinse thoroughly, and repeat if needed.",
      purchaseLink: "",
      costReference:
        "Price as specialty restoration. Small spots $50–$100, entry pads $125–$300, heavy irrigation stains $300–$800+."
    }
  ];

  for (const item of defaults) {
    await upsertDefaultTreatment(item);
  }

  const defaultCases = [
    {
      treatmentName: "Rust Stain Removal",
      title: "Heavy Irrigation Rust On Concrete",
      surfaceType: "Concrete / driveway / sidewalk",
      conditionLevel: "Heavy",
      problemType: "Orange irrigation rust staining",
      recommendedMix: "F9 BARC or compatible rust remover per label. Oxalic acid may be used only where appropriate.",
      dwellTime: "Follow product label; do not allow product to dry.",
      toolsNeeded: "Pump sprayer, PPE, water source, brush for agitation if safe, test area supplies.",
      stepByStep:
        "1. Inspect stain source. 2. Test a small area. 3. Protect adjacent surfaces/plants. 4. Apply rust remover evenly. 5. Allow controlled dwell. 6. Agitate only if safe. 7. Rinse thoroughly. 8. Repeat only if surface tolerates it.",
      safetyChecklist:
        "Wear PPE, avoid glass/metal overspray, control runoff, protect plants, document pre-existing surface damage, and do not guarantee 100% removal before testing.",
      pricingNote:
        "Treat as specialty restoration. Heavy irrigation rust can be $300–$800+ depending on size, severity, chemical use, and repeat applications.",
      customerExpectation:
        "Explain that rust may need multiple applications and final results depend on stain depth, surface age, and previous chemical exposure.",
      riskLevel: "High Review"
    }
  ];

  for (const item of defaultCases) {
    await upsertDefaultTreatmentCase(item);
  }
}

router.get("/", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    const params: string[] = [];
    const where: string[] = [];

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

    const result = await pool.query<TreatmentRow>(
      `
        SELECT *
        FROM treatments
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY category ASC, name ASC;
      `,
      params
    );

    return res.json({
      treatments: result.rows.map(mapTreatment)
    });
  } catch (err) {
    console.error("Get treatments error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to load treatments."
    });
  }
});

router.post("/upload", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const mode = String(req.body?.mode || "upsert").trim();
    const items = Array.isArray(req.body?.treatments) ? req.body.treatments : [];

    if (items.length === 0) {
      return res.status(400).json({
        message: "No treatments were provided for upload."
      });
    }

    if (items.length > 500) {
      return res.status(400).json({
        message: "Upload limit is 500 treatments at a time."
      });
    }

    const imported: TreatmentRow[] = [];
    const skipped: Array<{ index: number; reason: string }> = [];

    for (let index = 0; index < items.length; index += 1) {
      const normalized = normalizeUploadItem(items[index]);

      if (!normalized.name) {
        skipped.push({
          index,
          reason: "Missing treatment name."
        });
        continue;
      }

      if (mode === "create-only") {
        const exists = await pool.query<{ id: string }>(
          `
            SELECT id
            FROM treatments
            WHERE LOWER(name) = LOWER($1)
              AND LOWER(category) = LOWER($2)
            LIMIT 1;
          `,
          [normalized.name, normalized.category]
        );

        if (exists.rows.length > 0) {
          skipped.push({
            index,
            reason: `Duplicate skipped: ${normalized.name}`
          });
          continue;
        }
      }

      const saved = await upsertTreatment(normalized);
      imported.push(saved);
    }

    const result = await pool.query<TreatmentRow>(
      `
        SELECT *
        FROM treatments
        ORDER BY category ASC, name ASC;
      `
    );

    return res.json({
      message: `Treatment upload complete. Imported ${imported.length}. Skipped ${skipped.length}.`,
      importedCount: imported.length,
      skippedCount: skipped.length,
      skipped,
      treatments: result.rows.map(mapTreatment)
    });
  } catch (err) {
    console.error("Upload treatments error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to upload treatments."
    });
  }
});

router.post("/seed", async (_req, res) => {
  try {
    await seedDefaultTreatments();

    const result = await pool.query<TreatmentRow>(
      `
        SELECT *
        FROM treatments
        ORDER BY category ASC, name ASC;
      `
    );

    const casesResult = await pool.query<TreatmentCaseRow>(
      `
        SELECT
          tc.*,
          t.name AS treatment_name,
          t.category AS treatment_category
        FROM treatment_cases tc
        LEFT JOIN treatments t ON t.id = tc.treatment_id
        ORDER BY tc.risk_level DESC, tc.title ASC;
      `
    );

    return res.json({
      message: "Treatment database and cases seeded successfully.",
      treatments: result.rows.map(mapTreatment),
      cases: casesResult.rows.map(mapTreatmentCase)
    });
  } catch (err) {
    console.error("Seed treatments error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to seed treatments."
    });
  }
});

router.get("/cases", async (_req, res) => {
  try {
    await ensureTreatmentsTable();

    const result = await pool.query<TreatmentCaseRow>(
      `
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
      `
    );

    return res.json({
      cases: result.rows.map(mapTreatmentCase)
    });
  } catch (err) {
    console.error("Get treatment cases error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to load treatment cases."
    });
  }
});

router.get("/plans", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const search = String(req.query.search || "").trim();
    const params: string[] = [];
    const where: string[] = [];

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

    const result = await pool.query<TreatmentPlanRow>(
      `
        SELECT *
        FROM treatment_plans
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY created_at DESC;
      `,
      params
    );

    return res.json({
      plans: result.rows.map(mapTreatmentPlan)
    });
  } catch (err) {
    console.error("Get treatment plans error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to load treatment plans."
    });
  }
});

router.post("/plans", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const jobName = String(req.body?.jobName || "").trim();

    if (!jobName) {
      return res.status(400).json({
        message: "Job name is required."
      });
    }

    const selectedTreatmentIds = Array.isArray(req.body?.selectedTreatmentIds)
      ? req.body.selectedTreatmentIds.map((id: unknown) => String(id)).filter(Boolean)
      : [];

    const selectedCaseIds = Array.isArray(req.body?.selectedCaseIds)
      ? req.body.selectedCaseIds.map((id: unknown) => String(id)).filter(Boolean)
      : [];

    const result = await pool.query<TreatmentPlanRow>(
      `
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
      `,
      [
        jobName,
        String(req.body?.clientName || "").trim() || null,
        String(req.body?.serviceAddress || "").trim() || null,
        String(req.body?.surfaceType || "").trim() || null,
        String(req.body?.conditionLevel || "").trim() || null,
        selectedTreatmentIds,
        selectedCaseIds,
        String(req.body?.notes || "").trim() || null,
        String(req.body?.planText || "").trim() || null
      ]
    );

    return res.status(201).json({
      plan: mapTreatmentPlan(result.rows[0])
    });
  } catch (err) {
    console.error("Create treatment plan error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to create treatment plan."
    });
  }
});

router.delete("/plans/:id", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const id = String(req.params.id || "").trim();

    const result = await pool.query(
      `
        DELETE FROM treatment_plans
        WHERE id = $1
        RETURNING id;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Treatment plan not found."
      });
    }

    return res.json({
      message: "Treatment plan deleted."
    });
  } catch (err) {
    console.error("Delete treatment plan error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to delete treatment plan."
    });
  }
});

router.post("/", async (req, res) => {
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
  } catch (err) {
    console.error("Create treatment error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to create treatment."
    });
  }
});

router.patch("/:id", async (req, res) => {
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

    const result = await pool.query<TreatmentRow>(
      `
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
      `,
      [
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
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Treatment not found."
      });
    }

    return res.json({
      treatment: mapTreatment(result.rows[0])
    });
  } catch (err) {
    console.error("Update treatment error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to update treatment."
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const id = String(req.params.id || "").trim();

    const result = await pool.query(
      `
        DELETE FROM treatments
        WHERE id = $1
        RETURNING id;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Treatment not found."
      });
    }

    return res.json({
      message: "Treatment deleted."
    });
  } catch (err) {
    console.error("Delete treatment error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to delete treatment."
    });
  }
});

export default router;
