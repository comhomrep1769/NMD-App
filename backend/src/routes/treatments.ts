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

    return res.json({
      message: "Treatment database seeded successfully.",
      treatments: result.rows.map(mapTreatment)
    });
  } catch (err) {
    console.error("Seed treatments error:", err);

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Failed to seed treatments."
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
