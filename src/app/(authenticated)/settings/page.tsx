import { StoreSettingsForm } from "@/components/settings/store-settings-form";
import { UsersClient } from "@/components/settings/users-client";
import { getStoreSettings } from "@/lib/actions/store-settings";
import { getUsers } from "@/lib/actions/users";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const [storeSettings, users, currentUser] = await Promise.all([
    getStoreSettings(),
    getUsers(),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>
      <StoreSettingsForm
        storeName={storeSettings.store_name}
        storeIconUrl={storeSettings.store_icon_url}
      />
      <UsersClient users={users} currentUserId={currentUser?.id ?? ""} />
    </div>
  );
}
