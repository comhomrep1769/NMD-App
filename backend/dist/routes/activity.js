// New file: backend/src/routes/activity.ts
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
function mapActivity(row) {
    return {
        id: row.id,
        actorType: row.actor_type,
        actorName: row.actor_name,
        actorId: row.actor_id,
        action: row.action,
        description: row.description,
        metadata: row.metadata,
        createdAt: row.created_at,
    };
}
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit || "50")), 200);
        const actorType = req.query.actorType;
        const result = await pool.query(`SELECT * FROM activity_log
       ${actorType ? "WHERE actor_type = $2" : ""}
       ORDER BY created_at DESC
       LIMIT $1`, actorType ? [limit, actorType] : [limit]);
        return res.json({ activity: result.rows.map(mapActivity) });
    }
    catch (error) {
        console.error("activity list error", error);
        return res.status(500).json({ error: "Server error" });
    }
});
export default router;
