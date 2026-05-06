"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { urlBase64ToUint8Array } from "@/lib/push";

type Status = "unsupported" | "blocked" | "off" | "on" | "loading";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function NotificationsCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    if (typeof window === "undefined") return;
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("blocked");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setStatus(sub ? "on" : "off");
  }

  async function enable() {
    if (!PUBLIC_KEY) {
      setToast({ message: "VAPID public key not configured", type: "error" });
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      });

      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...json, userAgent: navigator.userAgent }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("on");
      setToast({ message: "Notifications enabled", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to enable",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
      setToast({ message: "Notifications disabled", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to disable",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setToast({
        message: "Test sent — watch for the notification",
        type: "success",
      });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Test failed",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Notifications
      </h2>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Get push notifications on this device. On iOS, install Aloer to your
          home screen first (Share → Add to Home Screen) — only the installed
          PWA can receive notifications.
        </p>

        <StatusLine status={status} />

        <div className="flex gap-2">
          {status === "on" ? (
            <>
              <Button
                variant="secondary"
                onClick={disable}
                loading={busy}
                disabled={busy}
              >
                Disable
              </Button>
              <Button onClick={sendTest} loading={busy} disabled={busy}>
                Send test
              </Button>
            </>
          ) : (
            <Button
              onClick={enable}
              loading={busy}
              disabled={
                busy || status === "unsupported" || status === "blocked"
              }
            >
              Enable notifications
            </Button>
          )}
        </div>
      </div>

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </section>
  );
}

function StatusLine({ status }: { status: Status }) {
  const map: Record<Status, { label: string; className: string }> = {
    loading: { label: "Checking…", className: "text-gray-500" },
    unsupported: {
      label: "Push notifications aren't supported in this browser.",
      className: "text-amber-600 dark:text-amber-400",
    },
    blocked: {
      label: "Notifications are blocked. Enable them in your browser settings.",
      className: "text-red-600 dark:text-red-400",
    },
    off: {
      label: "Disabled on this device.",
      className: "text-gray-600 dark:text-gray-400",
    },
    on: {
      label: "Enabled on this device.",
      className: "text-green-600 dark:text-green-400",
    },
  };
  const v = map[status];
  return <p className={`text-sm ${v.className}`}>{v.label}</p>;
}
