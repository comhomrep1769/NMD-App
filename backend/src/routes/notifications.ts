import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  sendPushToUser,
  sendPushNotification,
  savePushSubscription,
  deletePushSubscription,
  ensurePushTables,
  listAllSubscriptions,
  listSubscriptionsByRole,
  subscriptionFromRow,
} from "../services/push.js";

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

// Public endpoints are unauthenticated, so they are rate limited to stop a
// script filling the table with junk rows.
const publicSubscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public: a visitor who installed the app without an account ──
// Stored with user_id NULL. If they later sign in, the authenticated
// /subscribe upserts on the same endpoint and claims the row for them.
router.post("/subscribe-public", publicSubscribeLimiter, async (req, res) => {
  try {
    const { endpoint, keys } = req.body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Invalid push subscription" });
    }

    await savePushSubscription({
      userId: null,
      subscription: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
    });

    res.json({ saved: true });
  } catch (error) {
    console.error("public push subscribe error", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Server error",
    });
  }
});

// ── Public: stop notifications without needing an account ──
router.post("/unsubscribe-public", publicSubscribeLimiter, async (req, res) => {
  try {
    const { endpoint } = req.body as { endpoint?: string };
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });
    await deletePushSubscription(endpoint);
    res.json({ removed: true });
  } catch (error) {
    console.error("public push unsubscribe error", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Public: is this browser already registered? ──
router.get("/status-public", async (req, res) => {
  try {
    await ensurePushTables();
    const endpoint = String(req.query.endpoint || "");
    if (!endpoint) return res.json({ subscribed: false });
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM push_subscriptions WHERE endpoint = $1`,
      [endpoint]
    );
    res.json({ subscribed: (result.rows[0]?.count || 0) > 0 });
  } catch (error) {
    console.error("public push status error", error);
    res.status(500).json({ error: "Server error" });
  }
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

    await savePushSubscription({
      userId: req.user!.id,
      subscription: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
    });

    res.json({ saved: true });
  } catch (error) {
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
    const { endpoint } = req.body as { endpoint?: string };
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });

    await deletePushSubscription(endpoint);

    res.json({ removed: true });
  } catch (error) {
    console.error("push unsubscribe error", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Does this user have any active subscription? ──
router.get("/status", requireAuth, async (req, res) => {
  try {
    await ensurePushTables();
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
    await ensurePushTables();

    // A browser can hold a subscription the server never stored. Say so
    // plainly instead of reporting a send that had no recipients.
    const existing = await pool.query(
      `SELECT COUNT(*)::int AS count FROM push_subscriptions WHERE user_id = $1`,
      [req.user!.id]
    );
    if ((existing.rows[0]?.count || 0) === 0) {
      return res.status(400).json({
        error:
          "This device isn't registered on the server. Turn notifications off and on again.",
      });
    }

    const result = await sendPushToUser(req.user!.id, {
      title: "NMD notifications are on",
      body: "This is a test. You'll get alerts like this for jobs, messages and quotes.",
      url: "/",
    });
    res.json({ sent: true, result });
  } catch (error) {
    console.error("push test error", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Server error",
    });
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

    await ensurePushTables();

    // "all" reaches everyone with the app installed, including visitors who
    // never created an account. "visitors" is those anonymous installs only.
    const audience = role || "all";
    const roleAudiences = ["admin", "superadmin", "employee", "client", "sales"];

    let rows;
    if (audience === "all") {
      rows = await listAllSubscriptions("all");
    } else if (audience === "accounts") {
      rows = await listAllSubscriptions("users");
    } else if (audience === "visitors") {
      rows = await listAllSubscriptions("visitors");
    } else if (roleAudiences.includes(audience)) {
      rows = await listSubscriptionsByRole(audience);
    } else {
      return res.status(400).json({ error: "Unknown audience." });
    }

    // Sent per subscription rather than per user, so anonymous rows with no
    // user_id are reachable too.
    let sent = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        const result = await sendPushNotification({
          subscription: subscriptionFromRow(row),
          title: title.trim(),
          body: body.trim(),
          url: url?.trim() || "/",
        });
        if ((result as { skipped?: boolean })?.skipped) failed += 1;
        else sent += 1;
      } catch {
        failed += 1;
      }
    }

    res.json({ recipients: rows.length, sent, failed });
  } catch (error) {
    console.error("push broadcast error", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Server error",
    });
  }
});

export default router;