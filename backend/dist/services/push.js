import webpush from "web-push";
import { Pool } from "pg";
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false
        }
        : undefined
});
let configured = false;
function configureWebPush() {
    if (configured)
        return true;
    const publicKey = process.env.VAPID_PUBLIC_KEY || "";
    const privateKey = process.env.VAPID_PRIVATE_KEY || "";
    const subject = process.env.VAPID_SUBJECT || "mailto:nmdpowash@gmail.com";
    if (!publicKey || !privateKey) {
        console.warn("VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is not set. Push notification skipped.");
        return false;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    return true;
}
async function ensurePushTables() {
    await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    await pool.query(`
    CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
    ON push_subscriptions (user_id);
  `);
}
function rowToSubscription(row) {
    return {
        endpoint: row.endpoint,
        keys: {
            p256dh: row.p256dh,
            auth: row.auth
        }
    };
}
export async function savePushSubscription(input) {
    await ensurePushTables();
    const result = await pool.query(`
      INSERT INTO push_subscriptions (
        user_id,
        endpoint,
        p256dh,
        auth,
        updated_at
      )
      VALUES ($1,$2,$3,$4,NOW())
      ON CONFLICT (endpoint)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        updated_at = NOW()
      RETURNING *;
    `, [
        input.userId,
        input.subscription.endpoint,
        input.subscription.keys.p256dh,
        input.subscription.keys.auth
    ]);
    return result.rows[0];
}
export async function deletePushSubscription(endpoint) {
    await ensurePushTables();
    await pool.query(`
      DELETE FROM push_subscriptions
      WHERE endpoint = $1;
    `, [endpoint]);
    return {
        deleted: true
    };
}
export async function sendPushNotification(input) {
    const ready = configureWebPush();
    if (!ready) {
        return {
            skipped: true,
            reason: "VAPID keys are not configured."
        };
    }
    const payload = JSON.stringify({
        title: input.title,
        body: input.body,
        url: input.url || "/"
    });
    const result = await webpush.sendNotification(input.subscription, payload);
    return {
        skipped: false,
        result
    };
}
export async function sendChatNotification(input) {
    return sendPushNotification({
        subscription: input.subscription,
        title: `New message from ${input.senderName || "NMD"}`,
        body: input.message,
        url: input.url || "/"
    });
}
export async function sendPushToUser(userIdOrInput, payloadOrTitle, bodyArg, urlArg) {
    const input = typeof userIdOrInput === "string"
        ? typeof payloadOrTitle === "object" && payloadOrTitle !== null
            ? {
                userId: userIdOrInput,
                ...payloadOrTitle
            }
            : {
                userId: userIdOrInput,
                title: payloadOrTitle,
                body: bodyArg,
                url: urlArg
            }
        : userIdOrInput;
    const userId = input.userId || input.recipientUserId || "";
    if (!userId) {
        return {
            skipped: true,
            reason: "Missing userId for push notification."
        };
    }
    await ensurePushTables();
    const result = await pool.query(`
      SELECT *
      FROM push_subscriptions
      WHERE user_id = $1
      ORDER BY updated_at DESC;
    `, [userId]);
    if (result.rows.length === 0) {
        return {
            skipped: true,
            reason: "User has no push subscriptions.",
            sent: 0,
            failed: 0
        };
    }
    const title = input.title || "NMD Notification";
    const body = input.body || input.message || "You have a new NMD update.";
    const url = input.url || "/";
    let sent = 0;
    let failed = 0;
    for (const row of result.rows) {
        try {
            await sendPushNotification({
                subscription: rowToSubscription(row),
                title,
                body,
                url
            });
            sent += 1;
        }
        catch (err) {
            failed += 1;
            console.error("Failed to send push notification:", err);
            const statusCode = typeof err === "object" &&
                err !== null &&
                "statusCode" in err &&
                typeof err.statusCode === "number"
                ? err.statusCode
                : 0;
            if (statusCode === 404 || statusCode === 410) {
                await deletePushSubscription(row.endpoint);
            }
        }
    }
    return {
        skipped: false,
        sent,
        failed
    };
}
export default {
    savePushSubscription,
    deletePushSubscription,
    sendPushNotification,
    sendChatNotification,
    sendPushToUser
};
