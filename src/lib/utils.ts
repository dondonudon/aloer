// Shared utility functions

// Module-level Intl instances — created once, reused on every call (avoids
// the per-call construction cost of Intl formatters).
const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatDate(date: string): string {
  return dateFormatter.format(new Date(date));
}

export function formatDateTime(date: string): string {
  return dateTimeFormatter.format(new Date(date));
}
