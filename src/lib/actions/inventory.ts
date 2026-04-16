"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CreateAdjustmentInput, ReserveStockInput } from "@/lib/types";
import { formatDbError, insertAuditLog, ownerAction } from "./action-utils";

export async function getStockReport() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_stock_report");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function reserveStock(input: ReserveStockInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reserve_stock", {
    reservation_payload: input,
  });

  if (error) return { error: await formatDbError(error) };

  revalidatePath("/pos");
  revalidatePath("/inventory");
  revalidatePath("/reports");
  return { data };
}

export async function releaseStockReservations(reference: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("release_stock_reservations", {
    p_reference: reference,
  });

  if (error) return { error: await formatDbError(error) };

  revalidatePath("/pos");
  revalidatePath("/inventory");
  revalidatePath("/reports");
  return { data };
}

export async function getInventoryBatches(productId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("inventory_batches")
    .select("*, products(name, sku)")
    .gt("quantity_remaining", 0)
    .order("created_at", { ascending: true });

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createAdjustment(input: CreateAdjustmentInput) {
  return ownerAction(async (supabase, userId) => {
    const { data, error } = await supabase.rpc("create_inventory_adjustment", {
      adj_payload: input,
    });
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(
      supabase,
      userId,
      "CREATE_ADJUSTMENT",
      "inventory_adjustments",
    );
    revalidatePath("/inventory");
    revalidatePath("/reports");
    return { data };
  });
}

export async function getAdjustments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_adjustments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const adjustments = data ?? [];
  const userIds = [
    ...new Set(
      adjustments
        .map((a) => a.created_by)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const userNames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      userNames[p.id] = p.full_name;
    }
  }

  return adjustments.map((a) => ({
    ...a,
    created_by_name: a.created_by ? (userNames[a.created_by] ?? null) : null,
  }));
}
