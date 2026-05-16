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
  await pool.query(
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
      ON CONFLICT DO NOTHING;
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
    },
    {
      name: "Wood Fence / Deck Cleaning",
      category: "Wood Restoration",
      surfaceTypes: ["Wood fence", "Deck", "Wood siding"],
      chemical: "Sodium percarbonate, sodium hydroxide, oxalic acid brightener",
      dilutionRatio: "Depends on wood condition and product. Oxalic brightener commonly used after cleaning/stripping.",
      useCase:
        "Wood cleaning, gray wood restoration, fence/deck prep, and brightening after alkaline cleaners.",
      safetyNotes:
        "Avoid excessive pressure, test first, manage fuzzing, protect plants, and set expectations about existing damage and final color.",
      instructions:
        "Apply appropriate wood cleaner, dwell, gently rinse with low pressure, apply oxalic brightener if needed, rinse, and allow proper drying.",
      purchaseLink: "",
      costReference:
        "Wood is specialty work. Price based on linear feet/square footage, condition, prep needs, and whether staining/sealing is included."
    },
    {
      name: "Oil / Grease Spot Treatment",
      category: "Stain Removal",
      surfaceTypes: ["Concrete", "Pavers", "Garage floors", "Dumpster pads"],
      chemical: "Butyl degreaser, sodium hydroxide degreaser, hot water if available",
      dilutionRatio: "Varies by product and stain severity",
      useCase:
        "Oil, grease, tire marks, restaurant grease, dumpster pad buildup, and automotive stains.",
      safetyNotes:
        "May not fully remove deep oil stains. Watch runoff, protect nearby surfaces, wear PPE, and use heat where available.",
      instructions:
        "Apply degreaser, dwell, agitate, hot water rinse if available, repeat if needed, and explain that deep stains may lighten but not disappear.",
      purchaseLink: "",
      costReference:
        "Charge as add-on or specialty stain treatment. Increase price for commercial grease, repeat applications, and hot water needs."
    },
    {
      name: "Oxidation Caution / Siding Test",
      category: "Risk / Liability",
      surfaceTypes: ["Vinyl siding", "Aluminum siding", "Painted siding", "Gutters"],
      chemical: "Test before applying stronger mixes",
      dilutionRatio: "Use mild test spot first",
      useCase:
        "Identify oxidation risk before washing siding, gutters, painted metals, and older exterior surfaces.",
      safetyNotes:
        "Oxidation can streak or change appearance. Do not scrub or pressure oxidized surfaces without approval.",
      instructions:
        "Perform a test spot, document existing oxidation, explain risk to client, and avoid promising restoration during a standard wash.",
      purchaseLink: "",
      costReference:
        "Oxidation removal is separate from standard washing and should be priced as restoration."
    },
    {
      name: "Plant Protection Workflow",
      category: "Safety / Protection",
      surfaceTypes: ["Landscaping", "Grass", "Plants", "Flower beds"],
      chemical: "Water, neutralizer when appropriate",
      dilutionRatio: "N/A",
      useCase:
        "Protect landscaping during soft washing, roof cleaning, and chemical-based exterior cleaning.",
      safetyNotes:
        "Plant damage can happen from SH overspray or runoff. Protect before, during, and after chemical application.",
      instructions:
        "Pre-wet plants, cover sensitive plants if needed, control runoff, rinse repeatedly during and after, and use neutralizer where appropriate.",
      purchaseLink: "",
      costReference:
        "Include plant protection time/materials in roof cleaning, heavy soft washing, and chemical restoration pricing."
    },
    {
      name: "Painted Concrete Warning",
      category: "Risk / Liability",
      surfaceTypes: ["Painted concrete", "Decorative concrete", "Coated surfaces"],
      chemical: "Mild cleaner / soft wash only after test spot",
      dilutionRatio: "Start mild. Avoid aggressive pressure.",
      useCase:
        "Driveways, patios, walkways, or pool decks that appear painted, coated, or sealed.",
      safetyNotes:
        "Surface cleaner pressure can leave stripes, remove paint, or expose uneven coating. Confirm with client before cleaning.",
      instructions:
        "Test first. If painted or coated, avoid surface cleaner unless stripping/repainting is the agreed scope. Soft wash and rinse carefully.",
      purchaseLink: "",
      costReference:
        "If damage already exists, quote repainting/stripping separately. Do not include coating correction in standard wash."
    },
    {
      name: "Stucco Soft Wash",
      category: "Soft Washing",
      surfaceTypes: ["Stucco", "EIFS", "Painted stucco"],
      chemical: "Low-pressure SH mix with surfactant",
      dilutionRatio: "Typically 0.5%–1.5% on surface depending on organic growth and paint condition",
      useCase:
        "Algae, mildew, and organic staining on stucco walls where high pressure can cause damage.",
      safetyNotes:
        "Check cracks, failed paint, oxidation, window seals, water intrusion risks, and delicate landscaping.",
      instructions:
        "Apply low pressure, keep controlled dwell, avoid forcing water into cracks or weep points, rinse gently, and document pre-existing cracks.",
      purchaseLink: "",
      costReference:
        "Increase pricing for height, heavy staining, delicate access, oxidation, or water intrusion risk."
    },
    {
      name: "Paver Cleaning Caution",
      category: "Flatwork",
      surfaceTypes: ["Pavers", "Brick pavers", "Travertine", "Pool deck pavers"],
      chemical: "SH for organics, degreaser for grease, specialty removers as needed",
      dilutionRatio: "Varies by stain and paver condition",
      useCase:
        "Cleaning pavers while protecting joints, sand, sealer, and surrounding pool/landscaping areas.",
      safetyNotes:
        "Watch polymeric sand, loose joints, old sealer, efflorescence, drainage, and pool water contamination.",
      instructions:
        "Test first, use appropriate pressure, rinse well, avoid blowing out joints unnecessarily, and recommend resanding/sealing when needed.",
      purchaseLink: "",
      costReference:
        "Pavers may require add-on pricing for resanding, sealing, efflorescence, heavy algae, or specialty stain removal."
    },
    {
      name: "Gutter Brightening",
      category: "Specialty Restoration",
      surfaceTypes: ["Gutters", "Fascia", "Painted metal"],
      chemical: "Gutter brightener / oxidation-safe cleaner",
      dilutionRatio: "Follow label. Test first.",
      useCase:
        "Tiger stripes and oxidation staining on gutters that standard house washing does not remove.",
      safetyNotes:
        "Can affect paint or oxidized surfaces. Test spot required. Avoid glass and sensitive metals.",
      instructions:
        "Apply to small sections, agitate gently if safe, rinse thoroughly, and separate from standard wash pricing.",
      purchaseLink: "",
      costReference:
        "Price as specialty add-on, not included in a normal house wash unless specifically sold."
    },
    {
      name: "New Concrete Cleaning Caution",
      category: "Risk / Liability",
      surfaceTypes: ["New concrete", "Young concrete", "Driveways", "Sidewalks"],
      chemical: "Mild SH treatment for organics if needed",
      dilutionRatio: "Avoid aggressive pressure. Use chemical-first approach when safe.",
      useCase:
        "Concrete less than 2–3 years old or weak/green concrete that can etch easily.",
      safetyNotes:
        "High pressure can permanently scar or expose cream layer. Customer expectations must be documented.",
      instructions:
        "Avoid surface cleaner pressure on questionable new concrete. Use soft treatment, rinse, and test before proceeding.",
      purchaseLink: "",
      costReference:
        "If client wants full restoration, price carefully and document risk before work."
    },
    {
      name: "Restaurant Degreasing",
      category: "Commercial",
      surfaceTypes: ["Dumpster pads", "Restaurant concrete", "Drive-thru lanes", "Grease areas"],
      chemical: "Butyl degreaser, sodium hydroxide degreaser, hot water recommended",
      dilutionRatio: "Varies by grease load and product label",
      useCase:
        "Commercial grease, food waste, dumpster pad buildup, drive-thru stains, and high-traffic commercial grime.",
      safetyNotes:
        "Manage runoff, slip hazards, PPE, hot water burns, chemical strength, and local disposal requirements.",
      instructions:
        "Pre-scrape heavy debris, apply degreaser, dwell, agitate, hot water wash if available, rinse, repeat, and document remaining deep stains.",
      purchaseLink: "",
      costReference:
        "Commercial degreasing should be premium priced. Consider hourly + chemical cost + disposal/runoff complexity."
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
    },
    {
      treatmentName: "Painted Concrete Warning",
      title: "Painted Driveway With Stripes After Surface Cleaning",
      surfaceType: "Painted or coated concrete",
      conditionLevel: "Damaged / striped",
      problemType: "Pressure stripes or coating damage",
      recommendedMix: "Do not continue aggressive pressure. Soft wash only if testing confirms it is safe.",
      dwellTime: "N/A unless soft washing with mild chemistry.",
      toolsNeeded: "Camera, test spot supplies, mild cleaner, low-pressure rinse tools.",
      stepByStep:
        "1. Stop pressure cleaning. 2. Document the coating/paint condition. 3. Discuss with client. 4. Test mild soft wash in small area only. 5. If coating is damaged, recommend repainting or stripping as a separate scope.",
      safetyChecklist:
        "Do not promise standard washing will fix coating damage. Avoid further pressure. Get client approval before any correction attempt.",
      pricingNote:
        "Repaint/strip/coating correction is separate from standard flatwork cleaning and should be bid separately.",
      customerExpectation:
        "Explain that the surface appears painted/coated and pressure may expose uneven coating or create permanent striping.",
      riskLevel: "High Review"
    },
    {
      treatmentName: "Standard House Wash",
      title: "Basic Vinyl Siding Algae House Wash",
      surfaceType: "Vinyl siding",
      conditionLevel: "Light to moderate organic growth",
      problemType: "Algae, mildew, dirt",
      recommendedMix: "0.5%–1.5% SH on surface with surfactant depending on growth.",
      dwellTime: "5–10 minutes controlled dwell; do not let dry.",
      toolsNeeded: "Soft wash system, garden hose, plant protection, brush for small trouble spots.",
      stepByStep:
        "1. Inspect siding/oxidation. 2. Pre-wet plants. 3. Apply mix in controlled sections. 4. Let dwell without drying. 5. Rinse thoroughly. 6. Rinse plants/windows again.",
      safetyChecklist:
        "Protect outlets, cameras, doorbells, plants, windows, and avoid forcing water behind siding.",
      pricingNote:
        "Use house wash pricing minimums and increase for height, heavy growth, access, oxidation, or detached structures.",
      customerExpectation:
        "Standard wash removes organic growth and dirt but does not automatically restore oxidation or faded siding.",
      riskLevel: "Standard"
    },
    {
      treatmentName: "Roof Cleaning Soft Wash",
      title: "Black Streak Asphalt Shingle Roof",
      surfaceType: "Asphalt shingles",
      conditionLevel: "Moderate to heavy organic staining",
      problemType: "Gloeocapsa magma / black streaks / algae",
      recommendedMix: "3%–6% roof mix depending on staining, roof material, and company policy.",
      dwellTime: "Controlled dwell; reapply as needed. Follow roof cleaning workflow.",
      toolsNeeded: "Soft wash system, PPE, fall protection, plant protection, runoff control, ladder/stabilizer.",
      stepByStep:
        "1. Inspect roof and access. 2. Protect plants and control runoff. 3. Apply roof mix from safe position. 4. Allow dwell. 5. Reapply stubborn areas. 6. Rinse only if job scope requires. 7. Final plant rinse/protection.",
      safetyChecklist:
        "Fall protection, ladder safety, overspray control, plant protection, runoff control, roof material verification.",
      pricingNote:
        "Price separately from house wash. Consider pitch, access, roof size, moss load, chemical cost, and plant protection labor.",
      customerExpectation:
        "Some roof treatments continue working after service. Moss/lichen may take time to fully release.",
      riskLevel: "High Review"
    },
    {
      treatmentName: "Wood Fence / Deck Cleaning",
      title: "Gray Wood Fence Cleaning And Brightening",
      surfaceType: "Wood fence",
      conditionLevel: "Weathered / gray",
      problemType: "Oxidized gray wood and organic buildup",
      recommendedMix: "Wood cleaner appropriate to condition, followed by oxalic brightener when needed.",
      dwellTime: "Depends on product and wood condition. Do not let product dry.",
      toolsNeeded: "Pump sprayer or soft wash, low-pressure rinse, brush, oxalic brightener, PPE.",
      stepByStep:
        "1. Test area. 2. Apply wood cleaner. 3. Allow controlled dwell. 4. Rinse gently with low pressure. 5. Apply oxalic brightener if needed. 6. Rinse and allow to dry.",
      safetyChecklist:
        "Avoid high pressure, document existing damage, protect plants, manage fuzzing, and do not promise stain/sealer results unless included.",
      pricingNote:
        "Wood restoration is specialty work. Price by linear feet/square footage, condition, and whether brightening/staining/sealing is included.",
      customerExpectation:
        "Wood color may vary after cleaning based on age, prior coatings, sun exposure, and damage.",
      riskLevel: "Moderate"
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

router.get("/cases", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const search = String(req.query.search || "").trim();
    const treatmentId = String(req.query.treatmentId || "").trim();
    const riskLevel = String(req.query.riskLevel || "").trim();

    const params: string[] = [];
    const where: string[] = [];

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

    const result = await pool.query<TreatmentCaseRow>(
      `
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
      `,
      params
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

    if (!id) {
      return res.status(400).json({
        message: "Treatment plan ID is required."
      });
    }

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

router.post("/cases", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const title = String(req.body?.title || "").trim();

    if (!title) {
      return res.status(400).json({
        message: "Case title is required."
      });
    }

    const treatmentId = String(req.body?.treatmentId || "").trim() || null;

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
        title,
        String(req.body?.surfaceType || "").trim() || null,
        String(req.body?.conditionLevel || "").trim() || null,
        String(req.body?.problemType || "").trim() || null,
        String(req.body?.recommendedMix || "").trim() || null,
        String(req.body?.dwellTime || "").trim() || null,
        String(req.body?.toolsNeeded || "").trim() || null,
        String(req.body?.stepByStep || "").trim() || null,
        String(req.body?.safetyChecklist || "").trim() || null,
        String(req.body?.pricingNote || "").trim() || null,
        String(req.body?.customerExpectation || "").trim() || null,
        String(req.body?.riskLevel || "Standard").trim() || "Standard"
      ]
    );

    const joinedResult = await pool.query<TreatmentCaseRow>(
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
      [result.rows[0].id]
    );

    return res.status(201).json({
      case: mapTreatmentCase(joinedResult.rows[0])
    });
  } catch (err) {
    console.error("Create treatment case error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to create treatment case."
    });
  }
});

