"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formatDbError,
  insertAuditLog,
  ownerAction,
  validateName,
} from "./action-utils";

const getCachedSuppliers = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("suppliers")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data;
  },
  ["suppliers"],
  { revalidate: 60, tags: ["suppliers"] },
);

export async function getSuppliers() {
  return getCachedSuppliers();
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
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(
      supabase,
      userId,
      "CREATE_SUPPLIER",
      "suppliers",
      supplier.id,
    );
    revalidatePath("/purchases");
    revalidatePath("/catalog/suppliers");
    revalidateTag("suppliers", { expire: 0 });
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
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(supabase, userId, "UPDATE_SUPPLIER", "suppliers", id);
    revalidatePath("/purchases");
    revalidatePath("/catalog/suppliers");
    revalidateTag("suppliers", { expire: 0 });
    return {};
  });
}
