"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { updateStoreSettings } from "@/lib/actions/store-settings";
import { useI18n } from "@/lib/i18n/context";

interface StoreSettingsFormProps {
  storeName: string;
  storeIconUrl: string | null;
}

/**
 * Form to update store name and icon URL. Owner only.
 */
export function StoreSettingsForm({
  storeName: initialName,
  storeIconUrl: initialIconUrl,
}: StoreSettingsFormProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [iconUrl, setIconUrl] = useState(initialIconUrl ?? "");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await updateStoreSettings(formData);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: t.settings.storeSettingsUpdated, type: "success" });
    }
    setLoading(false);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        {t.settings.storeSettings}
      </h2>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <form action={handleSubmit} className="space-y-4 max-w-md">
          <Input
            label={t.settings.storeName}
            name="storeName"
            defaultValue={initialName}
            required
            maxLength={100}
            placeholder={t.settings.storeNamePlaceholder}
          />
          <ImageUpload
            label={t.settings.storeIcon}
            value={iconUrl}
            onChange={setIconUrl}
            folder="store"
          />
          <input type="hidden" name="storeIconUrl" value={iconUrl} />
          <Button type="submit" disabled={loading}>
            {loading ? t.common.saving : t.settings.saveSettings}
          </Button>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
