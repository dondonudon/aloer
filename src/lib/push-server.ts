import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;
function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys missing — set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

interface SendResult {
  sent: number;
  removed: number;
  failed: number;
}

// Sends `payload` to every push_subscription belonging to `userId`.
// Subscriptions that return 404/410 are stale (user revoked or browser
// dropped them) — we delete those so the table doesn't accumulate dead rows.
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<SendResult> {
  configure();
  const admin = createAdminClient();

  const { data: subsRaw, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);
  const subs = subsRaw as unknown as
    | { endpoint: string; p256dh: string; auth: string }[]
    | null;

  if (error) throw error;
  if (!subs || subs.length === 0) {
    return { sent: 0, removed: 0, failed: 0 };
  }

  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;
  let failed = 0;
  const stale: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          stale.push(s.endpoint);
        } else {
          failed++;
        }
      }
    }),
  );

  if (stale.length > 0) {
    const { error: delErr } = await admin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", stale);
    if (!delErr) removed = stale.length;
  }

  return { sent, removed, failed };
}
