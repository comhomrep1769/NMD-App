import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function mapTreatment(row: any) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    surfaceType: row.surface_type,
    stainType: row.stain_type,
    severity: row.severity,
    chemicalName: row.chemical_name,
    dilutionRatio: row.dilution_ratio,
    applicationMethod: row.application_method,
    dwellTime: row.dwell_time,
    rinseMethod: row.rinse_method,
    safetyNotes: row.safety_notes,
    damageWarnings: row.damage_warnings,
    estimatedMaterialCost: Number(
      row.estimated_material_cost || 0
    ),
    purchaseLink: row.purchase_link,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/*
=======================================
GET ALL TREATMENTS
=======================================
*/
router.get("/", requireAuth, async (req, res) => {
  try {
    const { search } = req.query as {
      search?: string;
    };

    let result;

    if (search) {
      result = await pool.query(
        `
        SELECT *
        FROM treatment_cases
        WHERE
          title ILIKE $1
          OR category ILIKE $1
          OR surface_type ILIKE $1
          OR stain_type ILIKE $1
          OR chemical_name ILIKE $1
        ORDER BY created_at DESC
        `,
        [`%${search}%`]
      );
    } else {
      result = await pool.query(`
        SELECT *
        FROM treatment_cases
        ORDER BY created_at DESC
      `);
    }

    return res.json({
      treatments: result.rows.map(mapTreatment)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Server error"
    });
  }
});

/*
=======================================
CREATE TREATMENT
(Admin only creation handled in frontend role logic)
=======================================
*/
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      title,
      category,
      surfaceType,
      stainType,
      severity,
      chemicalName,
      dilutionRatio,
      applicationMethod,
      dwellTime,
      rinseMethod,
      safetyNotes,
      damageWarnings,
      estimatedMaterialCost,
      purchaseLink,
      notes
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO treatment_cases (
        title,
        category,
        surface_type,
        stain_type,
        severity,
        chemical_name,
        dilution_ratio,
        application_method,
        dwell_time,
        rinse_method,
        safety_notes,
        damage_warnings,
        estimated_material_cost,
        purchase_link,
        notes,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16
      )
      RETURNING *
      `,
      [
        title,
        category,
        surfaceType,
        stainType,
        severity,
        chemicalName,
        dilutionRatio,
        applicationMethod,
        dwellTime,
        rinseMethod,
        safetyNotes,
        damageWarnings,
        estimatedMaterialCost || null,
        purchaseLink || null,
        notes || null,
        req.user!.id
      ]
    );

    return res.status(201).json({
      treatment: mapTreatment(result.rows[0])
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Server error"
    });
  }
});

/*
=======================================
DELETE TREATMENT
=======================================
*/
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM treatment_cases
      WHERE id = $1
      `,
      [req.params.id]
    );

    return res.json({
      message: "Treatment deleted"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Server error"
    });
  }
});

export default router;
