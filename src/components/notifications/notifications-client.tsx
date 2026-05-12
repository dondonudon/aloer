"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import type { Notification } from "@/lib/actions/notifications";
import { useI18n } from "@/lib/i18n/context";
import { formatDateTime } from "@/lib/utils";

interface Props {
  notifications: Notification[];
}

export function NotificationsClient({ notifications }: Props) {
  const { t } = useI18n();

  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(notifications.filter((n) => n.is_read).map((n) => n.id)),
  );

  const hasUnread = notifications.some((n) => !readIds.has(n.id));

  function handleRead(id: string) {
    if (readIds.has(id)) return;
    setReadIds((prev) => new Set(prev).add(id));
    void markNotificationRead(id);
  }

  function handleReadAll() {
    setReadIds(new Set(notifications.map((n) => n.id)));
    void markAllNotificationsRead();
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
        <Bell className="h-12 w-12 mb-4" aria-hidden="true" />
        <p className="text-base">{t.notifications.page.empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleReadAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t.notifications.page.markAllRead}
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {notifications.map((n) => (
          <NotificationRow
            key={n.id}
            notification={n}
            isRead={readIds.has(n.id)}
            onRead={handleRead}
          />
        ))}
      </ul>
    </div>
  );
}

function NotificationRow({
  notification: n,
  isRead,
  onRead,
}: {
  notification: Notification;
  isRead: boolean;
  onRead: (id: string) => void;
}) {
  return (
    <li
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
        isRead
          ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      }`}
    >
      <input
        type="checkbox"
        checked={isRead}
        onChange={() => onRead(n.id)}
        disabled={isRead}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 dark:border-gray-600 text-blue-600 cursor-pointer disabled:cursor-default"
        aria-label="Mark as read"
      />
      <div className="flex-1 min-w-0">
        {n.url ? (
          <Link
            href={n.url}
            className="text-sm font-medium text-gray-900 dark:text-white hover:underline"
          >
            {n.title}
          </Link>
        ) : (
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {n.title}
          </p>
        )}
        {n.body && (
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            {n.body}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {formatDateTime(n.created_at)}
        </p>
      </div>
    </li>
  );
}
