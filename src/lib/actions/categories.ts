"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ownerAction, validateName } from "./action-utils";

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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

/** Creates a new category. Owner only. */
export async function createCategory(formData: FormData) {
  const nameErr = validateName(formData.get("name"), "Category name", 50);
  if (nameErr) return { error: nameErr };
  const name = (formData.get("name") as string).trim();

  return ownerAction(async (supabase) => {
    const { error } = await supabase.from("categories").insert({ name });
    if (error) {
      if (error.code === "23505") return { error: "Category already exists" };
      return { error: error.message };
    }
    revalidatePath("/catalog/categories");
    revalidatePath("/products");
    return {};
  });
}

/** Updates a category. Owner only. */
export async function updateCategory(id: string, formData: FormData) {
  const nameErr = validateName(formData.get("name"), "Category name", 50);
  if (nameErr) return { error: nameErr };
  const name = (formData.get("name") as string).trim();
  const isActive = formData.get("is_active") === "true";

  return ownerAction(async (supabase) => {
    const { error } = await supabase
      .from("categories")
      .update({ name, is_active: isActive })
      .eq("id", id);
    if (error) {
      if (error.code === "23505") return { error: "Category already exists" };
      return { error: error.message };
    }
    revalidatePath("/catalog/categories");
    revalidatePath("/products");
    return {};
  });
}
