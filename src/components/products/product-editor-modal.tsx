"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { getActiveCategories } from "@/lib/actions/categories";
import type { Category, Product, ProductPrice, ProductUnit } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type UnitState = {
  unit_name: string;
  conversion_to_base: string;
  is_base: boolean;
};

type EditorLabels = {
  productName: string;
  sku: string;
  manageCategories: string;
  category: string;
  categoryPlaceholder: string;
  unit: string;
  sellingPrice: string;
  bulkPriceOptional: string;
  bulkPricePlaceholder: string;
  bulkMinQty: string;
  bulkMinQtyPlaceholder: string;
  priceHistory: string;
  noPriceHistory: string;
  unitsConversions: string;
  noUnitsYet: string;
  unitName: string;
  conversionToBase: string;
  isBaseUnit: string;
  baseLabel: string;
  deleteUnit: string;
  addUnit: string;
  productImage: string;
  status: string;
  active: string;
  inactive: string;
  cancel: string;
  saving: string;
  create: string;
  update: string;
};

interface ProductsEditorModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  editing: Product | null;
  unitOptions: Array<{ value: string; label: string }>;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  loading: boolean;
  priceHistory: ProductPrice[];
  productUnits: ProductUnit[];
  newUnit: UnitState;
  onNewUnitChange: Dispatch<SetStateAction<UnitState>>;
  unitLoading: boolean;
  onAddUnit: () => void;
  onDeleteUnit: (unitId: string) => void;
  labels: EditorLabels;
}

