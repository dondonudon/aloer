"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ownerAction, validateName } from "./action-utils";

export interface StoreSettings {
  id: string;
  store_name: string;
  store_icon_url: string | null;
  updated_at: string;
}

// Cached store settings — TTL 60s so every layout render doesn't pay a DB
// roundtrip. Uses admin client to avoid request-scoped cookie dependency.
// Revalidated by tag whenever updateStoreSettings is called.
const _getCachedStoreSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("store_settings")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) {
      return {
        id: "",
        store_name: "My Store",
        store_icon_url: null,
        updated_at: new Date().toISOString(),
      };
    }
    return data as StoreSettings;
  },
  ["store-settings"],
  { revalidate: 60, tags: ["store-settings"] },
);

/** Gets the store settings (single row). Served from cache after first load. */
export async function getStoreSettings(): Promise<StoreSettings> {
  return _getCachedStoreSettings();
}

/** Updates the store name and optional icon URL. Owner only. */
export async function updateStoreSettings(formData: FormData) {
  const nameErr = validateName(formData.get("storeName"), "Store name", 100);
  if (nameErr) return { error: nameErr };
  const storeName = (formData.get("storeName") as string).trim();
  const storeIconUrl = (formData.get("storeIconUrl") as string) || null;

  return ownerAction(async (supabase) => {
    // store_settings is a single-row table; fetch the id before updating
    const { data: existing, error: fetchError } = await supabase
      .from("store_settings")
      .select("id")
      .limit(1)
      .single();

    if (fetchError || !existing) return { error: "Store settings not found" };

    const { error } = await supabase
      .from("store_settings")
      .update({
        store_name: storeName,
        store_icon_url: storeIconUrl?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    revalidateTag("store-settings", { expire: 0 });
    revalidatePath("/", "layout");
    return {};
  });
}
