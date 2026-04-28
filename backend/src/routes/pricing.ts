import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

function mapPricing(row: any) {
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
    estimatedMaterialCost: Number(
      row.estimated_material_cost || 0
    ),
    upsellSuggestions: row.upsell_suggestions,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

/*
====================================
GET ALL PRICING REFERENCES
====================================
*/
router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { search } = req.query as {
        search?: string;
      };

      let result;

      if (search) {
        result = await pool.query(
          `
          SELECT *
          FROM pricing_references
          WHERE
            service_type ILIKE $1
            OR surface_type ILIKE $1
            OR condition_severity ILIKE $1
          ORDER BY created_at DESC
          `,
          [`%${search}%`]
        );
      } else {
        result = await pool.query(`
          SELECT *
          FROM pricing_references
          ORDER BY created_at DESC
        `);
      }

      return res.json({
        pricing: result.rows.map(mapPricing)
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Server error"
      });
    }
  }
);

/*
====================================
CREATE PRICING REFERENCE
====================================
*/
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        serviceType,
        surfaceType,
        conditionSeverity,
        pricingModel,
        flatPrice,
        sqftPrice,
        subscriptionPrice,
        hourlyRate,
        estimatedHours,
        estimatedMaterialCost,
        upsellSuggestions,
        notes
      } = req.body;

      const result = await pool.query(
        `
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
        VALUES (
          $1,$2,$3,$4,$5,$6,
          $7,$8,$9,$10,$11,$12,$13
        )
        RETURNING *
        `,
        [
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
          req.user!.id
        ]
      );

      return res.status(201).json({
        pricing: mapPricing(result.rows[0])
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Server error"
      });
    }
  }
);

/*
====================================
DELETE PRICING REFERENCE
====================================
*/
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      await pool.query(
        `
        DELETE FROM pricing_references
        WHERE id = $1
        `,
        [req.params.id]
      );

      return res.json({
        message: "Pricing reference deleted"
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Server error"
      });
    }
  }
);

export default router;