export function ProductEditorModal({
  open,
  title,
  onClose,
  onSubmit,
  editing,
  unitOptions,
  imageUrl,
  onImageUrlChange,
  loading,
  priceHistory,
  productUnits,
  newUnit,
  onNewUnitChange,
  unitLoading,
  onAddUnit,
  onDeleteUnit,
  labels,
}: ProductsEditorModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    getActiveCategories()
      .then((data) => {
        if (!cancelled) setCategories(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form action={onSubmit} className="space-y-4">
        <Input
          label={labels.productName}
          name="name"
          required
          defaultValue={editing?.name}
        />
        <Input
          label={labels.sku}
          name="sku"
          required
          defaultValue={editing?.sku}
        />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {labels.category}
            </label>
            <Link
              href="/catalog/categories"
              target="_blank"
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {labels.manageCategories} →
            </Link>
          </div>
          <Select
            id="category"
            name="category"
            options={[
              { value: "", label: `— ${labels.categoryPlaceholder} —` },
              ...categories.map((c: Category) => ({
                value: c.name,
                label: c.name,
              })),
            ]}
            defaultValue={editing?.category ?? ""}
          />
        </div>
        <Select
          label={labels.unit}
          name="unit"
          options={unitOptions}
          defaultValue={editing?.unit ?? "pcs"}
        />
        <NumericInput
          label={labels.sellingPrice}
          name="selling_price"
          required
          defaultValue={editing?.selling_price}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumericInput
            label={labels.bulkPriceOptional}
            name="bulk_price"
            defaultValue={editing?.bulk_price ?? ""}
            placeholder={labels.bulkPricePlaceholder}
          />
          <Input
            label={labels.bulkMinQty}
            name="bulk_min_qty"
            type="number"
            min="2"
            step="1"
            defaultValue={editing?.bulk_min_qty ?? ""}
            placeholder={labels.bulkMinQtyPlaceholder}
          />
        </div>
        {editing?.latest_cost_price != null && (
          <p className="text-xs text-gray-500">
            Latest cost: {formatCurrency(editing.latest_cost_price)} · Margin:{" "}
            {(
              ((editing.selling_price - editing.latest_cost_price) /
                editing.selling_price) *
              100
            ).toFixed(1)}
            %
          </p>
        )}
        {editing && (
          <details className="text-xs">
            <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-400 select-none">
              {labels.priceHistory}
            </summary>
            <div className="mt-2 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              {priceHistory.length === 0 ? (
                <p className="py-3 px-4 text-gray-400">
                  {labels.noPriceHistory}
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500">
                      <th className="text-left py-2 px-3 font-medium">Date</th>
                      <th className="text-right py-2 px-3 font-medium">
                        Price
                      </th>
                      <th className="text-right py-2 px-3 font-medium">
                        Bulk price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-gray-50 dark:border-gray-700/50"
                      >
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {new Date(row.effective_from).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(row.price)}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">
                          {row.bulk_price
                            ? `${formatCurrency(row.bulk_price)} (≥${row.bulk_min_qty})`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>
        )}
        {editing && (
          <details className="text-xs">
            <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-400 select-none">
              {labels.unitsConversions}
            </summary>
            <div className="mt-2 space-y-2">
              <div className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                {productUnits.length === 0 ? (
                  <p className="py-3 px-4 text-gray-400">{labels.noUnitsYet}</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500">
                        <th className="text-left py-2 px-3 font-medium">
                          {labels.unitName}
                        </th>
                        <th className="text-right py-2 px-3 font-medium">
                          {labels.conversionToBase}
                        </th>
                        <th className="text-center py-2 px-3 font-medium">
                          {labels.isBaseUnit}
                        </th>
                        <th className="py-2 px-3" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {productUnits.map((u) => (
                        <tr
                          key={u.id}
                          className="border-t border-gray-50 dark:border-gray-700/50"
                        >
                          <td className="py-2 px-3 text-gray-900 dark:text-gray-100 font-medium">
                            {u.unit_name}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                            {u.is_base ? "1" : `${u.conversion_to_base}`}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {u.is_base && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {labels.baseLabel}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => onDeleteUnit(u.id)}
                              disabled={unitLoading}
                              className="text-red-500 hover:text-red-700 disabled:opacity-40"
                              aria-label={labels.deleteUnit}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-[100px]">
                  <label
                    htmlFor="new-unit-name"
                    className="block text-gray-500 dark:text-gray-400 mb-1"
                  >
                    {labels.unitName}
                  </label>
                  <input
                    id="new-unit-name"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newUnit.unit_name}
                    onChange={(e) =>
                      onNewUnitChange((prev) => ({
                        ...prev,
                        unit_name: e.target.value,
                      }))
                    }
                    aria-label={labels.unitName}
                  />
                </div>
                <div className="flex-1 min-w-[80px]">
                  <label
                    htmlFor="new-unit-conversion"
                    className="block text-gray-500 dark:text-gray-400 mb-1"
                  >
                    {labels.conversionToBase}
                  </label>
                  <input
                    id="new-unit-conversion"
                    type="number"
                    min="0.001"
                    step="any"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newUnit.conversion_to_base}
                    onChange={(e) =>
                      onNewUnitChange((prev) => ({
                        ...prev,
                        conversion_to_base: e.target.value,
                      }))
                    }
                    aria-label={labels.conversionToBase}
                  />
                </div>
                <div className="flex items-center gap-1 pb-1">
                  <input
                    id="new-unit-is-base"
                    type="checkbox"
                    checked={newUnit.is_base}
                    onChange={(e) =>
                      onNewUnitChange((prev) => ({
                        ...prev,
                        is_base: e.target.checked,
                      }))
                    }
                    className="h-3 w-3 rounded"
                  />
                  <label
                    htmlFor="new-unit-is-base"
                    className="text-gray-500 dark:text-gray-400 select-none"
                  >
                    {labels.isBaseUnit}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={onAddUnit}
                  disabled={unitLoading}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {labels.addUnit}
                </button>
              </div>
            </div>
          </details>
        )}
        <ImageUpload
          label={labels.productImage}
          value={imageUrl}
          onChange={onImageUrlChange}
          folder="products"
        />
        <input type="hidden" name="image_url" value={imageUrl} />
        {editing && (
          <Select
            label={labels.status}
            name="is_active"
            options={[
              { value: "true", label: labels.active },
              { value: "false", label: labels.inactive },
            ]}
            defaultValue={String(editing.is_active)}
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? labels.saving : editing ? labels.update : labels.create}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
