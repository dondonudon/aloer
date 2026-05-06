"use client";

import { Download, Loader2, Pencil, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  ActiveFilter,
  FilterBar,
  RangeFilter,
  SearchFilter,
  SelectFilter,
  type SelectFilterOption,
} from "@/components/ui/filters";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import {
  createProduct,
  deleteProductUnit,
  getProductPriceHistory,
  getProductUnits,
  updateProduct,
  upsertProductUnit,
} from "@/lib/actions/products";
import { useI18n } from "@/lib/i18n/context";
import type { Product, ProductPrice, ProductUnit } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const ProductEditorModal = dynamic(
  () => import("./product-editor-modal").then((mod) => mod.ProductEditorModal),
  { ssr: false },
);

export interface ProductsFilterState {
  search: string;
  category: string;
  unit: string;
  /** "" | "true" | "false" — string form lives in the URL */
  active: string;
  minPrice: string;
  maxPrice: string;
}

interface ProductsClientProps {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
  filters: ProductsFilterState;
}

function MarginBadge({
  sellingPrice,
  costPrice,
}: {
  sellingPrice: number;
  costPrice: number;
}) {
  const margin =
    sellingPrice > 0
      ? (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1)
      : "0.0";
  const marginNum = parseFloat(margin);
  const color =
    marginNum < 10
      ? "bg-red-50 text-red-700"
      : marginNum < 25
        ? "bg-yellow-50 text-yellow-700"
        : "bg-green-50 text-green-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
      title={`Cost: ${formatCurrency(costPrice)}`}
    >
      {margin}%
    </span>
  );
}

const EMPTY_FILTERS: ProductsFilterState = {
  search: "",
  category: "",
  unit: "",
  active: "",
  minPrice: "",
  maxPrice: "",
};

function buildQuery(
  filters: ProductsFilterState,
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.unit) params.set("unit", filters.unit);
  if (filters.active) params.set("active", filters.active);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
  }
  return params;
}