router.patch("/cases/:id", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const id = String(req.params.id || "").trim();
    const title = String(req.body?.title || "").trim();

    if (!id) {
      return res.status(400).json({
        message: "Case ID is required."
      });
    }

    if (!title) {
      return res.status(400).json({
        message: "Case title is required."
      });
    }

    const treatmentId = String(req.body?.treatmentId || "").trim() || null;

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
        id,
        treatmentId,
        title,
        String(req.body?.surfaceType || "").trim() || null,
        String(req.body?.conditionLevel || "").trim() || null,
        String(req.body?.problemType || "").trim() || null,
        String(req.body?.recommendedMix || "").trim() || null,
        String(req.body?.dwellTime || "").trim() || null,
        String(req.body?.toolsNeeded || "").trim() || null,
        String(req.body?.stepByStep || "").trim() || null,
        String(req.body?.safetyChecklist || "").trim() || null,
        String(req.body?.pricingNote || "").trim() || null,
        String(req.body?.customerExpectation || "").trim() || null,
        String(req.body?.riskLevel || "Standard").trim() || "Standard"
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Treatment case not found."
      });
    }

    const joinedResult = await pool.query<TreatmentCaseRow>(
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

    return res.json({
      case: mapTreatmentCase(joinedResult.rows[0])
    });
  } catch (err) {
    console.error("Update treatment case error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to update treatment case."
    });
  }
});

