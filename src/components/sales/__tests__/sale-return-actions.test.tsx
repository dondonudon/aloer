import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SaleReturnActions } from "@/components/sales/sale-return-actions";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/actions/sales", () => ({
  createSaleReturn: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/i18n/context", () => ({
  useI18n: () => ({
    t: {
      common: { by: "By", cancel: "Cancel" },
      sales: {
        processReturn: "Process Return",
        returnConfirmNote: "Select items and quantities to return.",
        returnHistory: "Return History",
        refundMethod: "Refund method",
        totalRefund: "Total refund",
        refundAmount: "Refund amount",
        returnQty: "Return qty",
        maxReturn: "Max returnable",
        returnNotes: "Notes",
        returnNotesPlaceholder: "Optional reason…",
        confirmReturn: "Confirm Return",
        returnCreatedSuccess: "Return created.",
        product: "Product",
        price: "Price",
        qty: "Qty",
      },
    },
  }),
}));

vi.mock("@/lib/utils", () => ({
  formatCurrency: (v: number) => `Rp${v}`,
  formatDateTime: (v: string) => v,
}));

vi.mock("@/components/ui/modal", () => ({
  Modal: ({
    open,
    children,
    title,
  }: {
    open: boolean;
    children: React.ReactNode;
    title: string;
    onClose: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

// Mock lucide-react icons used by the component
vi.mock("lucide-react", () => ({
  RotateCcw: () => <svg data-testid="icon-return" />,
  X: () => <svg data-testid="icon-close" />,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSaleItem(
  overrides: Partial<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    subtotal: number;
    products: { name: string; sku: string } | null;
  }> = {},
) {
  return {
    id: "item-1",
    product_id: "prod-1",
    quantity: 3,
    price: 10000,
    subtotal: 30000,
    products: { name: "Coffee", sku: "SKU-001" },
    ...overrides,
  };
}

const baseProps = {
  saleId: "sale-1",
  saleStatus: "completed",
  saleItems: [makeSaleItem()],
  existingReturns: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SaleReturnActions", () => {
  it("renders nothing when saleStatus is not 'completed'", () => {
    const { container } = render(
      <SaleReturnActions {...baseProps} saleStatus="voided" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when all sale items are fully returned", () => {
    render(
      <SaleReturnActions
        {...baseProps}
        existingReturns={[
          {
            id: "ret-1",
            return_number: "RET-001",
            sale_id: "sale-1",
            refund_method: "cash",
            total_refund: 30000,
            total_cogs_returned: 0,
            notes: null,
            created_by: null,
            created_at: "2026-04-09T00:00:00Z",
            items: [
              {
                id: "ri-1",
                return_id: "ret-1",
                product_id: "prod-1",
                quantity: 3, // equals original sale item quantity — fully returned
                unit_price: 10000,
                refund_amount: 30000,
              },
            ],
          },
        ]}
      />,
    );
    // Button should be absent (hasReturnable = false)
    expect(
      screen.queryByRole("button", { name: /process return/i }),
    ).toBeNull();
    // But return history should still render
    expect(screen.getByText("Return History")).toBeInTheDocument();
  });

  it("shows 'Process Return' button when items are returnable", () => {
    render(<SaleReturnActions {...baseProps} />);
    expect(
      screen.getByRole("button", { name: /process return/i }),
    ).toBeInTheDocument();
  });

  it("opens the return modal when the button is clicked", () => {
    render(<SaleReturnActions {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /process return/i }));
    expect(
      screen.getByText("Select items and quantities to return."),
    ).toBeInTheDocument();
  });

  it("renders return history when existingReturns are present", () => {
    render(
      <SaleReturnActions
        {...baseProps}
        saleItems={[makeSaleItem({ quantity: 5 })]} // 5 original, 2 returned → 3 remaining
        existingReturns={[
          {
            id: "ret-2",
            return_number: "RET-002",
            sale_id: "sale-1",
            refund_method: "transfer",
            total_refund: 20000,
            total_cogs_returned: 0,
            notes: "Damaged goods",
            created_by: null,
            created_at: "2026-04-09T12:00:00Z",
            items: [
              {
                id: "ri-2",
                return_id: "ret-2",
                product_id: "prod-1",
                quantity: 2,
                unit_price: 10000,
                refund_amount: 20000,
                products: { name: "Coffee", sku: "SKU-001" },
              },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText("Return History")).toBeInTheDocument();
    expect(screen.getByText("RET-002")).toBeInTheDocument();
    expect(screen.getByText("Damaged goods")).toBeInTheDocument();
    // Button should still appear because 3 of 5 are still returnable
    expect(
      screen.getByRole("button", { name: /process return/i }),
    ).toBeInTheDocument();
  });

  it("shows max-returnable quantity accounting for prior returns", () => {
    render(
      <SaleReturnActions
        {...baseProps}
        saleItems={[makeSaleItem({ quantity: 5 })]}
        existingReturns={[
          {
            id: "ret-3",
            return_number: "RET-003",
            sale_id: "sale-1",
            refund_method: "cash",
            total_refund: 10000,
            total_cogs_returned: 0,
            notes: null,
            created_by: null,
            created_at: "2026-04-09T12:00:00Z",
            items: [
              {
                id: "ri-3",
                return_id: "ret-3",
                product_id: "prod-1",
                quantity: 2,
                unit_price: 10000,
                refund_amount: 10000,
              },
            ],
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /process return/i }));
    // Max returnable for prod-1 = 5 - 2 = 3; the table cell should show "3"
    const cells = screen.getAllByText("3");
    expect(cells.length).toBeGreaterThan(0);
  });
});
