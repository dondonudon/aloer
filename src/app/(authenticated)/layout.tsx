import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthenticatedI18nProvider } from "@/components/ui/authenticated-i18n-provider";
import { AuthenticatedThemeProvider } from "@/components/ui/authenticated-theme-provider";
import { Sidebar } from "@/components/ui/sidebar";
import { SidebarSkeleton } from "@/components/ui/sidebar-skeleton";
import { StoreProvider } from "@/components/ui/store-context";
import { getUnreadNotificationsCount } from "@/lib/actions/notifications";
import { getStoreSettings } from "@/lib/actions/store-settings";
import { getCurrentUser } from "@/lib/auth";

type UserPromise = ReturnType<typeof getCurrentUser>;
type StoreSettingsPromise = ReturnType<typeof getStoreSettings>;
type UnreadCountPromise = ReturnType<typeof getUnreadNotificationsCount>;

// Both sidebar and main content are wrapped in the same providers so that
// the sidebar's setLocale has access to onSave={saveLocale}. Previously the
// sidebar lived outside AuthenticatedI18nProvider, which meant locale changes
// from the sidebar never called saveLocale and were lost on page refresh.
async function AuthenticatedShell({
  children,
  userPromise,
  storeSettingsPromise,
  unreadCountPromise,
}: {
  children: React.ReactNode;
  userPromise: UserPromise;
  storeSettingsPromise: StoreSettingsPromise;
  unreadCountPromise: UnreadCountPromise;
}) {
  const [user, storeSettings, unreadNotifications] = await Promise.all([
    userPromise,
    storeSettingsPromise,
    unreadCountPromise,
  ]);
  if (!user) redirect("/login");

  return (
    <AuthenticatedThemeProvider initialTheme={user.theme}>
      <AuthenticatedI18nProvider initialLocale={user.locale}>
        <StoreProvider storeIconUrl={storeSettings.store_icon_url}>
          <Sidebar
            userRole={user.role}
            userName={user.name}
            storeName={storeSettings.store_name}
            storeIconUrl={storeSettings.store_icon_url}
            unreadNotifications={unreadNotifications}
          />
          {/* pt-14 clears the fixed mobile top bar; removed on xl+ where the bar is hidden */}
          <main className="flex-1 overflow-y-auto pt-14 xl:pt-0">
            <div className="p-4 xl:p-8">{children}</div>
          </main>
        </StoreProvider>
      </AuthenticatedI18nProvider>
    </AuthenticatedThemeProvider>
  );
}

function ShellFallback() {
  return (
    <>
      <SidebarSkeleton />
      <main className="flex-1 overflow-y-auto pt-14 xl:pt-0">
        <div className="p-4 xl:p-8 space-y-4">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </main>
    </>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Kick off all fetches without awaiting — getCurrentUser is React-cached so
  // the same promise is reused by getServerTranslations() and any page-level
  // call. The shell HTML flushes immediately; the Suspense boundary below
  // resolves once auth + store settings + unread count are ready.
  const userPromise = getCurrentUser();
  const storeSettingsPromise = getStoreSettings();
  const unreadCountPromise = getUnreadNotificationsCount().catch(() => 0);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<ShellFallback />}>
        <AuthenticatedShell
          userPromise={userPromise}
          storeSettingsPromise={storeSettingsPromise}
          unreadCountPromise={unreadCountPromise}
        >
          {children}
        </AuthenticatedShell>
      </Suspense>
    </div>
  );
}
