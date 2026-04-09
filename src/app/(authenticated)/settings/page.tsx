import { StoreSettingsForm } from "@/components/settings/store-settings-form";
import { UsersClient } from "@/components/settings/users-client";
import { getStoreSettings } from "@/lib/actions/store-settings";
import { getUsers } from "@/lib/actions/users";
import { getCurrentUser } from "@/lib/auth";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const [t, storeSettings, users, currentUser] = await Promise.all([
    getServerTranslations(),
    getStoreSettings(),
    getUsers(),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.settings.title}
      </h1>
      <StoreSettingsForm
        storeName={storeSettings.store_name}
        storeIconUrl={storeSettings.store_icon_url}
      />
      <UsersClient users={users} currentUserId={currentUser?.id ?? ""} />
    </div>
  );
}
