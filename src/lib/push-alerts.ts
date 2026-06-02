import webpush from "web-push";
import { db } from "@/lib/db";
import { getWorkspaceOwnerUserIds, hasDatabase } from "@/lib/workspace";

type PushPayload = {
  workspaceId: string;
  title: string;
  body: string;
  url?: string;
};

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    console.warn("Push skipped: VAPID keys missing.");
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushToWorkspaceOwners(payload: PushPayload) {
  if (!hasDatabase()) return { sent: false, reason: "missing_database" };

  const configured = configureWebPush();
  if (!configured) return { sent: false, reason: "missing_vapid_keys" };

  const ownerUserIds = await getWorkspaceOwnerUserIds(payload.workspaceId);

  if (ownerUserIds.length === 0) {
    return { sent: false, reason: "no_owner_users" };
  }

  const subscriptions = await (db as any).pushSubscription.findMany({
    where: {
      workspaceId: payload.workspaceId,
      userId: { in: ownerUserIds },
    },
  });

  if (subscriptions.length === 0) {
    return { sent: false, reason: "no_push_subscriptions" };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/dashboard",
  });

  await Promise.all(
    subscriptions.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload,
        );
      } catch (error: any) {
        const statusCode = error?.statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await (db as any).pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => null);
        } else {
          console.error("Push send failed:", error);
        }
      }
    }),
  );

  return { sent: true, subscriptions: subscriptions.length };
}