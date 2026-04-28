import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.*,
        u.display_name as employee_name
      FROM mileage_logs m
      LEFT JOIN users u
      ON u.id = m.employee_id
      ORDER BY m.trip_date DESC, m.created_at DESC
    `);

    return res.json({
      mileageLogs: result.rows.map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        tripDate: row.trip_date,
        startLocation: row.start_location,
        endLocation: row.end_location,
        milesDriven: Number(row.miles_driven),
        reimbursementRate: Number(row.reimbursement_rate),
        reimbursementTotal: Number(row.reimbursement_total),
        purpose: row.purpose,
        odometerPhotoDataUrl: row.odometer_photo_data_url,
        reimbursementStatus: row.reimbursement_status,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const {
      employeeId,
      tripDate,
      startLocation,
      endLocation,
      milesDriven,
      reimbursementRate,
      purpose,
      odometerPhotoDataUrl
    } = req.body;

    if (!startLocation || !endLocation) {
      return res.status(400).json({
        error: "Start and end locations required"
      });
    }

    const miles = Number(milesDriven || 0);
    const rate = Number(reimbursementRate || 0.60);
    const total = miles * rate;

    const result = await pool.query(
      `
      INSERT INTO mileage_logs (
        employee_id,
        trip_date,
        start_location,
        end_location,
        miles_driven,
        reimbursement_rate,
        reimbursement_total,
        purpose,
        odometer_photo_data_url,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        employeeId || null,
        tripDate,
        startLocation,
        endLocation,
        miles,
        rate,
        total,
        purpose || null,
        odometerPhotoDataUrl || null,
        req.user!.id
      ]
    );

    return res.status(201).json({
      mileageLog: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `
      UPDATE mileage_logs
      SET reimbursement_status = $2
      WHERE id = $1
      RETURNING *
      `,
      [id, status]
    );

    return res.json({
      mileageLog: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM mileage_logs WHERE id = $1`,
      [req.params.id]
    );

    return res.json({ deleted: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
