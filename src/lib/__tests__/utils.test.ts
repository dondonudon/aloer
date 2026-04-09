import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe("formatCurrency", () => {
  it("formats integer amounts in IDR locale", () => {
    const result = formatCurrency(100000);
    expect(result).toMatch(/Rp/);
    expect(result).toMatch(/100\.000|100,000/);
  });

  it("formats zero as Rp 0", () => {
    expect(formatCurrency(0)).toMatch(/Rp/);
    expect(formatCurrency(0)).toMatch(/0/);
  });

  it("formats negative amounts", () => {
    const result = formatCurrency(-50000);
    expect(result).toMatch(/-/);
    expect(result).toMatch(/50/);
  });

  it("does not include decimal comma (fraction digits are 0)", () => {
    const result = formatCurrency(1500);
    expect(result).not.toMatch(/,/);
  });

  it("formats large amounts with thousand separators", () => {
    const result = formatCurrency(1_000_000);
    // Should contain "1.000.000" (id-ID) or "1,000,000" depending on runner locale
    expect(result).toMatch(/1[.,]000[.,]000/);
  });

  it("formats 1 as a non-zero string", () => {
    const result = formatCurrency(1);
    expect(result).toMatch(/1/);
  });

  it("is consistent — same amount always returns same string", () => {
    expect(formatCurrency(25000)).toBe(formatCurrency(25000));
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe("formatDate", () => {
  it("returns a non-empty string for a valid ISO date", () => {
    const result = formatDate("2024-01-15T00:00:00Z");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("includes the year", () => {
    const result = formatDate("2024-06-01T00:00:00Z");
    expect(result).toMatch(/2024/);
  });

  it("is consistent — same input yields same output", () => {
    const iso = "2024-03-20T12:00:00Z";
    expect(formatDate(iso)).toBe(formatDate(iso));
  });

  it("handles a date at the Unix epoch boundary", () => {
    const result = formatDate("1970-01-01T00:00:00Z");
    expect(result).toBeTruthy();
    expect(result).toMatch(/1970/);
  });

  it("handles a far-future date", () => {
    const result = formatDate("2099-06-15T12:00:00Z");
    expect(result).toMatch(/2099/);
  });
});

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------

describe("formatDateTime", () => {
  it("returns a non-empty string for a valid ISO datetime", () => {
    const result = formatDateTime("2024-01-15T10:30:00Z");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("includes the year from a midday UTC timestamp (no timezone rollover)", () => {
    const result = formatDateTime("2024-06-15T05:00:00Z");
    expect(result).toMatch(/2024/);
  });

  it("is longer than formatDate output (includes time)", () => {
    const iso = "2024-06-15T10:00:00Z";
    expect(formatDateTime(iso).length).toBeGreaterThan(formatDate(iso).length);
  });

  it("is consistent — same input yields same output", () => {
    const iso = "2025-11-05T08:00:00Z";
    expect(formatDateTime(iso)).toBe(formatDateTime(iso));
  });

  it("handles midnight UTC", () => {
    const result = formatDateTime("2024-01-01T00:00:00Z");
    expect(result).toBeTruthy();
    expect(result).toMatch(/2024/);
  });
});
