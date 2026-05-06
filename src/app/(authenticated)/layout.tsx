import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthenticatedI18nProvider } from "@/components/ui/authenticated-i18n-provider";
import { AuthenticatedThemeProvider } from "@/components/ui/authenticated-theme-provider";
import { Sidebar } from "@/components/ui/sidebar";
import { SidebarSkeleton } from "@/components/ui/sidebar-skeleton";
import { StoreProvider } from "@/components/ui/store-context";
import { getStoreSettings } from "@/lib/actions/store-settings";
import { getCurrentUser } from "@/lib/auth";

type UserPromise = ReturnType<typeof getCurrentUser>;
type StoreSettingsPromise = ReturnType<typeof getStoreSettings>;

async function StreamedSidebar({
  userPromise,
  storeSettingsPromise,
}: {
  userPromise: UserPromise;
  storeSettingsPromise: StoreSettingsPromise;
}) {
  const [user, storeSettings] = await Promise.all([
    userPromise,
    storeSettingsPromise,
  ]);
  if (!user) redirect("/login");

  return (
    <Sidebar
      userRole={user.role}
      userName={user.name}
      storeName={storeSettings.store_name}
      storeIconUrl={storeSettings.store_icon_url}
    />
  );
}

async function StreamedMain({
  children,
  userPromise,
  storeSettingsPromise,
}: {
  children: React.ReactNode;
  userPromise: UserPromise;
  storeSettingsPromise: StoreSettingsPromise;
}) {
  const [user, storeSettings] = await Promise.all([
    userPromise,
    storeSettingsPromise,
  ]);
  if (!user) redirect("/login");

  return (
    <AuthenticatedThemeProvider initialTheme={user.theme}>
      <AuthenticatedI18nProvider initialLocale={user.locale}>
        <StoreProvider storeIconUrl={storeSettings.store_icon_url}>
          <div className="p-4 lg:p-8">{children}</div>
        </StoreProvider>
      </AuthenticatedI18nProvider>
    </AuthenticatedThemeProvider>
  );
}

// Match the page-level <div className="p-4 lg:p-8"> spacing so the skeleton
// occupies the same box as real content — no shift when StreamedMain swaps in.
function MainFallback() {
  return (
    <div className="p-4 lg:p-8 space-y-4">
      <div className="h-7 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Kick off both fetches without awaiting — getCurrentUser is React-cached so
  // the same promise is reused by getServerTranslations() and any page-level
  // call. The shell HTML flushes immediately; both Suspense boundaries below
  // resolve in parallel with the page's own data fetches.
  const userPromise = getCurrentUser();
  const storeSettingsPromise = getStoreSettings();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<SidebarSkeleton />}>
        <StreamedSidebar
          userPromise={userPromise}
          storeSettingsPromise={storeSettingsPromise}
        />
      </Suspense>
      {/* pt-14 clears the fixed mobile top bar; removed on lg+ where the bar is hidden */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <Suspense fallback={<MainFallback />}>
          <StreamedMain
            userPromise={userPromise}
            storeSettingsPromise={storeSettingsPromise}
          >
            {children}
          </StreamedMain>
        </Suspense>
      </main>
    </div>
  );
}
