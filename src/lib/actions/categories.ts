"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  formatDbError,
  insertAuditLog,
  ownerAction,
  validateName,
} from "./action-utils";

const getCachedActiveCategories = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("categories")
      .select("id, name, is_active, created_at")
      .eq("is_active", true)
      .order("name");

    if (error) throw new Error(error.message);
    return data;
  },
  ["active-categories"],
  { revalidate: 60, tags: ["active-categories"] },
);

/** Gets all categories, ordered by name. */
export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

/** Gets only active categories (for dropdowns). */
export async function getActiveCategories() {
  return getCachedActiveCategories();
}

/** Creates a new category. Owner only. */
export async function createCategory(formData: FormData) {
  const nameErr = validateName(formData.get("name"), "Category name", 50);
  if (nameErr) return { error: nameErr };
  const name = (formData.get("name") as string).trim();

  return ownerAction(async (supabase, userId) => {
    const { data: cat, error } = await supabase
      .from("categories")
      .insert({ name })
      .select("id")
      .single();
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(
      supabase,
      userId,
      "CREATE_CATEGORY",
      "categories",
      cat.id,
    );
    revalidatePath("/catalog/categories");
    revalidatePath("/products");
    revalidateTag("active-categories", { expire: 0 });
    return {};
  });
}

/** Updates a category. Owner only. */
export async function updateCategory(id: string, formData: FormData) {
  const nameErr = validateName(formData.get("name"), "Category name", 50);
  if (nameErr) return { error: nameErr };
  const name = (formData.get("name") as string).trim();
  const isActive = formData.get("is_active") === "true";

  return ownerAction(async (supabase, userId) => {
    const { error } = await supabase
      .from("categories")
      .update({ name, is_active: isActive })
      .eq("id", id);
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(supabase, userId, "UPDATE_CATEGORY", "categories", id);
    revalidatePath("/catalog/categories");
    revalidatePath("/products");
    revalidateTag("active-categories", { expire: 0 });
    return {};
  });
}