export function ProductsClient({
  products,
  total,
  page,
  pageSize,
  categories,
  filters: initialFilters,
}: ProductsClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const unitOptions = [
    { value: "pcs", label: t.products.unitPcs },
    { value: "kg", label: t.products.unitKg },
    { value: "pack", label: t.products.unitPack },
    { value: "box", label: t.products.unitBox },
    { value: "liter", label: t.products.unitLiter },
  ];

  const categoryFilterOptions: SelectFilterOption[] = [
    { value: "", label: t.filter.allCategories },
    ...categories.map((c) => ({ value: c, label: c })),
  ];
  const unitFilterOptions: SelectFilterOption[] = [
    { value: "", label: t.filter.allUnits },
    ...unitOptions,
  ];

  const [filters, setFilters] = useState<ProductsFilterState>(initialFilters);
  const hasActiveFilters =
    !!filters.search ||
    !!filters.category ||
    !!filters.unit ||
    !!filters.active ||
    !!filters.minPrice ||
    !!filters.maxPrice;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<ProductPrice[]>([]);
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [newUnit, setNewUnit] = useState({
    unit_name: "",
    conversion_to_base: "",
    is_base: false,
  });
  const [unitLoading, setUnitLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const editorLabels = {
    productName: t.products.name,
    sku: t.products.sku,
    manageCategories: t.products.manageCategories,
    category: t.products.categoryName,
    categoryPlaceholder: t.products.categoryPlaceholder,
    unit: t.products.unit,
    sellingPrice: t.products.sellingPrice,
    bulkPriceOptional: t.products.bulkPriceOptional,
    bulkPricePlaceholder: t.products.bulkPricePlaceholder,
    bulkMinQty: t.products.bulkMinQty,
    bulkMinQtyPlaceholder: t.products.bulkMinQtyPlaceholder,
    priceHistory: t.products.priceHistory,
    noPriceHistory: t.products.noPriceHistory,
    unitsConversions: t.products.unitsConversions,
    noUnitsYet: t.products.noUnitsYet,
    unitName: t.products.unitName,
    conversionToBase: t.products.conversionToBase,
    isBaseUnit: t.products.isBaseUnit,
    baseLabel: t.products.baseLabel,
    deleteUnit: t.products.deleteUnit,
    addUnit: t.products.addUnit,
    productImage: t.products.productImage,
    status: t.products.status,
    active: t.products.active,
    inactive: t.products.inactive,
    cancel: t.common.cancel,
    saving: t.common.saving,
    create: t.common.create,
    update: t.common.update,
  };

  const navigate = useCallback(
    (next: ProductsFilterState) => {
      const qs = buildQuery(next).toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router],
  );

  // Text-typed inputs (search + price range) are debounced;
  // select filters navigate immediately via `updateFilter`.
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  });
  const isFirstRender = useRef(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: search/minPrice/maxPrice are intentional debounce triggers — we read the rest from filtersRef so a stale immediate-navigate doesn't get overwritten.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = setTimeout(() => navigate(filtersRef.current), 400);
    return () => clearTimeout(handle);
  }, [filters.search, filters.minPrice, filters.maxPrice, navigate]);

  function updateFilter<K extends keyof ProductsFilterState>(
    key: K,
    value: ProductsFilterState[K],
    immediate = true,
  ) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (immediate) navigate(next);
  }

  function clearAll() {
    setFilters(EMPTY_FILTERS);
    navigate(EMPTY_FILTERS);
  }

  const buildHref = useCallback(
    (p: number) => {
      const params = buildQuery(filters);
      if (pageSize !== 10) params.set("limit", String(pageSize));
      if (p > 1) params.set("page", String(p));
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [filters, pageSize, pathname],
  );

  const buildLimitHref = useCallback(
    (limit: number) => {
      const params = buildQuery(filters);
      if (limit !== 10) params.set("limit", String(limit));
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [filters, pathname],
  );

  const totalPages = Math.ceil(total / pageSize);

  function openCreate() {
    setEditing(null);
    setImageUrl("");
    setPriceHistory([]);
    setProductUnits([]);
    setNewUnit({ unit_name: "", conversion_to_base: "", is_base: false });
    setModalOpen(true);
  }

  async function downloadShareImage(product: Product) {
    if (downloadingId) return;
    setDownloadingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}/share`);
      if (!res.ok) throw new Error("Failed to generate image");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      a.href = url;
      a.download = `${slug}-${ts}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ message: "Failed to download image", type: "error" });
    } finally {
      setDownloadingId(null);
    }
  }

  async function openEdit(product: Product) {
    setEditing(product);
    setImageUrl(product.image_url ?? "");
    setPriceHistory([]);
    setProductUnits([]);
    setNewUnit({ unit_name: "", conversion_to_base: "", is_base: false });
    setModalOpen(true);
    const [history, units] = await Promise.all([
      getProductPriceHistory(product.id),
      getProductUnits(product.id),
    ]);
    setPriceHistory(history);
    setProductUnits(units);
  }

  async function handleAddUnit() {
    if (!editing) return;
    const convNum = parseFloat(newUnit.conversion_to_base);
    if (!newUnit.unit_name.trim() || Number.isNaN(convNum) || convNum <= 0) {
      setToast({
        message: "Unit name and a positive conversion value are required",
        type: "error",
      });
      return;
    }
    setUnitLoading(true);
    const result = await upsertProductUnit(editing.id, {
      unit_name: newUnit.unit_name.trim(),
      conversion_to_base: convNum,
      is_base: newUnit.is_base,
    });
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: t.products.unitAdded, type: "success" });
      setNewUnit({ unit_name: "", conversion_to_base: "", is_base: false });
      const units = await getProductUnits(editing.id);
      setProductUnits(units);
    }
    setUnitLoading(false);
  }

  async function handleDeleteUnit(unitId: string) {
    if (!editing) return;
    setUnitLoading(true);
    const result = await deleteProductUnit(unitId);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: t.products.unitDeleted, type: "success" });
      const units = await getProductUnits(editing.id);
      setProductUnits(units);
    }
    setUnitLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    let result: { error?: string; success?: boolean };
    if (editing) {
      result = await updateProduct(editing.id, formData);
    } else {
      result = await createProduct(formData);
    }

    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({
        message: editing ? t.products.updated : t.products.created,
        type: "success",
      });
      setModalOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  const columns: DataTableColumn<Product>[] = [
    {
      id: "sku",
      header: t.products.sku,
      cell: (p) => (
        <span className="font-mono text-gray-700 dark:text-gray-300">
          {p.sku}
        </span>
      ),
    },
    {
      id: "name",
      header: t.products.name,
      cell: (p) => (
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          {p.name}
        </span>
      ),
    },
    {
      id: "category",
      header: t.products.category,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (p) => p.category || "—",
    },
    {
      id: "unit",
      header: t.products.unit,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (p) => p.unit,
    },
    {
      id: "price",
      header: t.products.price,
      align: "right",
      cellClassName: "text-gray-900 dark:text-gray-100",
      cell: (p) => formatCurrency(p.selling_price),
    },
    {
      id: "bulkPrice",
      header: t.products.bulkPrice,
      align: "right",
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (p) =>
        p.bulk_price
          ? `${formatCurrency(p.bulk_price)} (≥${p.bulk_min_qty})`
          : "—",
    },
    {
      id: "margin",
      header: t.products.margin,
      align: "right",
      cell: (p) =>
        p.latest_cost_price ? (
          <MarginBadge
            sellingPrice={p.selling_price}
            costPrice={p.latest_cost_price}
          />
        ) : (
          <span className="text-gray-400 text-xs">{t.products.noCostData}</span>
        ),
    },
    {
      id: "status",
      header: t.products.status,
      align: "center",
      cell: (p) => (
        <StatusBadge
          active={p.is_active}
          activeLabel={t.products.active}
          inactiveLabel={t.products.inactive}
        />
      ),
    },
    {
      id: "actions",
      header: t.products.actions,
      align: "center",
      cell: (p) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => openEdit(p)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Edit ${p.name}`}
          >
            <Pencil className="h-4 w-4 text-gray-500" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => downloadShareImage(p)}
            disabled={downloadingId === p.id}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Download image for ${p.name}`}
          >
            {downloadingId === p.id ? (
              <Loader2
                className="h-4 w-4 text-gray-500 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Download className="h-4 w-4 text-gray-500" aria-hidden="true" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.products.title}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.products.addProduct}
        </Button>
      </div>

      <FilterBar onClear={hasActiveFilters ? clearAll : undefined}>
        <SearchFilter
          value={filters.search}
          onChange={(v) => updateFilter("search", v, false)}
          placeholder={t.products.searchPlaceholder}
        />
        <SelectFilter
          label={t.filter.filterByCategory}
          srOnlyLabel
          value={filters.category}
          onChange={(v) => updateFilter("category", v)}
          options={categoryFilterOptions}
        />
        <SelectFilter
          label={t.filter.filterByUnit}
          srOnlyLabel
          value={filters.unit}
          onChange={(v) => updateFilter("unit", v)}
          options={unitFilterOptions}
        />
        <RangeFilter
          label={t.filter.priceRange}
          idPrefix="products-price"
          min={filters.minPrice}
          onMinChange={(v) => updateFilter("minPrice", v, false)}
          max={filters.maxPrice}
          onMaxChange={(v) => updateFilter("maxPrice", v, false)}
          minPlaceholder={t.filter.minPlaceholder}
          maxPlaceholder={t.filter.maxPlaceholder}
        />
        <ActiveFilter
          value={filters.active}
          onChange={(v) => updateFilter("active", v)}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={products}
        rowKey={(p) => p.id}
        emptyMessage={t.products.noProductsFound}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={buildHref}
        pageSize={pageSize}
        buildLimitHref={buildLimitHref}
      />

      <ProductEditorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t.products.editProduct : t.products.newProduct}
        onSubmit={handleSubmit}
        editing={editing}
        unitOptions={unitOptions}
        imageUrl={imageUrl}
        onImageUrlChange={setImageUrl}
        loading={loading}
        priceHistory={priceHistory}
        productUnits={productUnits}
        newUnit={newUnit}
        onNewUnitChange={setNewUnit}
        unitLoading={unitLoading}
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
        labels={editorLabels}
      />

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
