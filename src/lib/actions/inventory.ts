"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateAdjustmentInput,
  ReserveStockInput,
  StockReportRow,
} from "@/lib/types";
import { formatDbError, insertAuditLog, ownerAction } from "./action-utils";

const getCachedStockReport = unstable_cache(
  async (): Promise<StockReportRow[]> => {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("get_stock_report");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["stock-report"],
  { revalidate: 30, tags: ["stock-report"] },
);

export async function getStockReport() {
  return getCachedStockReport();
}

export async function reserveStock(input: ReserveStockInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reserve_stock", {
    reservation_payload: input as unknown as Json,
  });

  if (error) return { error: await formatDbError(error) };

  revalidateTag("stock-report", { expire: 0 });
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

  revalidateTag("stock-report", { expire: 0 });
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

  const { data, error } = await query.limit(500);
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
    revalidateTag("stock-report", { expire: 0 });
    revalidatePath("/inventory");
    revalidatePath("/reports");
    return { data };
  });
}

export async function getAdjustments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_adjustments")
    .select("*, profiles!created_by(full_name)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  return (data ?? []).map((a) => {
    const { profiles: profile, ...rest } = a as typeof a & {
      profiles: { full_name: string } | null;
    };
    return {
      ...rest,
      created_by_name: profile?.full_name ?? null,
    };
  });
}
