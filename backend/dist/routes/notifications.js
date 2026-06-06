import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.post("/subscribe", requireAuth, async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ error: "Invalid push subscription" });
        }
        await pool.query(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (endpoint)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth
      `, [req.user.id, endpoint, keys.p256dh, keys.auth]);
        res.json({ saved: true });
    }
    catch (error) {
        console.error("push subscribe error", error);
        res.status(500).json({ error: "Server error" });
    }
});
export default router;
