"use client";

import { X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "aloer-install-dismissed-at";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const at = Number(raw);
  if (!Number.isFinite(at)) return false;
  return Date.now() - at < DISMISS_TTL_MS;
}

function markDismissed() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

// Chrome's `beforeinstallprompt` event isn't in the standard DOM types yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "hidden" | "android" | "ios";

// Static mode is whatever we can determine on first render from synchronous
// browser APIs. `useSyncExternalStore` keeps it SSR-safe (server returns
// "hidden", client computes the real value during hydration without needing
// an effect+setState bounce).
const NOOP_SUBSCRIBE = () => () => {};

function getStaticMode(): Mode {
  if (typeof window === "undefined") return "hidden";
  if (isDismissed()) return "hidden";

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isStandalone) return "hidden";

  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return "ios";
  return "hidden";
}

export function InstallPrompt() {
  const staticMode = useSyncExternalStore(
    NOOP_SUBSCRIBE,
    getStaticMode,
    () => "hidden" as Mode,
  );
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [forceHidden, setForceHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onInstalled = () => {
      markDismissed();
      setForceHidden(true);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const mode: Mode = forceHidden
    ? "hidden"
    : event
      ? "android"
      : staticMode;

  function dismiss() {
    setForceHidden(true);
    markDismissed();
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setEvent(null);
    setForceHidden(true);
    markDismissed();
  }

  if (mode === "hidden") return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="h-4 w-4" />
      </button>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 pr-6">
        Install Aloer
      </h3>
      {mode === "ios" ? (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Tap <span className="font-semibold">Share</span> →{" "}
          <span className="font-semibold">Add to Home Screen</span> to install
          Aloer and unlock notifications.
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Get a faster, app-like experience and enable notifications.
          </p>
          <Button size="sm" onClick={install}>
            Install
          </Button>
        </>
      )}
    </div>
  );
}
