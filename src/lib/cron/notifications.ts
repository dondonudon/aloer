import "server-only";
import { getTranslationsForLocale } from "@/lib/i18n/server";
import type { Translations } from "@/lib/i18n/translations";
import { sendPushToUser } from "@/lib/push-server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface JobResult {
  job: string;
  notified: number;
  errors: number;
}

interface OwnerRow {
  user_id: string;
  locale: string | null;
}

interface DueSale {
  id: string;
  invoice_number: string;
  total_amount: number;
  resellers: { name: string }[] | { name: string } | null;
  sale_credit_payments: { amount: number }[] | null;
}

interface DuePO {
  id: string;
  po_number: string;
  total_amount: number;
  suppliers: { name: string }[] | { name: string } | null;
  supplier_payments: { amount: number }[] | null;
}

const numberFormatter = new Intl.NumberFormat("id-ID");
function formatAmount(n: number): string {
  return numberFormatter.format(Math.round(n));
}

function relatedName(
  rel: { name: string }[] | { name: string } | null,
): string {
  if (!rel) return "—";
  if (Array.isArray(rel)) return rel[0]?.name ?? "—";
  return rel.name ?? "—";
}

function tomorrowIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

interface NotifyTarget {
  url: string;
  tag: string;
  build: (t: Translations) => { title: string; body: string };
}

async function fanOutToOwners(
  owners: OwnerRow[],
  target: NotifyTarget,
): Promise<{ notified: number; errors: number }> {
  let notified = 0;
  let errors = 0;
  for (const owner of owners) {
    const t = await getTranslationsForLocale(owner.locale);
    const { title, body } = target.build(t);
    try {
      const result = await sendPushToUser(owner.user_id, {
        title,
        body,
        url: target.url,
        tag: target.tag,
      });
      if (result.sent > 0) notified += 1;
      errors += result.failed;
    } catch {
      errors += 1;
    }
  }
  return { notified, errors };
}

// Reminds owners about credit transactions due tomorrow.
//   * AR: credit sales due tomorrow with outstanding balance > 0
//   * AP: credit POs due tomorrow with outstanding balance > 0
// One notification per record per owner. Push providers dedupe via the
// per-record `tag` if the cron accidentally runs twice the same day.
export async function notifyOutstandingCredit(): Promise<JobResult> {
  const admin = createAdminClient();
  const result: JobResult = {
    job: "outstanding_credit",
    notified: 0,
    errors: 0,
  };
  const due = tomorrowIso();

  const [salesRes, posRes, ownersRes] = await Promise.all([
    admin
      .from("sales")
      .select(
        "id, invoice_number, total_amount, resellers(name), sale_credit_payments(amount)",
      )
      .eq("payment_method", "credit")
      .eq("status", "completed")
      .eq("due_date", due),
    admin
      .from("purchase_orders")
      .select(
        "id, po_number, total_amount, suppliers(name), supplier_payments(amount)",
      )
      .eq("payment_method", "credit")
      .eq("status", "received")
      .eq("due_date", due),
    admin.from("user_roles").select("user_id, locale").eq("role", "owner"),
  ]);

  if (salesRes.error) throw salesRes.error;
  if (posRes.error) throw posRes.error;
  if (ownersRes.error) throw ownersRes.error;

  const owners = (ownersRes.data ?? []) as OwnerRow[];
  if (owners.length === 0) return result;

  const sales = (salesRes.data ?? []) as DueSale[];
  for (const sale of sales) {
    const collected = (sale.sale_credit_payments ?? []).reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    const outstanding = sale.total_amount - collected;
    if (outstanding <= 0) continue;

    const name = relatedName(sale.resellers);
    const amount = formatAmount(outstanding);

    const out = await fanOutToOwners(owners, {
      url: "/credit",
      tag: `credit-due-sale-${sale.id}`,
      build: (t) => ({
        title: t.notifications.creditDue.salesTitle,
        body: fillTemplate(t.notifications.creditDue.salesBody, {
          name,
          amount,
        }),
      }),
    });
    result.notified += out.notified;
    result.errors += out.errors;
  }

  const pos = (posRes.data ?? []) as DuePO[];
  for (const po of pos) {
    const paid = (po.supplier_payments ?? []).reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    const outstanding = po.total_amount - paid;
    if (outstanding <= 0) continue;

    const name = relatedName(po.suppliers);
    const amount = formatAmount(outstanding);

    const out = await fanOutToOwners(owners, {
      url: "/credit",
      tag: `credit-due-po-${po.id}`,
      build: (t) => ({
        title: t.notifications.creditDue.purchaseTitle,
        body: fillTemplate(t.notifications.creditDue.purchaseBody, {
          name,
          amount,
        }),
      }),
    });
    result.notified += out.notified;
    result.errors += out.errors;
  }

  return result;
}

// TODO(business-rules): finalise expiring-products alert logic.
// Open questions:
//   * Window — warn N days before expiry? Configurable per product?
//   * Suppress already-warned batches so we don't spam every cron run
//     (e.g. an `inventory_batches.last_expiry_warning_at` column).
//   * Group by product (one notification per product) or per batch?
// `inventory_batches.expiry_date` already exists, so the query is cheap once
// the rules are settled.
export async function notifyExpiringProducts(): Promise<JobResult> {
  const result: JobResult = {
    job: "expiring_products",
    notified: 0,
    errors: 0,
  };
  return result;
}
