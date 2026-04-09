"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { updateStoreSettings } from "@/lib/actions/store-settings";

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
      setToast({ message: "Store settings updated!", type: "success" });
    }
    setLoading(false);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Store Settings
      </h2>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <form action={handleSubmit} className="space-y-4 max-w-md">
          <Input
            label="Store Name"
            name="storeName"
            defaultValue={initialName}
            required
            maxLength={100}
            placeholder="e.g. Toko Sejahtera"
          />
          <ImageUpload
            label="Store Icon"
            value={iconUrl}
            onChange={setIconUrl}
            folder="store"
          />
          <input type="hidden" name="storeIconUrl" value={iconUrl} />
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
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
