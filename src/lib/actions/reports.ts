"use server";

import { unstable_cache } from "next/cache";
import { getCurrentUser, isOwner } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getBalanceSheet(period?: string) {
  const user = await getCurrentUser();
  if (!user || !isOwner(user.role)) {
    return { error: "Unauthorized" };
  }

  // period can be "YYYY" (whole year) or "YYYY-MM" (single month).
  // Default to current month.
  const target = period ?? new Date().toISOString().slice(0, 7);
  let start: Date;
  let end: Date;

  if (/^\d{4}$/.test(target)) {
    // Whole year
    const year = Number(target);
    start = new Date(year, 0, 1);
    end = new Date(year + 1, 0, 1);
  } else {
    // Single month "YYYY-MM"
    const [year, mon] = target.split("-").map(Number);
    start = new Date(year, mon - 1, 1);
    end = new Date(year, mon, 1);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_lines")
    .select(
      "debit, credit, accounts(id, code, name, type), journal_entries!inner(created_at)",
    )
    .gte("journal_entries.created_at", start.toISOString())
    .lt("journal_entries.created_at", end.toISOString())
    .order("accounts(code)");

  if (error) throw new Error(error.message);

  // Aggregate by account
  const accountMap = new Map<
    string,
    { code: string; name: string; type: string; balance: number }
  >();

  for (const line of data ?? []) {
    const account = line.accounts as unknown as {
      id: string;
      code: string;
      name: string;
      type: string;
    };
    if (!account) continue;

    const existing = accountMap.get(account.id);
    if (existing) {
      existing.balance += line.debit - line.credit;
    } else {
      accountMap.set(account.id, {
        code: account.code,
        name: account.name,
        type: account.type,
        balance: line.debit - line.credit,
      });
    }
  }

  return {
    data: Array.from(accountMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code),
    ),
  };
}

export async function getProfitLoss(startDate: string, endDate: string) {
  const user = await getCurrentUser();
  if (!user || !isOwner(user.role)) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_profit_loss", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw new Error(error.message);
  return { data: data ?? [] };
}

/**
 * Returns today's sales stats using the configured APP_TIMEZONE.
 * Converts "today" in local time to UTC start/end for the Supabase query.
 */

// Helper: compute UTC ISO boundaries for a given local date string and timezone.
function localMidnight(
  dateStr: string,
  tz: string,
  endOfDay = false,
): string {
  const wallClock = endOfDay
    ? `${dateStr}T23:59:59.999`
    : `${dateStr}T00:00:00.000`;

  const naive = new Date(`${wallClock}Z`);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(naive);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const localStr = `${get("year")}-${get("month")}-${get("day")}T${get("hour").padStart(2, "0")}:${get("minute")}:${get("second")}Z`;
  const localAtUTC = new Date(localStr);

  const offsetMs = localAtUTC.getTime() - naive.getTime();
  return new Date(naive.getTime() - offsetMs).toISOString();
}

// Cached fetcher — keyed per day so the cache naturally expires at midnight.
// Arguments are included in the cache key automatically by unstable_cache.
const _getCachedTodaySales = unstable_cache(
  async (utcStart: string, utcEnd: string, localToday: string) => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("sales")
      .select("total_amount, total_cogs")
      .eq("status", "completed")
      .gte("created_at", utcStart)
      .lte("created_at", utcEnd);

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    return {
      date: localToday,
      total_transactions: rows.length,
      total_revenue: rows.reduce((s, r) => s + r.total_amount, 0),
      total_cogs: rows.reduce((s, r) => s + r.total_cogs, 0),
      gross_profit: rows.reduce(
        (s, r) => s + (r.total_amount - r.total_cogs),
        0,
      ),
    };
  },
  ["today-sales"],
  { revalidate: 30, tags: ["today-sales"] },
);

export async function getTodaySales() {
  const tz = process.env.APP_TIMEZONE ?? "UTC";

  const localToday = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const utcStart = localMidnight(localToday, tz, false);
  const utcEnd = localMidnight(localToday, tz, true);

  return _getCachedTodaySales(utcStart, utcEnd, localToday);
}

export async function getSalesSummary(
  startDate?: string,
  endDate?: string,
  limit?: number,
  paymentType?: string,
) {
  const tz = process.env.APP_TIMEZONE ?? "UTC";

  // Derive a default start date when no explicit bound is given.
  let effectiveStartDate = startDate;
  if (!effectiveStartDate && limit) {
    const d = new Date();
    d.setDate(d.getDate() - (limit + 1));
    effectiveStartDate = d.toISOString().slice(0, 10);
  } else if (!effectiveStartDate) {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    effectiveStartDate = d.toISOString().slice(0, 10);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_sales_summary", {
    p_start_date: effectiveStartDate ? `${effectiveStartDate}T00:00:00Z` : null,
    p_end_date: endDate ? `${endDate}T23:59:59Z` : null,
    p_timezone: tz,
    p_payment_type: paymentType || null,
  });

  if (error) throw new Error(error.message);

  const result = (data ?? []) as import("@/lib/types").SalesSummaryRow[];
  return limit ? result.slice(0, limit) : result;
}
