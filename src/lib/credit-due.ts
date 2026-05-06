// Helpers for working with credit due dates. Pure date arithmetic — used by
// the credit page (sort + per-row badge) and the dashboard credit overview
// (past-due / due-soon roll-ups).

export type DueBucket =
  | "past_due"
  | "due_tomorrow"
  | "due_soon"
  | "later"
  | "none";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function todayUtcMs(): number {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

function dueDateMs(due: string): number | null {
  const parts = due.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [y, m, d] = parts;
  return Date.UTC(y, m - 1, d);
}

export function categorizeDueDate(due: string | null | undefined): DueBucket {
  if (!due) return "none";
  const ms = dueDateMs(due);
  if (ms === null) return "none";
  const days = Math.floor((ms - todayUtcMs()) / MS_PER_DAY);
  if (days < 0) return "past_due";
  if (days === 1) return "due_tomorrow";
  if (days <= 7) return "due_soon";
  return "later";
}

/** Format a YYYY-MM-DD into a short, locale-stable label. */
export function formatDueDate(due: string | null | undefined): string {
  if (!due) return "—";
  const ms = dueDateMs(due);
  if (ms === null) return due;
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DueAware {
  due_date: string | null;
  outstanding: number;
}

export interface DueBreakdown {
  pastDueAmount: number;
  pastDueCount: number;
  dueSoonAmount: number;
  dueSoonCount: number;
}

/** Roll up past-due and due-soon (next 7 days) totals from a list of credit rows. */
export function rollUpDueBreakdown<T extends DueAware>(
  rows: T[],
): DueBreakdown {
  let pastDueAmount = 0;
  let pastDueCount = 0;
  let dueSoonAmount = 0;
  let dueSoonCount = 0;
  for (const row of rows) {
    if (row.outstanding <= 0) continue;
    const bucket = categorizeDueDate(row.due_date);
    if (bucket === "past_due") {
      pastDueAmount += row.outstanding;
      pastDueCount += 1;
    } else if (bucket === "due_tomorrow" || bucket === "due_soon") {
      dueSoonAmount += row.outstanding;
      dueSoonCount += 1;
    }
  }
  return { pastDueAmount, pastDueCount, dueSoonAmount, dueSoonCount };
}

/** Sort credit rows by urgency: due_date ascending, NULLs last (by created_at desc). */
export function sortByDueUrgency<
  T extends { due_date: string | null; created_at: string },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return b.created_at.localeCompare(a.created_at);
  });
}
