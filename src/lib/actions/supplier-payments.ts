"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatDbError, insertAuditLog, ownerAction } from "./action-utils";

/** Fetches all supplier payments for a given purchase order, oldest-first, with resolved creator names. */
export async function getSupplierPayments(poId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_payments")
    .select("*")
    .eq("purchase_order_id", poId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const payments = data ?? [];
  const userIds = [
    ...new Set(
      payments
        .map((p) => p.created_by)
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

  return payments.map((p) => ({
    ...p,
    created_by_name: p.created_by ? (userNames[p.created_by] ?? null) : null,
  }));
}

/**
 * Records a payment against an AP (credit) purchase order.
 * Calls the pay_supplier SQL function which handles the journal entry atomically.
 * Security: owner only.
 */
export async function paySupplier(poId: string, formData: FormData) {
  const rawAmount = formData.get("amount") as string;
  const paymentMethod = formData.get("payment_method") as string;
  const notes = (formData.get("notes") as string) || null;

  const amount = parseFloat(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number" };
  }

  if (paymentMethod !== "cash" && paymentMethod !== "transfer") {
    return { error: "Invalid payment method" };
  }

  return ownerAction(async (supabase, userId) => {
    const { data, error } = await supabase.rpc("pay_supplier", {
      p_payload: { po_id: poId, amount, payment_method: paymentMethod, notes },
    });
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(
      supabase,
      userId,
      "PAY_SUPPLIER",
      "purchase_orders",
      poId,
      { amount, payment_method: paymentMethod },
    );
    revalidatePath(`/purchases/${poId}`);
    revalidatePath("/purchases");
    return { data };
  });
}
