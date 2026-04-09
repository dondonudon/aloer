import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToast } from "@/lib/hooks/use-toast";

describe("useToast", () => {
  it("starts with no toast", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeNull();
  });

  it("showToast sets the message and type", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Saved successfully", "success");
    });

    expect(result.current.toast).toEqual({
      message: "Saved successfully",
      type: "success",
    });
  });

  it("showToast works for error type", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Something went wrong", "error");
    });

    expect(result.current.toast).toEqual({
      message: "Something went wrong",
      type: "error",
    });
  });

  it("clearToast resets toast to null", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Hello", "success");
    });
    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.clearToast();
    });
    expect(result.current.toast).toBeNull();
  });

  it("calling showToast a second time overwrites the previous toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("First", "success");
    });
    act(() => {
      result.current.showToast("Second", "error");
    });

    expect(result.current.toast?.message).toBe("Second");
    expect(result.current.toast?.type).toBe("error");
  });
});