router.delete("/cases/:id", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const id = String(req.params.id || "").trim();

    if (!id) {
      return res.status(400).json({
        message: "Case ID is required."
      });
    }

    const result = await pool.query(
      `
        DELETE FROM treatment_cases
        WHERE id = $1
        RETURNING id;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Treatment case not found."
      });
    }

    return res.json({
      message: "Treatment case deleted."
    });
  } catch (err) {
    console.error("Delete treatment case error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to delete treatment case."
    });
  }
});

router.post("/", async (req, res) => {
  try {
    await ensureTreatmentsTable();

    const name = String(req.body?.name || "").trim();
    const category = String(req.body?.category || "General").trim();

    const surfaceTypes = Array.isArray(req.body?.surfaceTypes)
      ? req.body.surfaceTypes.map((item: unknown) => String(item).trim()).filter(Boolean)
      : String(req.body?.surfaceTypes || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

    if (!name) {
      return res.status(400).json({
        message: "Treatment name is required."
      });
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
        name,
        category || "General",
        surfaceTypes,
        String(req.body?.chemical || "").trim() || null,
        String(req.body?.dilutionRatio || "").trim() || null,
        String(req.body?.useCase || "").trim() || null,
        String(req.body?.safetyNotes || "").trim() || null,
        String(req.body?.instructions || "").trim() || null,
        String(req.body?.purchaseLink || "").trim() || null,
        String(req.body?.costReference || "").trim() || null
      ]
    );

    return res.status(201).json({
      treatment: mapTreatment(result.rows[0])
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
    const name = String(req.body?.name || "").trim();
    const category = String(req.body?.category || "General").trim();

    const surfaceTypes = Array.isArray(req.body?.surfaceTypes)
      ? req.body.surfaceTypes.map((item: unknown) => String(item).trim()).filter(Boolean)
      : String(req.body?.surfaceTypes || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

    if (!id) {
      return res.status(400).json({
        message: "Treatment ID is required."
      });
    }

    if (!name) {
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
        name,
        category || "General",
        surfaceTypes,
        String(req.body?.chemical || "").trim() || null,
        String(req.body?.dilutionRatio || "").trim() || null,
        String(req.body?.useCase || "").trim() || null,
        String(req.body?.safetyNotes || "").trim() || null,
        String(req.body?.instructions || "").trim() || null,
        String(req.body?.purchaseLink || "").trim() || null,
        String(req.body?.costReference || "").trim() || null
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

    if (!id) {
      return res.status(400).json({
        message: "Treatment ID is required."
      });
    }

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
