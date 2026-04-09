import { describe, expect, it, vi } from "vitest";
import {
  insertAuditLog,
  ownerAction,
  validateName,
} from "@/lib/actions/action-utils";

// ---------------------------------------------------------------------------
// ownerAction — auth/role guard
// ---------------------------------------------------------------------------

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
  isOwner: (role: string) => role === "owner",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("ownerAction", () => {
  it("returns Unauthorized when getCurrentUser returns null", async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

    const result = await ownerAction(async () => ({}));

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("returns Unauthorized when the user is a cashier", async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: "user-1",
      email: "cashier@example.com",
      name: "Cashier",
      role: "cashier",
      theme: null,
      locale: null,
    });

    const result = await ownerAction(async () => ({}));

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("calls the handler with (supabase, userId) for an authenticated owner", async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const { createClient } = await import("@/lib/supabase/server");

    const fakeSupabase = {} as Awaited<ReturnType<typeof createClient>>;
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: "owner-42",
      email: "owner@example.com",
      name: "Owner",
      role: "owner",
      theme: null,
      locale: null,
    });
    vi.mocked(createClient).mockResolvedValueOnce(fakeSupabase);

    const handler = vi.fn().mockResolvedValueOnce({ data: "ok" });

    const result = await ownerAction(handler);

    expect(handler).toHaveBeenCalledWith(fakeSupabase, "owner-42");
    expect(result).toEqual({ data: "ok" });
  });

  it("propagates an error result returned by the handler", async () => {
    const { getCurrentUser } = await import("@/lib/auth");
    const { createClient } = await import("@/lib/supabase/server");

    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: "owner-1",
      email: "owner@example.com",
      name: "Owner",
      role: "owner",
      theme: null,
      locale: null,
    });
    vi.mocked(createClient).mockResolvedValueOnce({} as Awaited<ReturnType<typeof createClient>>);

    const result = await ownerAction(async () => ({ error: "something broke" }));

    expect(result).toEqual({ error: "something broke" });
  });
});

// ---------------------------------------------------------------------------
// insertAuditLog
// ---------------------------------------------------------------------------

function makeSupabaseMock(insertResult: unknown = {}) {
  const insertFn = vi.fn().mockResolvedValue(insertResult);
  const fromFn = vi.fn().mockReturnValue({ insert: insertFn });
  return { client: { from: fromFn } as unknown as import("@supabase/supabase-js").SupabaseClient, insertFn, fromFn };
}

describe("insertAuditLog", () => {
  it("calls supabase.from('audit_logs').insert() with all provided fields", async () => {
    const { client, fromFn, insertFn } = makeSupabaseMock();

    await insertAuditLog(client, "user-1", "create", "products", "prod-99", {
      name: "Coffee",
    });

    expect(fromFn).toHaveBeenCalledWith("audit_logs");
    expect(insertFn).toHaveBeenCalledWith({
      user_id: "user-1",
      action: "create",
      entity: "products",
      entity_id: "prod-99",
      payload: { name: "Coffee" },
    });
  });

  it("defaults entity_id and payload to null when omitted", async () => {
    const { client, insertFn } = makeSupabaseMock();

    await insertAuditLog(client, "user-2", "delete", "categories");

    expect(insertFn).toHaveBeenCalledWith({
      user_id: "user-2",
      action: "delete",
      entity: "categories",
      entity_id: null,
      payload: null,
    });
  });

  it("swallows errors silently and does not throw", async () => {
    const insertFn = vi.fn().mockResolvedValue({ data: null, error: { message: "constraint violation" } });
    const client = {
      from: vi.fn().mockReturnValue({ insert: insertFn }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    await expect(
      insertAuditLog(client, "user-3", "update", "settings"),
    ).resolves.toBeUndefined();
  });
});

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
