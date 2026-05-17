import express from "express";
import { Pool } from "pg";
import { requireAdmin, requireAuth } from "../middleware/authGuard.js";

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

type TreatmentCaseUploadItem = {
  treatmentName?: string;
  treatment_name?: string;
  treatmentId?: string;
  treatment_id?: string;
  title?: string;
  surfaceType?: string;
  surface_type?: string;
  conditionLevel?: string;
  condition_level?: string;
  problemType?: string;
  problem_type?: string;
  recommendedMix?: string;
  recommended_mix?: string;
  dwellTime?: string;
  dwell_time?: string;
  toolsNeeded?: string;
  tools_needed?: string;
  stepByStep?: string;
  step_by_step?: string;
  safetyChecklist?: string;
  safety_checklist?: string;
  pricingNote?: string;
  pricing_note?: string;
  customerExpectation?: string;
  customer_expectation?: string;
  riskLevel?: string;
  risk_level?: string;
};

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

function normalizeRiskLevel(value: unknown) {
  const raw = textValue(value).toLowerCase();

  if (raw === "high review" || raw === "high") return "High Review";
  if (raw === "moderate" || raw === "medium") return "Moderate";
  return "Standard";
}

function mapTreatment(row: TreatmentRow) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    surfaceTypes: row.surface_types || [],
    chemical: row.chemical || "",
    dilutionRatio: row.dilution_ratio || "",
    useCase: row.use_case || "",
    safetyNotes: row.safety_notes || "",
    instructions: row.instructions || "",
    purchaseLink: row.purchase_link || "",
    costReference: row.cost_reference || "",
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
    surfaceType: row.surface_type || "",
    conditionLevel: row.condition_level || "",
    problemType: row.problem_type || "",
    recommendedMix: row.recommended_mix || "",
    dwellTime: row.dwell_time || "",
    toolsNeeded: row.tools_needed || "",
    stepByStep: row.step_by_step || "",
    safetyChecklist: row.safety_checklist || "",
    pricingNote: row.pricing_note || "",
    customerExpectation: row.customer_expectation || "",
    riskLevel: row.risk_level || "Standard",
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

function normalizeCaseUploadItem(item: TreatmentCaseUploadItem) {
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
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

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
    CREATE INDEX IF NOT EXISTS treatment_plans_created_at_idx
    ON treatment_plans (created_at DESC);
  `);
}

async function getTreatmentIdByName(name: string) {
  if (!name) return null;

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

async function getJoinedCaseById(id: string) {
  const result = await pool.query<TreatmentCaseRow>(
    `
      SELECT
        tc.*,
        t.name AS treatment_name,
        t.category AS treatment_category
      FROM treatment_cases tc
      LEFT JOIN treatments t ON t.id = tc.treatment_id
      WHERE tc.id = $1
      LIMIT 1;
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function upsertTreatment(item: ReturnType<typeof normalizeUploadItem>) {
  const existing = await pool.query<TreatmentRow>(
    `
      SELECT *
      FROM treatments
      WHERE LOWER(name) = LOWER($1)
        AND LOWER(category) = LOWER($2)
      LIMIT 1;
    `,
    [item.name, item.category]
  );

  if (existing.rows[0]) {
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
      ]
    );

    return result.rows[0];
  }

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

