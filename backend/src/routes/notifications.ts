import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendPushToUser } from "../services/push.js";

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
    const { endpoint, keys } = req.body as {
      endpoint?: string;
      keys?: {
        p256dh?: string;
        auth?: string;
      };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Invalid push subscription" });
    }

    await pool.query(
      `
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (endpoint)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        updated_at = NOW()
      `,
      [req.user!.id, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ saved: true });
  } catch (error) {
    console.error("push subscribe error", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Remove a subscription when the user turns notifications off ──
// Without this, revoked permissions leave rows that fail on every send
// until the dead-subscription cleanup catches them.
router.post("/unsubscribe", requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body as { endpoint?: string };
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });

    await pool.query(
      `DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2`,
      [endpoint, req.user!.id]
    );

    res.json({ removed: true });
  } catch (error) {
    console.error("push unsubscribe error", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Does this user have any active subscription? ──
router.get("/status", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM push_subscriptions WHERE user_id = $1`,
      [req.user!.id]
    );
    res.json({ subscribed: (result.rows[0]?.count || 0) > 0, devices: result.rows[0]?.count || 0 });
  } catch (error) {
    console.error("push status error", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Send a test notification to the caller's own devices ──
router.post("/test", requireAuth, async (req, res) => {
  try {
    const result = await sendPushToUser(req.user!.id, {
      title: "NMD notifications are on",
      body: "This is a test. You'll get alerts like this for jobs, messages and quotes.",
      url: "/",
    });
    res.json({ sent: true, result });
  } catch (error) {
    console.error("push test error", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Admin: send an announcement to everyone, or to one role ──
router.post("/broadcast", requireAuth, requireRole("admin", "superadmin"), async (req, res) => {
  try {
    const { title, body, url, role } = req.body as {
      title?: string;
      body?: string;
      url?: string;
      role?: string;
    };

    if (!title?.trim()) return res.status(400).json({ error: "A title is required." });
    if (!body?.trim()) return res.status(400).json({ error: "A message is required." });

    const allowedRoles = ["admin", "superadmin", "employee", "client", "sales"];
    const useRole = role && role !== "all" ? role : null;
    if (useRole && !allowedRoles.includes(useRole)) {
      return res.status(400).json({ error: "Unknown role." });
    }

    // Only users who actually have a subscription are worth iterating.
    const recipients = await pool.query<{ user_id: string }>(
      useRole
        ? `SELECT DISTINCT ps.user_id
             FROM push_subscriptions ps
             JOIN users u ON u.id = ps.user_id
            WHERE u.role = $1`
        : `SELECT DISTINCT user_id FROM push_subscriptions`,
      useRole ? [useRole] : []
    );

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
      } catch {
        failed += 1;
      }
    }

    res.json({ recipients: recipients.rows.length, sent, failed });
  } catch (error) {
    console.error("push broadcast error", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;