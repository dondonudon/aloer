"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CampaignWithProducts } from "@/lib/types";
import { insertAuditLog, ownerAction } from "./action-utils";

const getCachedActiveCampaigns = unstable_cache(
  async (): Promise<CampaignWithProducts[]> => {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("campaigns")
      .select("*, campaign_products(*)")
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now);

    if (error) throw new Error(error.message);
    return (data ?? []) as CampaignWithProducts[];
  },
  ["active-campaigns"],
  { revalidate: 60, tags: ["active-campaigns"] },
);

/**
 * Parses the shared campaign form fields used by both create and update.
 */
function parseCampaignForm(formData: FormData) {
  const name = formData.get("name") as string;
  const discountType = formData.get("discount_type") as string;
  const discountValue = parseFloat(formData.get("discount_value") as string);
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const triggerType = (formData.get("trigger_type") as string) || "always";
  const triggerValueRaw = formData.get("trigger_value") as string | null;
  const triggerValue =
    triggerValueRaw && triggerValueRaw !== ""
      ? parseFloat(triggerValueRaw)
      : null;
  const productIds = JSON.parse(
    (formData.get("product_ids") as string) || "[]",
  ) as string[];
  const minQuantities = JSON.parse(
    (formData.get("min_quantities") as string) || "{}",
  ) as Record<string, number>;

  return {
    name,
    discountType,
    discountValue,
    startDate,
    endDate,
    triggerType,
    triggerValue,
    productIds,
    minQuantities,
  };
}

function validateCampaignForm(
  fields: ReturnType<typeof parseCampaignForm>,
): string | null {
  const {
    name,
    discountType,
    discountValue,
    startDate,
    endDate,
    triggerType,
    triggerValue,
  } = fields;
  if (!name || !discountType || !discountValue || !startDate || !endDate)
    return "All fields are required";
  if (
    discountType === "percentage" &&
    (discountValue <= 0 || discountValue > 100)
  )
    return "Percentage discount must be between 1 and 100";
  if (new Date(endDate) <= new Date(startDate))
    return "End date must be after start date";
  if (triggerType === "min_cart_total" && (!triggerValue || triggerValue <= 0))
    return "Minimum cart total must be greater than 0";
  return null;
}

/**
 * Gets all campaigns with their associated product IDs.
 */
export async function getCampaigns(): Promise<CampaignWithProducts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, campaign_products(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CampaignWithProducts[];
}

/**
 * Gets currently active campaigns (within date range and is_active).
 */
export async function getActiveCampaigns(): Promise<CampaignWithProducts[]> {
  return getCachedActiveCampaigns();
}

/** Creates a new campaign. Owner only. */
export async function createCampaign(formData: FormData) {
  const fields = parseCampaignForm(formData);
  const validationError = validateCampaignForm(fields);
  if (validationError) return { error: validationError };

  const {
    name,
    discountType,
    discountValue,
    startDate,
    endDate,
    triggerType,
    triggerValue,
    productIds,
    minQuantities,
  } = fields;

  // Need user.id for created_by
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  return ownerAction(async (supabase) => {
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        name,
        discount_type: discountType,
        discount_value: discountValue,
        start_date: startDate,
        end_date: endDate,
        trigger_type: triggerType,
        trigger_value: triggerValue,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) return { error: error.message };

    if (productIds.length > 0) {
      const { error: cpError } = await supabase
        .from("campaign_products")
        .insert(
          productIds.map((pid) => ({
            campaign_id: campaign.id,
            product_id: pid,
            min_quantity: minQuantities[pid] ?? 1,
          })),
        );
      if (cpError) return { error: cpError.message };
    }

    revalidatePath("/catalog/campaigns");
    revalidatePath("/pos");
    revalidateTag("active-campaigns", { expire: 0 });
    await insertAuditLog(
      supabase,
      user.id,
      "CREATE_CAMPAIGN",
      "campaigns",
      campaign.id,
    );
    return {};
  });
}

/** Updates an existing campaign. Owner only. Replaces campaign_products entirely on each save. */
export async function updateCampaign(campaignId: string, formData: FormData) {
  const fields = parseCampaignForm(formData);
  const validationError = validateCampaignForm(fields);
  if (validationError) return { error: validationError };

  const {
    name,
    discountType,
    discountValue,
    startDate,
    endDate,
    triggerType,
    triggerValue,
    productIds,
    minQuantities,
  } = fields;

  return ownerAction(async (supabase, userId) => {
    const { error } = await supabase
      .from("campaigns")
      .update({
        name,
        discount_type: discountType,
        discount_value: discountValue,
        start_date: startDate,
        end_date: endDate,
        trigger_type: triggerType,
        trigger_value: triggerValue,
      })
      .eq("id", campaignId);
    if (error) return { error: error.message };

    const { error: deleteError } = await supabase
      .from("campaign_products")
      .delete()
      .eq("campaign_id", campaignId);
    if (deleteError) return { error: deleteError.message };

    if (productIds.length > 0) {
      const { error: cpError } = await supabase
        .from("campaign_products")
        .insert(
          productIds.map((pid) => ({
            campaign_id: campaignId,
            product_id: pid,
            min_quantity: minQuantities[pid] ?? 1,
          })),
        );
      if (cpError) return { error: cpError.message };
    }

    await insertAuditLog(
      supabase,
      userId,
      "UPDATE_CAMPAIGN",
      "campaigns",
      campaignId,
    );
    revalidatePath("/catalog/campaigns");
    revalidatePath("/pos");
    revalidateTag("active-campaigns", { expire: 0 });
    return {};
  });
}

/** Toggles a campaign's is_active status. Owner only. */
export async function toggleCampaign(campaignId: string, isActive: boolean) {
  return ownerAction(async (supabase) => {
    const { error } = await supabase
      .from("campaigns")
      .update({ is_active: isActive })
      .eq("id", campaignId);
    if (error) return { error: error.message };
    revalidatePath("/catalog/campaigns");
    revalidatePath("/pos");
    revalidateTag("active-campaigns", { expire: 0 });
    return {};
  });
}

/** Deletes a campaign. Owner only. */
export async function deleteCampaign(campaignId: string) {
  return ownerAction(async (supabase, userId) => {
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId);
    if (error) return { error: error.message };
    await insertAuditLog(
      supabase,
      userId,
      "DELETE_CAMPAIGN",
      "campaigns",
      campaignId,
    );
    revalidatePath("/catalog/campaigns");
    revalidatePath("/pos");
    revalidateTag("active-campaigns", { expire: 0 });
    return {};
  });
}
