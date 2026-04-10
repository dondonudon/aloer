import { StoreSettingsForm } from "@/components/settings/store-settings-form";
import { UsersClient } from "@/components/settings/users-client";
import { RoutePagination } from "@/components/ui/route-pagination";
import { getStoreSettings } from "@/lib/actions/store-settings";
import { getUsers } from "@/lib/actions/users";
import { getCurrentUser } from "@/lib/auth";
import { getServerTranslations } from "@/lib/i18n/server";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.limit);
  const [t, storeSettings, users, currentUser] = await Promise.all([
    getServerTranslations(),
    getStoreSettings(),
    getUsers(),
    getCurrentUser(),
  ]);
  const { items, totalPages } = paginate(users, page, pageSize);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.settings.title}
      </h1>
      <StoreSettingsForm
        storeName={storeSettings.store_name}
        storeIconUrl={storeSettings.store_icon_url}
      />
      <UsersClient users={items} currentUserId={currentUser?.id ?? ""} />
      <RoutePagination
        pathname="/settings"
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
      />
    </div>
  );
}
