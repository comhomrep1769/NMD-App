import webpush from "web-push";

type PushSubscriptionLike = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type SendPushInput = {
  subscription: PushSubscriptionLike;
  title: string;
  body: string;
  url?: string;
};

let configured = false;

function configureWebPush() {
  if (configured) return true;

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

export async function sendPushNotification(input: SendPushInput) {
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

export async function sendChatNotification(input: {
  subscription: PushSubscriptionLike;
  senderName: string;
  message: string;
  url?: string;
}) {
  return sendPushNotification({
    subscription: input.subscription,
    title: `New message from ${input.senderName || "NMD"}`,
    body: input.message,
    url: input.url || "/"
  });
}

export default {
  sendPushNotification,
  sendChatNotification
};
