import { redirect } from "next/navigation";
import { AuthenticatedI18nProvider } from "@/components/ui/authenticated-i18n-provider";
import { AuthenticatedThemeProvider } from "@/components/ui/authenticated-theme-provider";
import { Sidebar } from "@/components/ui/sidebar";
import { StoreProvider } from "@/components/ui/store-context";
import { getStoreSettings } from "@/lib/actions/store-settings";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, storeSettings] = await Promise.all([
    getCurrentUser(),
    getStoreSettings(),
  ]);
  if (!user) redirect("/login");

  return (
    <AuthenticatedThemeProvider initialTheme={user.theme}>
      <AuthenticatedI18nProvider initialLocale={user.locale}>
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
          <Sidebar
            userRole={user.role}
            userName={user.name}
            storeName={storeSettings.store_name}
            storeIconUrl={storeSettings.store_icon_url}
          />
          {/* pt-14 clears the fixed mobile top bar; removed on lg+ where the bar is hidden */}
          <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
            <StoreProvider storeIconUrl={storeSettings.store_icon_url}>
              <div className="p-4 lg:p-8">{children}</div>
            </StoreProvider>
          </main>
        </div>
      </AuthenticatedI18nProvider>
    </AuthenticatedThemeProvider>
  );
}
