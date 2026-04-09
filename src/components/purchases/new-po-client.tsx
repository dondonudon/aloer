"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { createPurchaseOrder } from "@/lib/actions/purchases";
import type { Product, Supplier } from "@/lib/types";

interface Props {
  products: Product[];
  suppliers: Supplier[];
}

interface POItem {
  id: number;
  product_id: string;
  quantity: string;
  cost_price: string;
  expiry_date: string;
}

let nextItemId = 1;

export function NewPurchaseOrderClient({ products, suppliers }: Props) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: nextItemId++,
        product_id: "",
        quantity: "",
        cost_price: "",
        expiry_date: "",
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
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

    const formData = new FormData();
    formData.set("supplier_id", supplierId);
    formData.set("payment_method", paymentMethod);
    formData.set("notes", notes);
    formData.set(
      "items",
      JSON.stringify(
        items.map((item) => ({
          product_id: item.product_id,
          quantity: parseFloat(item.quantity),
          cost_price: parseFloat(item.cost_price),
          expiry_date: item.expiry_date || undefined,
        })),
      ),
    );

    const result = await createPurchaseOrder(formData);

    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: "Purchase order created", type: "success" });
      router.push("/purchases");
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

  const supplierOptions = [
    { value: "", label: "No supplier" },
    ...suppliers
      .filter((s) => s.is_active)
      .map((s) => ({ value: s.id, label: s.name })),
  ];

  const paymentOptions = [
    { value: "cash", label: "Cash" },
    { value: "transfer", label: "Transfer" },
    { value: "credit", label: "Credit (Tempo)" },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="New Purchase Order"
        backHref="/purchases"
        backLabel="Purchase Orders"
      />

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Supplier"
            options={supplierOptions}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          />
          <Select
            label="Payment Method"
            options={paymentOptions}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
        </div>
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
                  value={item.product_id}
                  onChange={(e) =>
                    updateItem(index, "product_id", e.target.value)
                  }
                />
              </div>
              <Input
                label="Quantity"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
              />
              <Input
                label="Cost Price"
                type="number"
                min="0"
                step="100"
                value={item.cost_price}
                onChange={(e) =>
                  updateItem(index, "cost_price", e.target.value)
                }
              />
              <div className="flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    label="Expiry"
                    type="date"
                    value={item.expiry_date}
                    onChange={(e) =>
                      updateItem(index, "expiry_date", e.target.value)
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
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
          <Button variant="secondary" onClick={() => router.push("/purchases")}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
          >
            {loading ? "Creating..." : "Create PO"}
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
