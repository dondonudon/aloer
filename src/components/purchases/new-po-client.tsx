"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { PageHeader } from "@/components/ui/page-header";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { createPurchaseOrder } from "@/lib/actions/purchases";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();
  const [supplierId, setSupplierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);
  const defaultDueIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [dueDate, setDueDate] = useState<string>(defaultDueIso);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  function addItem() {
    setItems((prev) => [
      {
        id: nextItemId++,
        product_id: "",
        quantity: "",
        cost_price: "",
        expiry_date: "",
      },
      ...prev,
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
      setToast({ message: t.purchases.addAtLeastOne, type: "error" });
      return;
    }
    if (paymentMethod === "credit" && !dueDate) {
      setToast({ message: t.purchases.dueDateRequired, type: "error" });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.set("supplier_id", supplierId);
    formData.set("payment_method", paymentMethod);
    formData.set("notes", notes);
    if (paymentMethod === "credit") {
      formData.set("due_date", dueDate);
    }
    formData.set(
      "items",
      JSON.stringify(
        items
          .filter((item) => item.product_id)
          .map((item) => ({
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
      setToast({ message: t.purchases.poCreated, type: "success" });
      router.push("/purchases");
    }
    setLoading(false);
  }

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.sku})`,
  }));

  const supplierOptions = [
    { value: "", label: t.purchases.noSupplier },
    ...suppliers
      .filter((s) => s.is_active)
      .map((s) => ({ value: s.id, label: s.name })),
  ];

  const paymentOptions = [
    { value: "cash", label: t.common.cash },
    { value: "transfer", label: t.common.transfer },
    { value: "credit", label: t.purchases.creditTempo },
  ];

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title={t.purchases.newPOTitle}
        backHref="/purchases"
        backLabel={t.purchases.title}
      />

      {/* Order details */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t.purchases.supplier}
            options={supplierOptions}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          />
          <Select
            label={t.purchases.paymentMethod}
            options={paymentOptions}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
        </div>
        {paymentMethod === "credit" ? (
          <Input
            label={t.purchases.dueDate}
            type="date"
            value={dueDate}
            min={todayIso}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        ) : null}
        <Input
          label={t.purchases.notesOptional}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.purchases.additionalNotes}
        />
      </div>

      {/* Items section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t.purchases.items}
            {items.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({items.length})
              </span>
            )}
          </h2>
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="h-3 w-3" aria-hidden="true" />
            {t.purchases.addItem}
          </Button>
        </div>

        {items.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400">{t.purchases.noItemsAdded}</p>
          </div>
        )}

        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <SearchableSelect
                  label={t.purchases.product}
                  options={productOptions}
                  value={item.product_id}
                  onChange={(value) => updateItem(index, "product_id", value)}
                  placeholder={t.purchases.selectProduct}
                  searchPlaceholder={t.common.searchPlaceholder}
                  noResultsLabel={t.common.noDataFound}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="mt-6 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors shrink-0"
                aria-label={t.purchases.removeItem}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label={t.purchases.quantity}
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
              />
              <NumericInput
                label={t.purchases.costPrice}
                value={item.cost_price}
                onChange={(e) =>
                  updateItem(index, "cost_price", e.target.value)
                }
              />
              <Input
                label={t.purchases.expiry}
                type="date"
                value={item.expiry_date}
                onChange={(e) =>
                  updateItem(index, "expiry_date", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Submit actions */}
      <div className="flex justify-end gap-2 pb-6">
        <Button variant="secondary" onClick={() => router.push("/purchases")}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={items.length === 0}
        >
          {loading ? "Creating..." : "Create PO"}
        </Button>
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
