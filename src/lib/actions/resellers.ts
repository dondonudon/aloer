"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { insertAuditLog, ownerAction, validateName } from "./action-utils";

/** Returns all resellers, active ones first then alphabetical. */
export async function getResellers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resellers")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

/** Returns only active resellers — used by the POS credit picker. */
export async function getActiveResellers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resellers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}

/** Creates a new reseller. Security: owner only. */
export async function createReseller(formData: FormData) {
  const nameErr = validateName(formData.get("name"), "Reseller name");
  if (nameErr) return { error: nameErr };
  const name = (formData.get("name") as string).trim();

  return ownerAction(async (supabase, userId) => {
    const { data: reseller, error } = await supabase
      .from("resellers")
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
      "CREATE_RESELLER",
      "resellers",
      reseller.id,
    );
    revalidatePath("/catalog/resellers");
    revalidatePath("/pos");
    return {};
  });
}

/** Updates a reseller. Security: owner only. */
export async function updateReseller(id: string, formData: FormData) {
  const nameErr = validateName(formData.get("name"), "Reseller name");
  if (nameErr) return { error: nameErr };
  const name = (formData.get("name") as string).trim();

  return ownerAction(async (supabase, userId) => {
    const { error } = await supabase
      .from("resellers")
      .update({
        name,
        phone: (formData.get("phone") as string) || null,
        address: (formData.get("address") as string) || null,
        is_active: formData.get("is_active") === "true",
      })
      .eq("id", id);
    if (error) return { error: error.message };
    await insertAuditLog(supabase, userId, "UPDATE_RESELLER", "resellers", id);
    revalidatePath("/catalog/resellers");
    revalidatePath("/pos");
    return {};
  });
}
