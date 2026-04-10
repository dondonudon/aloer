"use server";

import { getCurrentUser, isOwner } from "@/lib/auth";
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
export async function getTodaySales() {
  const tz = process.env.APP_TIMEZONE ?? "UTC";
  const supabase = await createClient();

  // "Today" as local date string e.g. "2026-04-09"
  const localToday = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Midnight and end-of-day in local timezone → convert to UTC ISO strings
  // by constructing a Date from the local wall-clock time representation
  function localMidnight(dateStr: string, endOfDay = false): string {
    // Construct the local time string and parse it as if it were UTC,
    // then subtract the tz offset to get the actual UTC equivalent.
    // Reliable cross-platform approach: use Intl to get the UTC offset at that moment.
    const wallClock = endOfDay
      ? `${dateStr}T23:59:59.999`
      : `${dateStr}T00:00:00.000`;

    // Parse as UTC first to get a reference point
    const naive = new Date(`${wallClock}Z`);

    // Get what Intl thinks the local date/time is at that UTC moment
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

    // offset = what local time reads minus what UTC time reads
    const offsetMs = localAtUTC.getTime() - naive.getTime();
    return new Date(naive.getTime() - offsetMs).toISOString();
  }

  const utcStart = localMidnight(localToday, false);
  const utcEnd = localMidnight(localToday, true);

  const { data, error } = await supabase
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
    gross_profit: rows.reduce((s, r) => s + (r.total_amount - r.total_cogs), 0),
  };
}

export async function getSalesSummary(
  startDate?: string,
  endDate?: string,
  limit?: number,
) {
  const supabase = await createClient();
  const tz = process.env.APP_TIMEZONE ?? "UTC";

  // When a limit is requested without an explicit start date, only fetch the
  // last (limit + 1) days so the query doesn't scan all historical rows.
  // +1 ensures we catch a full day even at timezone boundaries.
  // When neither a startDate nor a limit is provided (e.g. the /reports/sales
  // page which filters client-side), default to the last 365 days. Callers
  // that genuinely need older data should pass an explicit startDate.
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

  let query = supabase
    .from("sales")
    .select("created_at, total_amount, total_cogs")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (effectiveStartDate) query = query.gte("created_at", effectiveStartDate);
  if (endDate) query = query.lte("created_at", endDate);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Aggregate by local date (timezone-aware)
  const dailyMap = new Map<
    string,
    {
      total_transactions: number;
      total_revenue: number;
      total_cogs: number;
      gross_profit: number;
    }
  >();

  for (const sale of data ?? []) {
    const day = new Intl.DateTimeFormat("sv-SE", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(sale.created_at));

    const existing = dailyMap.get(day);
    if (existing) {
      existing.total_transactions += 1;
      existing.total_revenue += sale.total_amount;
      existing.total_cogs += sale.total_cogs;
      existing.gross_profit += sale.total_amount - sale.total_cogs;
    } else {
      dailyMap.set(day, {
        total_transactions: 1,
        total_revenue: sale.total_amount,
        total_cogs: sale.total_cogs,
        gross_profit: sale.total_amount - sale.total_cogs,
      });
    }
  }

  const result = Array.from(dailyMap.entries())
    .map(([date, stats]) => ({ sale_date: date, ...stats }))
    .sort((a, b) => b.sale_date.localeCompare(a.sale_date));

  return limit ? result.slice(0, limit) : result;
}
