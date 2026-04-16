"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatDbError, insertAuditLog, ownerAction } from "./action-utils";

/**
 * Fetches all credit payment collections for a given sale.
 * Returns payments ordered oldest-first, with resolved creator names.
 */
export async function getSaleCreditPayments(saleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sale_credit_payments")
    .select("*")
    .eq("sale_id", saleId)
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
 * Records a customer payment collection against a credit sale.
 * Calls the collect_sale_payment SQL function which handles the journal entry atomically.
 *
 * Security: owner only.
 * Validates: positive amount, valid payment method.
 */
export async function collectSalePayment(saleId: string, formData: FormData) {
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
    const { data, error } = await supabase.rpc("collect_sale_payment", {
      p_payload: {
        sale_id: saleId,
        amount,
        payment_method: paymentMethod,
        notes,
      },
    });
    if (error) return { error: await formatDbError(error) };
    await insertAuditLog(
      supabase,
      userId,
      "COLLECT_CREDIT_PAYMENT",
      "sales",
      saleId,
      { amount, payment_method: paymentMethod },
    );
    revalidatePath(`/sales/${saleId}`);
    revalidatePath("/sales");
    revalidatePath("/credit");
    return { data };
  });
}

/**
 * Fetches all outstanding credit sales (payment_method = 'credit')
 * along with how much has been collected so far.
 * Used by the Credit overview page.
 */
export async function getOutstandingCreditSales() {
  const supabase = await createClient();

  // Single query: join sale_credit_payments inline to avoid a second roundtrip.
  const { data, error } = await supabase
    .from("sales")
    .select(
      "id, invoice_number, total_amount, created_at, created_by, reseller_id, resellers(name), sale_credit_payments(amount)",
    )
    .eq("payment_method", "credit")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((sale) => {
    const payments =
      (sale.sale_credit_payments as { amount: number }[] | null) ?? [];
    const collected = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      id: sale.id,
      invoice_number: sale.invoice_number,
      total_amount: sale.total_amount,
      created_at: sale.created_at,
      created_by: sale.created_by,
      reseller_id: sale.reseller_id,
      resellers: sale.resellers,
      collected,
      outstanding: sale.total_amount - collected,
    };
  });
}

/**
 * Fetches all outstanding credit purchase orders
 * along with how much has been paid so far.
 * Used by the Credit overview page.
 */
export async function getOutstandingCreditPOs() {
  const supabase = await createClient();

  // Single query: join supplier_payments inline to avoid a second roundtrip.
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, po_number, total_amount, created_at, suppliers(name), supplier_payments(amount)",
    )
    .eq("payment_method", "credit")
    .eq("status", "received")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((po) => {
    const payments =
      (po.supplier_payments as { amount: number }[] | null) ?? [];
    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      id: po.id,
      po_number: po.po_number,
      total_amount: po.total_amount,
      created_at: po.created_at,
      suppliers: po.suppliers,
      paid,
      outstanding: po.total_amount - paid,
    };
  });
}
