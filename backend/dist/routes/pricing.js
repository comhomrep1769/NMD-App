import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
function mapPricing(row) {
    return {
        id: row.id,
        serviceType: row.service_type,
        surfaceType: row.surface_type,
        conditionSeverity: row.condition_severity,
        pricingModel: row.pricing_model,
        flatPrice: Number(row.flat_price || 0),
        sqftPrice: Number(row.sqft_price || 0),
        subscriptionPrice: Number(row.subscription_price || 0),
        hourlyRate: Number(row.hourly_rate || 0),
        estimatedHours: Number(row.estimated_hours || 0),
        estimatedMaterialCost: Number(row.estimated_material_cost || 0),
        upsellSuggestions: row.upsell_suggestions,
        notes: row.notes,
        createdBy: row.created_by,
        createdAt: row.created_at
    };
}
const homewyseSeeds = [
    ["Pressure Wash Driveway", "Concrete / Driveway", "Basic", "per_sqft", 0.42, "Homewyse 2026 reference: $0.42 - $0.52/sqft. Use NMD local pricing and severity modifiers before quoting."],
    ["Pressure Wash Deck", "Deck", "Basic", "per_sqft", 0.46, "Homewyse 2026 reference: $0.46 - $0.57/sqft. Wood/composite sensitivity and restoration prep may increase price."],
    ["Pressure Wash Mobile Home", "Mobile Home Exterior", "Basic", "per_sqft", 0.62, "Homewyse 2026 reference: $0.62 - $0.77/sqft. Useful for single-wide/double-wide quote checks."],
    ["Pressure Wash Roof", "Roof", "Basic", "per_sqft", 0.39, "Homewyse 2026 reference: $0.39 - $0.49/sqft. NMD should favor soft-wash rules and roof material safety."],
    ["Pressure Wash Tile Roof", "Tile Roof", "Basic", "per_sqft", 0.51, "Homewyse 2026 reference: $0.51 - $0.63/sqft. Tile fragility, pitch, access, and chemical cost may increase quote."],
    ["Power Wash Brick", "Brick", "Basic", "per_sqft", 0.40, "Homewyse 2026 reference: $0.40 - $0.50/sqft. Watch mortar, efflorescence, and oxidation/chemical compatibility."],
    ["Power Wash Garage", "Garage Exterior / Surface", "Basic", "per_sqft", 0.40, "Homewyse 2026 reference: $0.40 - $0.50/sqft. Oil/tire marks may require degreaser and higher severity pricing."],
    ["Pressure Wash General Area", "General Surface", "Basic", "per_sqft", 0.42, "Homewyse 2026 reference: $0.42 - $0.52/sqft. Use this as a general baseline only."],
    ["Power Wash Patio", "Patio", "Basic", "per_sqft", 0.39, "Homewyse 2026 reference: $0.39 - $0.49/sqft. Pavers, sealing prep, and sand replacement may increase price."],
    ["Clean Soffit", "Soffit / Eaves", "Basic", "per_sqft", 1.12, "Homewyse 2026 reference: $1.12 - $1.38/sqft. Delicate surface and oxidation risk; quote carefully."],
    ["Clean Moss", "Moss-Affected Surface", "Basic", "per_sqft", 0.72, "Homewyse 2026 reference: $0.72 - $1.39/sqft. Dwell time and retreatment may increase quote."],
    ["Soft Clean Shutters", "Shutters", "Basic", "flat_rate", 26.25, "Homewyse 2026 reference: $26.25 - $32.79 per shutter. Oxidation and delicate plastics may require hand detailing."],
    ["Power Wash House", "House Exterior", "Basic", "custom", 0, "Homewyse 2026 example showed $368.27 - $520.00 service total for a sample house wash. Use as market reference only."],
    ["Pressure Wash 2 Story House", "Two Story House Exterior", "Basic", "custom", 0, "Homewyse 2026 example showed $368.27 - $520.00 service total for sample 2-story house washing. Add access/height modifiers."],
    ["Pressure Wash Pool Deck", "Pool Deck", "Basic", "custom", 0, "Homewyse 2026 example showed $368.27 - $520.00 service total for a sample pool deck. Screen enclosure/calcium/algae may increase quote."],
    ["Power Wash Fence", "Fence", "Basic", "custom", 0, "Homewyse 2026 example showed $368.27 - $520.00 service total for a sample fence wash. Wood/vinyl/staining prep should modify price."]
];
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { search } = req.query;
        const result = search
            ? await pool.query(`
          SELECT *
          FROM pricing_references
          WHERE
            service_type ILIKE $1
            OR surface_type ILIKE $1
            OR condition_severity ILIKE $1
            OR notes ILIKE $1
          ORDER BY created_at DESC
          `, [`%${search}%`])
            : await pool.query(`
          SELECT *
          FROM pricing_references
          ORDER BY created_at DESC
        `);
        return res.json({
            pricing: result.rows.map(mapPricing)
        });
    }
    catch (error) {
        console.error("pricing list error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { serviceType, surfaceType, conditionSeverity, pricingModel, flatPrice, sqftPrice, subscriptionPrice, hourlyRate, estimatedHours, estimatedMaterialCost, upsellSuggestions, notes } = req.body;
        const result = await pool.query(`
      INSERT INTO pricing_references (
        service_type,
        surface_type,
        condition_severity,
        pricing_model,
        flat_price,
        sqft_price,
        subscription_price,
        hourly_rate,
        estimated_hours,
        estimated_material_cost,
        upsell_suggestions,
        notes,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
      `, [
            serviceType,
            surfaceType,
            conditionSeverity,
            pricingModel,
            flatPrice || null,
            sqftPrice || null,
            subscriptionPrice || null,
            hourlyRate || null,
            estimatedHours || null,
            estimatedMaterialCost || null,
            upsellSuggestions || null,
            notes || null,
            req.user.id
        ]);
        return res.status(201).json({
            pricing: mapPricing(result.rows[0])
        });
    }
    catch (error) {
        console.error("pricing create error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.post("/seed-homewyse", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        let inserted = 0;
        for (const seed of homewyseSeeds) {
            const [serviceType, surfaceType, conditionSeverity, pricingModel, price, notes] = seed;
            const exists = await pool.query(`
        SELECT id
        FROM pricing_references
        WHERE service_type = $1
          AND notes ILIKE '%Homewyse 2026%'
        LIMIT 1
        `, [serviceType]);
            if (exists.rows.length > 0)
                continue;
            await pool.query(`
        INSERT INTO pricing_references (
          service_type,
          surface_type,
          condition_severity,
          pricing_model,
          flat_price,
          sqft_price,
          subscription_price,
          hourly_rate,
          estimated_hours,
          estimated_material_cost,
          upsell_suggestions,
          notes,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,NULL,NULL,NULL,NULL,$7,$8,$9)
        `, [
                serviceType,
                surfaceType,
                conditionSeverity,
                pricingModel,
                pricingModel === "flat_rate" || pricingModel === "custom" ? price : null,
                pricingModel === "per_sqft" ? price : null,
                "Use NMD local conditions, severity, chemical cost, travel, and labor before final quote.",
                notes,
                req.user.id
            ]);
            inserted += 1;
        }
        return res.json({
            inserted,
            message: `Imported ${inserted} Homewyse pricing references.`
        });
    }
    catch (error) {
        console.error("homewyse seed error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        await pool.query(`
      DELETE FROM pricing_references
      WHERE id = $1
      `, [req.params.id]);
        return res.json({
            message: "Pricing reference deleted"
        });
    }
    catch (error) {
        console.error("pricing delete error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;
