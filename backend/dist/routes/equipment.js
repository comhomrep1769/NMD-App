import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
function mapEquipment(row) {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        identifier: row.identifier,
        status: row.status,
        psiRating: row.psi_rating,
        waterCapacityGallons: row.water_capacity_gallons,
        bedSpace: row.bed_space,
        hitchType: row.hitch_type,
        maintenanceNotes: row.maintenance_notes,
        createdAt: row.created_at
    };
}
router.get("/", requireAuth, async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT *
      FROM equipment
      ORDER BY created_at DESC
    `);
        return res.json({
            equipment: result.rows.map(mapEquipment)
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { name, category, description, identifier, psiRating, waterCapacityGallons, bedSpace, hitchType, maintenanceNotes } = req.body;
        const result = await pool.query(`
      INSERT INTO equipment (
        name,
        category,
        description,
        identifier,
        psi_rating,
        water_capacity_gallons,
        bed_space,
        hitch_type,
        maintenance_notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `, [
            name,
            category,
            description || null,
            identifier || null,
            psiRating || null,
            waterCapacityGallons || null,
            bedSpace || null,
            hitchType || null,
            maintenanceNotes || null
        ]);
        return res.status(201).json({
            equipment: mapEquipment(result.rows[0])
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
router.put("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query(`
      UPDATE equipment
      SET status = $2
      WHERE id = $1
      RETURNING *
      `, [req.params.id, status]);
        if (!result.rows.length) {
            return res.status(404).json({
                error: "Equipment not found"
            });
        }
        return res.json({
            equipment: mapEquipment(result.rows[0])
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
router.post("/assign", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { jobId, equipmentId } = req.body;
        const existingAssignment = await pool.query(`
      SELECT id
      FROM job_equipment_assignments
      WHERE job_id = $1
        AND equipment_id = $2
      `, [jobId, equipmentId]);
        if (existingAssignment.rows.length > 0) {
            return res.status(400).json({
                error: "Equipment already assigned to this job."
            });
        }
        await pool.query(`
      INSERT INTO job_equipment_assignments (
        job_id,
        equipment_id
      )
      VALUES ($1,$2)
      `, [jobId, equipmentId]);
        await pool.query(`
      UPDATE equipment
      SET status = 'assigned'
      WHERE id = $1
      `, [equipmentId]);
        return res.status(201).json({
            message: "Equipment assigned successfully"
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
router.get("/job/:jobId", requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        e.*
      FROM job_equipment_assignments je
      JOIN equipment e
        ON e.id = je.equipment_id
      WHERE je.job_id = $1
      `, [req.params.jobId]);
        return res.json({
            equipment: result.rows.map(mapEquipment)
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Server error"
        });
    }
});
export default router;
