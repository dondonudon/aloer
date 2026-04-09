"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { insertAuditLog, ownerAction, validateName } from "./action-utils";

export async function getSuppliers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

export async function createSupplier(formData: FormData) {
  const nameErr = validateName(formData.get("name"), "Supplier name");
  if (nameErr) return { error: nameErr };
  const name = (formData.get("name") as string).trim();

  return ownerAction(async (supabase, userId) => {
    const { data: supplier, error } = await supabase
      .from("suppliers")
      .insert({
        name,
        phone: (formData.get("phone") as string) || null,
        address: (formData.get("address") as string) || null,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    await insertAuditLog(
      supabase,
      userId,
      "CREATE_SUPPLIER",
      "suppliers",
      supplier.id,
    );
    revalidatePath("/purchases");
    revalidatePath("/catalog/suppliers");
    return {};
  });
}

export async function updateSupplier(id: string, formData: FormData) {
  const nameErr = validateName(formData.get("name"), "Supplier name");
  if (nameErr) return { error: nameErr };
  const name = (formData.get("name") as string).trim();

  return ownerAction(async (supabase, userId) => {
    const { error } = await supabase
      .from("suppliers")
      .update({
        name,
        phone: (formData.get("phone") as string) || null,
        address: (formData.get("address") as string) || null,
        is_active: formData.get("is_active") === "true",
      })
      .eq("id", id);
    if (error) return { error: error.message };
    await insertAuditLog(supabase, userId, "UPDATE_SUPPLIER", "suppliers", id);
    revalidatePath("/purchases");
    revalidatePath("/catalog/suppliers");
    return {};
  });
}
