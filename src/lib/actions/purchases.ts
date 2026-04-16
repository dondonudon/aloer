"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { POPaymentMethod } from "@/lib/types";
import { formatDbError, insertAuditLog, ownerAction } from "./action-utils";

export async function getPurchaseOrders(options?: {
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
    .from("purchase_orders")
    .select("*, suppliers(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options?.search) {
    query = query.ilike("po_number", `%${options.search}%`);
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

export async function getPurchaseOrderWithItems(poId: string) {
  const supabase = await createClient();

  const [poResult, itemsResult] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("*, suppliers(name)")
      .eq("id", poId)
      .single(),
    supabase
      .from("purchase_order_items")
      .select("*, products(name, sku)")
      .eq("purchase_order_id", poId),
  ]);

  if (poResult.error) throw new Error(poResult.error.message);
  if (itemsResult.error) throw new Error(itemsResult.error.message);

  const po = poResult.data;
  let created_by_name: string | null = null;
  if (po.created_by) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", po.created_by)
      .limit(1);
    created_by_name = profiles?.[0]?.full_name ?? null;
  }

  return { po: { ...po, created_by_name }, items: itemsResult.data };
}

export async function createPurchaseOrder(formData: FormData) {
  // Need user.id for created_by — resolve before entering ownerAction
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  return ownerAction(async (supabase) => {
    const poNumber =
      "PO-" +
      new Date().toISOString().slice(0, 10).replace(/-/g, "") +
      "-" +
      crypto.randomUUID().slice(0, 8).toUpperCase();

    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        po_number: poNumber,
        supplier_id: (formData.get("supplier_id") as string) || null,
        payment_method: formData.get("payment_method") as POPaymentMethod,
        notes: (formData.get("notes") as string) || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (poError) return { error: await formatDbError(poError) };

    let items: Array<{
      product_id: string;
      quantity: number;
      cost_price: number;
      expiry_date?: string;
    }>;
    try {
      const parsed: unknown = JSON.parse(formData.get("items") as string);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { error: "Purchase order must contain at least one item" };
      }
      for (const item of parsed) {
        if (!item || typeof item.product_id !== "string" || !item.product_id) {
          return { error: "Each item must have a valid product" };
        }
        if (
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isInteger(item.quantity)
        ) {
          return { error: "Each item quantity must be a positive integer" };
        }
        if (!Number.isFinite(item.cost_price) || item.cost_price < 0) {
          return {
            error: "Each item cost price must be a non-negative number",
          };
        }
      }
      items = parsed as typeof items;
    } catch {
      return { error: "Invalid items data" };
    }

    const poItems = items.map((item) => ({
      purchase_order_id: po.id,
      product_id: item.product_id,
      quantity: item.quantity,
      cost_price: item.cost_price,
      expiry_date: item.expiry_date || null,
      subtotal: item.quantity * item.cost_price,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(poItems);

    if (itemsError) return { error: await formatDbError(itemsError) };

    await insertAuditLog(
      supabase,
      user.id,
      "CREATE_PURCHASE_ORDER",
      "purchase_orders",
      po.id,
    );
    revalidatePath("/purchases");
    return { data: po };
  });
}

export async function receivePurchaseOrder(poId: string) {
  return ownerAction(async (supabase, userId) => {
    const { data, error } = await supabase.rpc("receive_purchase_order", {
      p_po_id: poId,
    });
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(
      supabase,
      userId,
      "RECEIVE_PURCHASE_ORDER",
      "purchase_orders",
      poId,
    );
    revalidatePath("/purchases");
    revalidatePath("/inventory");
    revalidatePath("/reports");
    return { data };
  });
}

export async function cancelPurchaseOrder(poId: string) {
  return ownerAction(async (supabase, userId) => {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "cancelled" })
      .eq("id", poId)
      .eq("status", "draft");
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(
      supabase,
      userId,
      "CANCEL_PURCHASE_ORDER",
      "purchase_orders",
      poId,
    );
    revalidatePath("/purchases");
    return {};
  });
}
