import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendPushToUser, savePushSubscription, deletePushSubscription, ensurePushTables, } from "../services/push.js";
const router = Router();
// ── Public: the VAPID public key the browser needs to subscribe ──
// Served from here rather than a NEXT_PUBLIC_ build variable so the key
// only has to be configured in one place (the backend environment), and
// rotating it does not require a frontend rebuild.
router.get("/vapid-public-key", async (_req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY || "";
    if (!key) {
        return res.status(503).json({
            error: "Push notifications are not configured on this server.",
        });
    }
    return res.json({ publicKey: key });
});
router.post("/subscribe", requireAuth, async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ error: "Invalid push subscription" });
        }
        await savePushSubscription({
            userId: req.user.id,
            subscription: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
        });
        res.json({ saved: true });
    }
    catch (error) {
        console.error("push subscribe error", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Server error",
        });
    }
});
// ── Remove a subscription when the user turns notifications off ──
// Without this, revoked permissions leave rows that fail on every send
// until the dead-subscription cleanup catches them.
router.post("/unsubscribe", requireAuth, async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint)
            return res.status(400).json({ error: "Missing endpoint" });
        await deletePushSubscription(endpoint);
        res.json({ removed: true });
    }
    catch (error) {
        console.error("push unsubscribe error", error);
        res.status(500).json({ error: "Server error" });
    }
});
// ── Does this user have any active subscription? ──
router.get("/status", requireAuth, async (req, res) => {
    try {
        await ensurePushTables();
        const result = await pool.query(`SELECT COUNT(*)::int AS count FROM push_subscriptions WHERE user_id = $1`, [req.user.id]);
        res.json({ subscribed: (result.rows[0]?.count || 0) > 0, devices: result.rows[0]?.count || 0 });
    }
    catch (error) {
        console.error("push status error", error);
        res.status(500).json({ error: "Server error" });
    }
});
// ── Send a test notification to the caller's own devices ──
router.post("/test", requireAuth, async (req, res) => {
    try {
        await ensurePushTables();
        // A browser can hold a subscription the server never stored. Say so
        // plainly instead of reporting a send that had no recipients.
        const existing = await pool.query(`SELECT COUNT(*)::int AS count FROM push_subscriptions WHERE user_id = $1`, [req.user.id]);
        if ((existing.rows[0]?.count || 0) === 0) {
            return res.status(400).json({
                error: "This device isn't registered on the server. Turn notifications off and on again.",
            });
        }
        const result = await sendPushToUser(req.user.id, {
            title: "NMD notifications are on",
            body: "This is a test. You'll get alerts like this for jobs, messages and quotes.",
            url: "/",
        });
        res.json({ sent: true, result });
    }
    catch (error) {
        console.error("push test error", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Server error",
        });
    }
});
// ── Admin: send an announcement to everyone, or to one role ──
router.post("/broadcast", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
    try {
        const { title, body, url, role } = req.body;
        if (!title?.trim())
            return res.status(400).json({ error: "A title is required." });
        if (!body?.trim())
            return res.status(400).json({ error: "A message is required." });
        const allowedRoles = ["admin", "superadmin", "employee", "client", "sales"];
        const useRole = role && role !== "all" ? role : null;
        if (useRole && !allowedRoles.includes(useRole)) {
            return res.status(400).json({ error: "Unknown role." });
        }
        await ensurePushTables();
        // Only users who actually have a subscription are worth iterating.
        const recipients = await pool.query(useRole
            ? `SELECT DISTINCT ps.user_id
             FROM push_subscriptions ps
             JOIN users u ON u.id = ps.user_id
            WHERE u.role = $1`
            : `SELECT DISTINCT user_id FROM push_subscriptions`, useRole ? [useRole] : []);
        let sent = 0;
        let failed = 0;
        for (const row of recipients.rows) {
            try {
                await sendPushToUser(row.user_id, {
                    title: title.trim(),
                    body: body.trim(),
                    url: url?.trim() || "/",
                });
                sent += 1;
            }
            catch {
                failed += 1;
            }
        }
        res.json({ recipients: recipients.rows.length, sent, failed });
    }
    catch (error) {
        console.error("push broadcast error", error);
        res.status(500).json({ error: "Server error" });
    }
});
export default router;
