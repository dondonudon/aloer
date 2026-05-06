import "server-only";
import { sendPushToUser } from "@/lib/push-server";
import { createAdminClient } from "@/lib/supabase/admin";

// Each job returns the number of users notified. Keep them small + idempotent
// — if cron retries, sending the same payload twice is harmless (the SW dedupes
// via `tag`).

export interface JobResult {
  job: string;
  notified: number;
  errors: number;
}

// TODO(business-rules): finalise outstanding-credit reminder logic.
// Open questions:
//   * Threshold — remind on every outstanding row, or only when overdue by N days?
//   * Audience — owner only, or also the cashier who created the sale?
//   * Cadence — daily summary vs one-per-overdue-record?
// When ready, replace the stub query + payload below.
export async function notifyOutstandingCredit(): Promise<JobResult> {
  const admin = createAdminClient();
  const result: JobResult = {
    job: "outstanding_credit",
    notified: 0,
    errors: 0,
  };

  // Stub: pretend there are no users to notify until the business rules land.
  // Example shape once implemented:
  //
  //   const { data: owners } = await admin
  //     .from("user_roles")
  //     .select("user_id")
  //     .eq("role", "owner");
  //
  //   for (const o of owners ?? []) {
  //     const { count, totalRupiah } = await getOutstandingCreditFor(o.user_id);
  //     if (count === 0) continue;
  //     await sendPushToUser(o.user_id, {
  //       title: "Outstanding credit reminder",
  //       body: `${count} customers owe ${formatIDR(totalRupiah)}`,
  //       url: "/credit",
  //       tag: "credit-reminder",
  //     });
  //     result.notified++;
  //   }

  void admin;
  void sendPushToUser;
  return result;
}

// TODO(business-rules): finalise expiring-products alert logic.
// Open questions:
//   * Window — warn N days before expiry? Configurable per product?
//   * Source of truth — `inventory_batches.expiry_date` exists once added; today
//     batches don't store expiry. Schema change needed before this lights up.
//   * Suppress already-warned batches so we don't spam every run.
export async function notifyExpiringProducts(): Promise<JobResult> {
  const result: JobResult = {
    job: "expiring_products",
    notified: 0,
    errors: 0,
  };
  return result;
}
