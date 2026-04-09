"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { createAdjustment } from "@/lib/actions/inventory";
import type { AdjustmentItemInput, Product } from "@/lib/types";

interface Props {
  products: Product[];
}

const reasonOptions = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "recount", label: "Recount" },
  { value: "initial_stock", label: "Initial Stock" },
  { value: "other", label: "Other" },
];

export function NewAdjustmentClient({ products }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("recount");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    Array<{
      id: string;
      productId: string;
      quantityChange: string;
      costPrice: string;
      expiryDate: string;
    }>
  >([]);
  const [nextItemId, setNextItemId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: String(nextItemId),
        productId: "",
        quantityChange: "",
        costPrice: "",
        expiryDate: "",
      },
    ]);
    setNextItemId((n) => n + 1);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateItem(index: number, field: string, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function handleSubmit() {
    if (items.length === 0) {
      setToast({ message: "Add at least one item", type: "error" });
      return;
    }

    setLoading(true);

    const adjustmentItems: AdjustmentItemInput[] = items.map((item) => ({
      productId: item.productId,
      quantityChange: parseFloat(item.quantityChange),
      costPrice: parseFloat(item.costPrice),
      expiryDate: item.expiryDate || null,
    }));

    const result = await createAdjustment({
      reason,
      notes: notes || undefined,
      items: adjustmentItems,
    });

    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: "Adjustment created", type: "success" });
      router.push("/inventory/adjustments");
    }
    setLoading(false);
  }

  const productOptions = [
    { value: "", label: "Select product..." },
    ...products.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.sku})`,
    })),
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="New Inventory Adjustment"
        backHref="/inventory/adjustments"
        backLabel="Adjustments"
      />

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <Select
          label="Reason"
          options={reasonOptions}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Items
            </h2>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={addItem}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Add Item
            </Button>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="sm:col-span-2">
                <Select
                  label="Product"
                  options={productOptions}
                  value={item.productId}
                  onChange={(e) =>
                    updateItem(index, "productId", e.target.value)
                  }
                />
              </div>
              <Input
                label="Qty change (+/-)"
                type="number"
                value={item.quantityChange}
                onChange={(e) =>
                  updateItem(index, "quantityChange", e.target.value)
                }
                placeholder="e.g. -5 or 3"
              />
              <Input
                label="Cost price"
                type="number"
                min="0"
                step="100"
                value={item.costPrice}
                onChange={(e) => updateItem(index, "costPrice", e.target.value)}
              />
              <div className="flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    label="Expiry"
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) =>
                      updateItem(index, "expiryDate", e.target.value)
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-2 rounded hover:bg-red-100 text-red-500 transition-colors mb-0.5 shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No items added. Click &quot;Add Item&quot; to start.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="secondary"
            onClick={() => router.push("/inventory/adjustments")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
          >
            {loading ? "Processing..." : "Create Adjustment"}
          </Button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
