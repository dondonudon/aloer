import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats integer amounts in IDR locale", () => {
    const result = formatCurrency(100000);
    // Indonesian locale uses "Rp" prefix; allow for non-breaking space variants
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
    // Indonesian locale uses '.' as a thousands separator and ',' for decimals.
    // With 0 fraction digits the formatter must not emit a ',' (decimal comma).
    const result = formatCurrency(1500);
    expect(result).not.toMatch(/,/);
  });
});

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
});

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
});
