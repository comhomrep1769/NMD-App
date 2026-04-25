import webpush from "web-push";
import { pool } from "../db.js";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:nmdpowash@gmail.com";

const pushConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (pushConfigured) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey as string,
    vapidPrivateKey as string
  );
} else {
  console.warn("Push notifications disabled: missing VAPID keys.");
}

export async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
  }
) {
  if (!pushConfigured) {
    console.warn("Push skipped: VAPID keys are not configured.");
    return;
  }

  const result = await pool.query(
    `
    SELECT id, endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE user_id = $1
    `,
    [userId]
  );

  for (const row of result.rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth
          }
        },
        JSON.stringify(payload)
      );
    } catch (error: any) {
      console.error("push send error", error);

      if (error.statusCode === 404 || error.statusCode === 410) {
        await pool.query(
          `DELETE FROM push_subscriptions WHERE id = $1`,
          [row.id]
        );
      }
    }
  }
}