async function upsertTreatmentCase(item: ReturnType<typeof normalizeCaseUploadItem>) {
  const treatmentId = item.treatmentId || (await getTreatmentIdByName(item.treatmentName || ""));

  const existing = await pool.query<TreatmentCaseRow>(
    `
      SELECT *
      FROM treatment_cases
      WHERE LOWER(title) = LOWER($1)
      LIMIT 1;
    `,
    [item.title]
  );

  if (existing.rows[0]) {
    const result = await pool.query<TreatmentCaseRow>(
      `
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
      `,
      [
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
      ]
    );

    return result.rows[0];
  }

  const result = await pool.query<TreatmentCaseRow>(
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
      RETURNING *;
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

  return result.rows[0];
}

async function seedDefaultTreatments() {
  await ensureTreatmentsTable();

  const defaults = [
    {
      name: "Standard House Wash",
      category: "Soft Washing",
      surfaceTypes: ["Vinyl siding", "Painted siding", "Exterior walls"],
      chemical: "SH mix with surfactant",
      dilutionRatio: "0.5%–1.5% on surface depending on organic growth",
      useCase: "General house washing for algae, mildew, dirt, and routine maintenance.",
      safetyNotes:
        "Pre-wet plants, protect outlets, avoid forcing water behind siding, rinse plants/windows thoroughly, and watch oxidation.",
      instructions:
        "Apply low-pressure soft wash mix in controlled sections, allow dwell without drying, rinse thoroughly, and inspect oxidation-sensitive areas.",
      purchaseLink: "",
      costReference:
        "Use house wash pricing minimums, square footage, condition, height, access, and add-ons."
    },
    {
      name: "Roof Cleaning Soft Wash",
      category: "Roof Cleaning",
      surfaceTypes: ["Asphalt shingles", "Tile roof", "Metal roof"],
      chemical: "SH roof mix",
      dilutionRatio: "3%–6% on surface depending on staining and roof material",
      useCase: "Organic roof stains, algae, black streaks, moss, and roof discoloration.",
      safetyNotes:
        "Use fall protection, protect plants, control runoff, avoid high pressure, watch overspray, and verify roof access/pitch.",
      instructions:
        "Apply roof-safe soft wash mix, dwell, reapply stubborn areas, rinse only when appropriate, and protect landscaping throughout.",
      purchaseLink: "",
      costReference:
        "Price separately from house wash. Account for roof pitch, size, access, moss load, plant protection, and chemical cost."
    },
    {
      name: "Concrete Surface Cleaning",
      category: "Flatwork",
      surfaceTypes: ["Concrete", "Driveways", "Sidewalks", "Patios"],
      chemical: "SH pre/post treatment or degreaser when needed",
      dilutionRatio: "Post-treat commonly 1%–3% depending on organic staining",
      useCase: "Driveway, sidewalk, patio, and flatwork cleaning.",
      safetyNotes:
        "Avoid damaging new concrete, verify GPM/surface cleaner size, prevent stripes, watch runoff, and test questionable surfaces.",
      instructions:
        "Pre-treat if needed, surface clean at proper pace, rinse thoroughly, post-treat organics, and avoid excessive pressure on weak/new concrete.",
      purchaseLink: "",
      costReference:
        "Price by square foot with a minimum. Increase for heavy staining, drainage, oil, rust, or restoration work."
    },
    {
      name: "Rust Stain Removal",
      category: "Specialty Restoration",
      surfaceTypes: ["Concrete", "Pavers", "Stucco", "Stone", "Exterior walls"],
      chemical: "F9 BARC, oxalic acid, or compatible rust remover",
      dilutionRatio: "Follow product label. Oxalic commonly 6–8 oz per gallon where appropriate.",
      useCase: "Rust stains from irrigation, metal furniture, battery stains, fertilizer, or orange staining.",
      safetyNotes:
        "Test spot first, protect surrounding surfaces, wear PPE, avoid glass/metals, and do not promise full removal without testing.",
      instructions:
        "Identify stain source, test small area, apply carefully, dwell as directed, agitate if safe, rinse thoroughly, and repeat if needed.",
      purchaseLink: "",
      costReference:
        "Specialty pricing. Small spots $50–$100, entry pads $125–$300, heavy irrigation stains $300–$800+."
    },
    {
      name: "Painted Concrete Warning",
      category: "Risk / Liability",
      surfaceTypes: ["Painted concrete", "Coated concrete", "Decorative concrete"],
      chemical: "Mild cleaner / soft wash only after test spot",
      dilutionRatio: "Start mild. Avoid aggressive pressure.",
      useCase: "Painted, coated, or sealed driveways/patios/pool decks.",
      safetyNotes:
        "Surface cleaner pressure can stripe, remove paint, or expose uneven coating. Confirm with client before cleaning.",
      instructions:
        "Test first. If painted/coated, avoid surface cleaner unless stripping/repainting is agreed. Soft wash and rinse carefully.",
      purchaseLink: "",
      costReference:
        "Correction, stripping, or repainting is separate from standard flatwork cleaning."
    },
    {
      name: "Plant Protection Workflow",
      category: "Safety / Protection",
      surfaceTypes: ["Landscaping", "Grass", "Plants", "Flower beds"],
      chemical: "Water and neutralizer where appropriate",
      dilutionRatio: "N/A",
      useCase: "Protect landscaping during roof cleaning, house washing, and chemical restoration.",
      safetyNotes:
        "SH overspray/runoff can damage plants. Protect before, during, and after chemical application.",
      instructions:
        "Pre-wet plants, cover sensitive plants when needed, control runoff, rinse repeatedly during/after, and use neutralizer where appropriate.",
      purchaseLink: "",
      costReference:
        "Include plant protection time and materials in roof cleaning and chemical restoration pricing."
    },
    {
      name: "Wood Fence / Deck Cleaning",
      category: "Wood Restoration",
      surfaceTypes: ["Wood fence", "Deck", "Wood siding"],
      chemical: "Sodium percarbonate, sodium hydroxide, oxalic acid brightener",
      dilutionRatio: "Depends on wood condition and product label",
      useCase: "Wood cleaning, gray wood restoration, fence/deck prep, and brightening.",
      safetyNotes:
        "Avoid high pressure, test first, manage fuzzing, protect plants, and set expectations on existing damage/color.",
      instructions:
        "Apply appropriate wood cleaner, dwell, rinse gently with low pressure, brighten with oxalic if needed, rinse, and dry.",
      purchaseLink: "",
      costReference:
        "Wood is specialty work. Price by linear feet/square footage, condition, prep needs, and staining/sealing scope."
    }
  ];

  for (const item of defaults) {
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
      recommendedMix: "F9 BARC or compatible rust remover per label. Oxalic acid where appropriate.",
      dwellTime: "Follow product label; do not allow product to dry.",
      toolsNeeded: "Pump sprayer, PPE, water source, brush for agitation if safe, test area supplies.",
      stepByStep:
        "Inspect stain source. Test a small area. Protect adjacent surfaces/plants. Apply rust remover evenly. Allow controlled dwell. Agitate only if safe. Rinse thoroughly. Repeat only if surface tolerates it.",
      safetyChecklist:
        "Wear PPE, avoid glass/metal overspray, control runoff, protect plants, document pre-existing damage, and do not guarantee 100% removal before testing.",
      pricingNote:
        "Treat as specialty restoration. Heavy irrigation rust can be $300–$800+ depending on size, severity, chemical use, and repeat applications.",
      customerExpectation:
        "Rust may need multiple applications. Final results depend on stain depth, surface age, and previous chemical exposure.",
      riskLevel: "High Review"
    },
    {
      treatmentName: "Painted Concrete Warning",
      treatmentId: null,
      title: "Painted Driveway With Surface Cleaner Stripes",
      surfaceType: "Painted or coated concrete",
      conditionLevel: "Damaged / striped",
      problemType: "Pressure stripes or coating damage",
      recommendedMix: "Do not continue aggressive pressure. Test mild soft wash only.",
      dwellTime: "N/A unless soft washing with mild chemistry.",
      toolsNeeded: "Camera, test spot supplies, mild cleaner, low-pressure rinse tools.",
      stepByStep:
        "Stop pressure cleaning. Document coating condition. Discuss with client. Test mild cleaning in a small area only. If coating is damaged, recommend repainting or stripping as a separate scope.",
      safetyChecklist:
        "Do not promise standard washing will fix coating damage. Avoid further pressure. Get client approval before correction attempts.",
      pricingNote:
        "Repaint/strip/coating correction is separate from standard flatwork cleaning.",
      customerExpectation:
        "Painted/coated surfaces can expose uneven coating or permanent striping under pressure.",
      riskLevel: "High Review"
    },
    {
      treatmentName: "Standard House Wash",
      treatmentId: null,
      title: "Basic Vinyl Siding Algae House Wash",
      surfaceType: "Vinyl siding",
      conditionLevel: "Light to moderate organic growth",
      problemType: "Algae, mildew, dirt",
      recommendedMix: "0.5%–1.5% SH on surface with surfactant depending on growth.",
      dwellTime: "5–10 minutes controlled dwell; do not let dry.",
      toolsNeeded: "Soft wash system, hose, plant protection, brush for trouble spots.",
      stepByStep:
        "Inspect siding/oxidation. Pre-wet plants. Apply mix in controlled sections. Let dwell without drying. Rinse thoroughly. Rinse plants/windows again.",
      safetyChecklist:
        "Protect outlets, cameras, doorbells, plants, windows, and avoid forcing water behind siding.",
      pricingNote:
        "Use house wash pricing minimums and increase for height, heavy growth, access, oxidation, or detached structures.",
      customerExpectation:
        "Standard wash removes organic growth and dirt but does not restore oxidation or faded siding.",
      riskLevel: "Standard"
    },
    {
      treatmentName: "Roof Cleaning Soft Wash",
      treatmentId: null,
      title: "Black Streak Asphalt Shingle Roof",
      surfaceType: "Asphalt shingles",
      conditionLevel: "Moderate to heavy organic staining",
      problemType: "Black streaks / algae",
      recommendedMix: "3%–6% roof mix depending on staining, roof material, and company policy.",
      dwellTime: "Controlled dwell; reapply as needed.",
      toolsNeeded: "Soft wash system, PPE, fall protection, plant protection, runoff control, ladder/stabilizer.",
      stepByStep:
        "Inspect roof and access. Protect plants and control runoff. Apply roof mix from safe position. Allow dwell. Reapply stubborn areas. Rinse only if job scope requires. Final plant rinse/protection.",
      safetyChecklist:
        "Fall protection, ladder safety, overspray control, plant protection, runoff control, roof material verification.",
      pricingNote:
        "Price separately from house wash. Consider pitch, access, roof size, moss load, chemical cost, and plant protection labor.",
      customerExpectation:
        "Some roof treatments continue working after service. Moss/lichen may take time to fully release.",
      riskLevel: "High Review"
    }
  ];

  for (const item of defaultCases) {
    await upsertTreatmentCase(item);
  }
}

async function seedIfEmpty() {
  await ensureTreatmentsTable();

  const result = await pool.query<{ count: string }>(`
    SELECT COUNT(*) AS count
    FROM treatments;
  `);

  if (Number(result.rows[0]?.
