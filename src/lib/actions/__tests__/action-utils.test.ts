import { describe, expect, it } from "vitest";
import { validateName } from "@/lib/actions/action-utils";

describe("validateName", () => {
  // ── valid inputs ────────────────────────────────────────────────────────

  it("returns null for a normal non-empty string", () => {
    expect(validateName("Coffee", "Product")).toBeNull();
  });

  it("returns null for a string that fills exactly the default max length", () => {
    expect(validateName("a".repeat(200), "Name")).toBeNull();
  });

  it("returns null when leading/trailing whitespace makes a valid string", () => {
    expect(validateName("  Valid Name  ", "Label")).toBeNull();
  });

  it("returns null for a custom maxLength that the value fits within", () => {
    expect(validateName("abc", "Name", 10)).toBeNull();
  });

  // ── empty / blank inputs ────────────────────────────────────────────────

  it("returns an error for an empty string", () => {
    const result = validateName("", "Product");
    expect(result).toMatch(/required/i);
    expect(result).toMatch(/Product/);
  });

  it("returns an error for a whitespace-only string", () => {
    const result = validateName("   ", "Category");
    expect(result).toMatch(/required/i);
    expect(result).toMatch(/Category/);
  });

  it("returns an error for null", () => {
    const result = validateName(null, "Supplier");
    expect(result).toMatch(/required/i);
    expect(result).toMatch(/Supplier/);
  });

  // ── too-long inputs ─────────────────────────────────────────────────────

  it("returns an error when value exceeds the default max length of 200", () => {
    const result = validateName("a".repeat(201), "Name");
    expect(result).toMatch(/200/);
  });

  it("returns an error when value exceeds a custom max length", () => {
    const result = validateName("toolong", "Title", 5);
    expect(result).toMatch(/5/);
  });

  it("returns null when value equals a custom max length exactly", () => {
    expect(validateName("hello", "Title", 5)).toBeNull();
  });

  // ── label is included in the error message ──────────────────────────────

  it("includes the label in both 'required' and 'too long' errors", () => {
    const emptyError = validateName("", "My Field");
    const longError = validateName("a".repeat(201), "My Field");
    expect(emptyError).toMatch(/My Field/);
    expect(longError).toMatch(/My Field/);
  });
});
