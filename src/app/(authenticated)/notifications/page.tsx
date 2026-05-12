import { Suspense } from "react";
import { NotificationsClient } from "@/components/notifications/notifications-client";
import { SkeletonTable } from "@/components/ui/loading-skeletons";
import { getNotifications } from "@/lib/actions/notifications";
import { getServerTranslations } from "@/lib/i18n/server";

async function NotificationsList() {
  const notifications = await getNotifications();
  return <NotificationsClient notifications={notifications} />;
}

export default async function NotificationsPage() {
  const t = await getServerTranslations();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.notifications.page.title}
      </h1>
      <Suspense fallback={<SkeletonTable rows={5} />}>
        <NotificationsList />
      </Suspense>
    </div>
  );
}
