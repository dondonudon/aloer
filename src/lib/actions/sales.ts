"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateSaleInput,
  CreateSaleReturnInput,
  SaleReturn,
  SaleReturnItem,
} from "@/lib/types";
import { formatDbError, insertAuditLog, ownerAction } from "./action-utils";

export async function createSale(input: CreateSaleInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_sale_transaction", {
    sale_payload: input,
  });

  if (error) return { error: await formatDbError(error) };

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
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(supabase, userId, "VOID_SALE", "sales", saleId, {
      reason,
    });
    revalidatePath("/pos");
    revalidatePath("/inventory");
    revalidatePath("/reports");
    revalidatePath("/sales");
    revalidatePath("/sales/history");
    return { data };
  });
}

export async function createSaleReturn(input: CreateSaleReturnInput) {
  return ownerAction(async (supabase, userId) => {
    const { data, error } = await supabase.rpc("create_sale_return", {
      p_payload: input,
    });
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(
      supabase,
      userId,
      "CREATE_SALE_RETURN",
      "sale_returns",
      input.sale_id,
      {
        return_id: (data as { return_id: string }).return_id,
      },
    );
    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/reports");
    return {
      data: data as {
        return_id: string;
        return_number: string;
        total_refund: number;
      },
    };
  });
}

export async function getSaleReturns(saleId: string): Promise<{
  returns: (SaleReturn & { items: SaleReturnItem[] })[];
}> {
  const supabase = await createClient();

  const { data: returnsData, error: returnsError } = await supabase
    .from("sale_returns")
    .select("*")
    .eq("sale_id", saleId)
    .order("created_at", { ascending: true });

  if (returnsError) throw new Error(returnsError.message);
  if (!returnsData || returnsData.length === 0) return { returns: [] };

  const returnIds = returnsData.map((r) => r.id);

  const [itemsResult, profilesResult] = await Promise.all([
    supabase
      .from("sale_return_items")
      .select("*, products(name, sku)")
      .in("return_id", returnIds),
    supabase
      .from("profiles")
      .select("id, full_name")
      .in(
        "id",
        returnsData
          .map((r) => r.created_by)
          .filter((id): id is string => Boolean(id)),
      ),
  ]);

  if (itemsResult.error) throw new Error(itemsResult.error.message);

  const userNames: Record<string, string> = {};
  for (const p of profilesResult.data ?? []) {
    userNames[p.id] = p.full_name;
  }

  const itemsByReturn: Record<string, SaleReturnItem[]> = {};
  for (const item of itemsResult.data ?? []) {
    if (!itemsByReturn[item.return_id]) itemsByReturn[item.return_id] = [];
    itemsByReturn[item.return_id].push(item as SaleReturnItem);
  }

  return {
    returns: returnsData.map((r) => ({
      ...r,
      created_by_name: r.created_by ? (userNames[r.created_by] ?? null) : null,
      items: itemsByReturn[r.id] ?? [],
    })),
  };
}
