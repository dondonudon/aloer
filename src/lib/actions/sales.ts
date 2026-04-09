"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CreateSaleInput } from "@/lib/types";
import { ownerAction, insertAuditLog } from "./action-utils";

export async function createSale(input: CreateSaleInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_sale_transaction", {
    sale_payload: input,
  });

  if (error) return { error: error.message };

  await insertAuditLog(supabase, user.id, "CREATE_SALE", "sales");
  revalidatePath("/pos");
  revalidatePath("/inventory");
  revalidatePath("/reports");
  revalidatePath("/sales");
  revalidatePath("/sales/history");
  return { data };
}

export async function getSales(options?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const limit = options?.limit ?? 20;
  const page = Math.max(1, options?.page ?? 1);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("sales")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options?.search) {
    query = query.ilike("invoice_number", `%${options.search}%`);
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.startDate) {
    query = query.gte("created_at", `${options.startDate}T00:00:00`);
  }
  if (options?.endDate) {
    query = query.lte("created_at", `${options.endDate}T23:59:59`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: data ?? [], count: count ?? 0 };
}

export async function getSaleWithItems(saleId: string) {
  const supabase = await createClient();

  const [saleResult, itemsResult] = await Promise.all([
    supabase
      .from("sales")
      .select("*, resellers(name)")
      .eq("id", saleId)
      .single(),
    supabase
      .from("sale_items")
      .select("*, products(name, sku)")
      .eq("sale_id", saleId),
  ]);

  if (saleResult.error) throw new Error(saleResult.error.message);
  if (itemsResult.error) throw new Error(itemsResult.error.message);

  const sale = saleResult.data;
  const userIds = [sale.created_by, sale.voided_by].filter((id): id is string =>
    Boolean(id),
  );
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

  return {
    sale: {
      ...sale,
      created_by_name: sale.created_by
        ? (userNames[sale.created_by] ?? null)
        : null,
      voided_by_name: sale.voided_by
        ? (userNames[sale.voided_by] ?? null)
        : null,
    },
    items: itemsResult.data,
  };
}

export async function voidSale(saleId: string, reason: string) {
  return ownerAction(async (supabase, userId) => {
    const { data, error } = await supabase.rpc("void_sale", {
      p_sale_id: saleId,
      p_reason: reason,
    });
    if (error) return { error: error.message };
    await insertAuditLog(supabase, userId, "VOID_SALE", "sales", saleId, { reason });
    revalidatePath("/pos");
    revalidatePath("/inventory");
    revalidatePath("/reports");
    revalidatePath("/sales");
    revalidatePath("/sales/history");
    return { data };
  });
}
